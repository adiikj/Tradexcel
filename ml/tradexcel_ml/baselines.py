"""P2: baseline retrieval, intent and stock-linking results.

    python -m tradexcel_ml.baselines            # writes reports/baselines.{md,json}

Protocol: the retriever indexes card titles + *train* questions only. Model
choices are made on `val`; `test` (same distribution) and `test_ood` (the
hand-written held-out set) are reported, never tuned on.
"""

from __future__ import annotations

import json
import time
from collections import defaultdict

import numpy as np
import yaml

from . import metrics
from .data import Example, build_dataset, by_split, load_export
from .encoders import Encoder
from .intent import EmbeddingKNN, EmbeddingLogReg, TfidfLogReg
from .linker import StockLinker
from .paths import ARTIFACTS_DIR, CONFIG_DIR, REPORTS_DIR
from .report import write_report
from .retrieval import BM25Retriever, DenseRetriever, Index, TfidfRetriever, ranks_of, rrf

EVAL_SPLITS = ("val", "test", "test_ood")


def main() -> None:
    cfg = yaml.safe_load((CONFIG_DIR / "baselines.yaml").read_text())
    seed = cfg["seed"]
    export = load_export()
    linker = StockLinker(export["stocks"], export["entities"])
    examples = build_dataset(export, linker, seed)
    cards = export["cards"]
    card_index = {c["id"]: i for i, c in enumerate(cards)}

    results: dict = {"kb_hash": export["kb_hash"], "seed": seed, "sizes": {}, "retrieval": {}, "intent": {}}
    for split in ("train", *EVAL_SPLITS):
        rows = by_split(examples, split)
        results["sizes"][split] = {"total": len(rows), "card_targets": sum(e.card is not None for e in rows)}

    # ---- retrieval ----
    train_q: dict[str, list[str]] = defaultdict(list)
    for e in by_split(examples, "train"):
        if e.source == "card":
            train_q[e.card].append(e.text)
    index = Index(cards, train_q)
    retrieval_sets = {s: [e for e in by_split(examples, s) if e.card is not None] for s in EVAL_SPLITS}
    gold = {s: [card_index[e.card] for e in rows] for s, rows in retrieval_sets.items()}
    ood_styles = [e.style for e in retrieval_sets["test_ood"]]
    scores: dict[str, dict[str, np.ndarray]] = {}
    misses: dict[str, list] = {}

    def record(name: str, per_split: dict[str, np.ndarray]) -> None:
        scores[name] = per_split
        entry = {s: metrics.retrieval_metrics(ranks_of(per_split[s], gold[s])) for s in EVAL_SPLITS}
        ood_ranks = ranks_of(per_split["test_ood"], gold["test_ood"])
        by_style = defaultdict(list)
        for style, r in zip(ood_styles, ood_ranks):
            by_style[style].append(r)
        entry["ood_R@1_by_style"] = {k: float(np.mean(np.asarray(v) <= 1)) for k, v in sorted(by_style.items())}
        results["retrieval"][name] = entry
        top = per_split["test_ood"].argmax(axis=1)
        misses[name] = [
            {"text": e.text, "expected": e.card, "got": cards[t]["id"], "style": e.style}
            for e, t, g in zip(retrieval_sets["test_ood"], top, gold["test_ood"])
            if t != g
        ]

    for retriever in (BM25Retriever(index), TfidfRetriever(index)):
        record(retriever.name, {s: retriever.score([e.text for e in rows]) for s, rows in retrieval_sets.items()})

    # ---- intent (sparse) ----
    train = by_split(examples, "train")
    train_texts, train_labels = [e.text for e in train], [e.intent for e in train]
    intent_sets = {s: by_split(examples, s) for s in EVAL_SPLITS}
    predictions: dict[str, dict[str, list[str]]] = {}

    def evaluate_intent(model) -> None:
        model.fit(train_texts, train_labels)
        preds = {s: model.predict([e.text for e in rows]) for s, rows in intent_sets.items()}
        predictions[model.name] = preds
        results["intent"][model.name] = {s: summarize_intent(intent_sets[s], preds[s]) for s in EVAL_SPLITS}

    evaluate_intent(TfidfLogReg(seed))

    # ---- dense models, one at a time (memory) ----
    latency = {}
    for spec in cfg["dense_models"]:
        encoder = Encoder(spec["name"])
        label = spec["label"]
        dense = DenseRetriever(index, encoder, label)
        record(label, {s: dense.score([e.text for e in rows]) for s, rows in retrieval_sets.items()})
        record(f"Hybrid RRF (BM25 + {label})", {s: rrf([scores["BM25"][s], scores[label][s]], cfg["rrf_k"]) for s in EVAL_SPLITS})
        evaluate_intent(EmbeddingLogReg(encoder, label, seed))
        evaluate_intent(EmbeddingKNN(encoder, label))
        latency[label] = measure_latency(encoder, [e.text for e in intent_sets["test_ood"]][: cfg["latency_queries"]])
        encoder.close()
    results["encode_latency_ms"] = latency

    # ---- model selection on val, report test ----
    best_retriever = max(results["retrieval"], key=lambda n: results["retrieval"][n]["val"]["R@1"])
    best_intent = max(results["intent"], key=lambda n: results["intent"][n]["val"]["macro_f1"])
    results["selected"] = {"retrieval": best_retriever, "intent": best_intent}

    # ---- stock linker ----
    cases = export["entity_cases"]
    link_preds = [linker.link(c["text"]) for c in cases]
    results["linker"] = metrics.linker_metrics(cases, link_preds)
    results["linker_failures"] = [
        {"text": c["text"], "expected": c["stocks"], "expected_ambiguous": c.get("ambiguous"), "got": p.symbols, "got_ambiguous": p.ambiguous}
        for c, p in zip(cases, link_preds)
        if sorted(c["stocks"]) != sorted(p.symbols) or ([c["ambiguous"]] if c.get("ambiguous") else []) != p.ambiguous
    ]
    slot_cases = [e for e in by_split(examples, "test_ood") if e.intent in ("price_quote", "holding_detail", "my_alerts", "my_orders")]
    results["linker_on_heldout_slots"] = metrics.linker_metrics(
        [{"stocks": list(e.stocks)} for e in slot_cases], [linker.link(e.text) for e in slot_cases]
    )

    ARTIFACTS_DIR.mkdir(exist_ok=True)
    (ARTIFACTS_DIR / "baseline_retrieval_misses.json").write_text(json.dumps(misses, indent=2))
    REPORTS_DIR.mkdir(exist_ok=True)
    (REPORTS_DIR / "baselines.json").write_text(json.dumps(results, indent=2))
    labels = sorted({e.intent for e in examples})
    write_report(results, misses[best_retriever], predictions[best_intent], intent_sets, labels)
    print(f"Wrote {REPORTS_DIR / 'baselines.md'}")


def summarize_intent(rows: list[Example], preds: list[str]) -> dict:
    m = metrics.classification_metrics([e.intent for e in rows], preds)
    return {
        "accuracy": m["accuracy"],
        "macro_f1": m["macro_f1"],
        "guardrail_recall": m["per_class"].get("guardrail", {}).get("recall"),
        "out_of_scope_recall": m["per_class"].get("out_of_scope", {}).get("recall"),
        "per_class_f1": {k: v["f1"] for k, v in m["per_class"].items()},
    }


def measure_latency(encoder: Encoder, texts: list[str]) -> dict[str, float]:
    """Single-query encode time (batch of 1, cache bypassed), as the server would see it."""
    encoder.model.encode(["warm up"], show_progress_bar=False)
    times = []
    for t in texts:
        start = time.perf_counter()
        encoder.model.encode([t], show_progress_bar=False)
        times.append((time.perf_counter() - start) * 1000)
    return {"p50": float(np.percentile(times, 50)), "p95": float(np.percentile(times, 95))}


if __name__ == "__main__":
    main()
