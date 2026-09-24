"""P3 evaluation: pretrained vs fine-tuned encoders, and the full router.

    python -m tradexcel_ml.evaluate      # writes reports/finetune.md + artifacts/router_config.json

For every encoder, on `val` only: pick the fusion weight, the intent head's C,
and the router thresholds. Then report `test` and `test_ood` once. The encoder
with the best val utility becomes the one exported for the runtime.
"""

from __future__ import annotations

import itertools
import json
from collections import defaultdict
from pathlib import Path

import numpy as np
import yaml
from sklearn.linear_model import LogisticRegression

from . import metrics
from .baselines import measure_latency
from .data import build_dataset, by_split, load_export
from .encoders import Encoder
from .guard_rules import guard_match
from .linker import StockLinker
from .paths import ARTIFACTS_DIR, CONFIG_DIR, REPORTS_DIR
from .retrieval import BM25Retriever, Index, ranks_of
from .router import STOCK_INTENTS, Policy, decide, outcome, summarize

SPLITS = ("val", "test", "test_ood")
FUSION_WEIGHTS = [round(w, 2) for w in np.arange(0.5, 1.001, 0.05)]  # weight on the dense ranking
C_GRID = [0.3, 1, 3, 10, 30]
T_GUARD = [0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.01]
T_OOS = [0.0, 0.2, 0.3, 0.4, 0.5]
T_CARD = [0.0, 0.3, 0.4, 0.5, 0.55, 0.6, 0.65, 0.7, 0.75]


def weighted_rrf(dense: np.ndarray, sparse: np.ndarray, w: float, k: int = 60) -> np.ndarray:
    def ranks(s):
        order = np.argsort(-s, axis=1)
        r = np.empty_like(order)
        r[np.arange(s.shape[0])[:, None], order] = np.arange(1, s.shape[1] + 1)
        return r

    return w / (k + ranks(dense)) + (1 - w) / (k + ranks(sparse))


def encoder_specs(cfg: dict) -> list[tuple[str, str, str, str]]:
    """(label, path-or-hub-name, key, variant) for every encoder we can evaluate."""
    out = []
    for key, spec in cfg["models"].items():
        out.append((f"{spec['label']} (pretrained)", spec["name"], key, "pretrained"))
        tuned = ARTIFACTS_DIR / "models" / key
        if (tuned / "training_history.json").exists():
            out.append((f"{spec['label']} (fine-tuned)", str(tuned), key, "fine-tuned"))
    return out


def main() -> None:
    cfg = yaml.safe_load((CONFIG_DIR / "finetune.yaml").read_text())
    seed = cfg["seed"]
    export = load_export()
    linker = StockLinker(export["stocks"], export["entities"])
    examples = build_dataset(export, linker, seed)
    cards = export["cards"]
    card_ids = [c["id"] for c in cards]
    card_index = {c: i for i, c in enumerate(card_ids)}
    card_intents = np.asarray([c["intent"] for c in cards])
    guard_mask = card_intents == "guardrail"

    train_q = defaultdict(list)
    for e in by_split(examples, "train"):
        if e.source == "card":
            train_q[e.card].append(e.text)
    index = Index(cards, train_q)
    rows = {s: by_split(examples, s) for s in SPLITS}
    train = by_split(examples, "train")
    bm25 = BM25Retriever(index)
    sparse = {s: bm25.score([e.text for e in rows[s]]) for s in SPLITS}
    rules = {s: [guard_match(e.text) is not None for e in rows[s]] for s in SPLITS}
    def stocks_right(e) -> bool:
        # A price/holding answer only counts if it's about the right stocks.
        return e.intent not in STOCK_INTENTS or sorted(linker.link(e.text).symbols) == sorted(e.stocks)

    stocks_ok = {s: [stocks_right(e) for e in rows[s]] for s in SPLITS}
    rule_quality = {
        s: {
            "recall": float(np.mean([r for r, e in zip(rules[s], rows[s]) if e.intent == "guardrail"])),
            "false_positives": int(sum(r for r, e in zip(rules[s], rows[s]) if e.intent != "guardrail")),
        }
        for s in SPLITS
    }

    results, configs = {}, {}
    for label, path, key, variant in encoder_specs(cfg):
        print(f"evaluating {label}")
        enc = Encoder(path)
        matrix = enc.encode(index.texts)
        dense = {s: index.card_scores(enc.encode([e.text for e in rows[s]]) @ matrix.T) for s in SPLITS}
        card_rows = {s: [i for i, e in enumerate(rows[s]) if e.card] for s in SPLITS}
        gold = {s: [card_index[rows[s][i].card] for i in card_rows[s]] for s in SPLITS}

        def r_metrics(scores, s):
            return metrics.retrieval_metrics(ranks_of(scores[card_rows[s]], gold[s]))

        # fusion weight on val R@1
        w = max(FUSION_WEIGHTS, key=lambda w: (r_metrics(weighted_rrf(dense["val"], sparse["val"], w), "val")["R@1"], w))
        fused = {s: weighted_rrf(dense[s], sparse[s], w) for s in SPLITS}

        # intent head: C on val macro-F1
        X_train = enc.encode([e.text for e in train])
        y_train = [e.intent for e in train]
        X = {s: enc.encode([e.text for e in rows[s]]) for s in SPLITS}

        def fit(c):
            return LogisticRegression(max_iter=4000, C=c, class_weight="balanced", random_state=seed).fit(X_train, y_train)

        best_c = max(C_GRID, key=lambda c: metrics.classification_metrics([e.intent for e in rows["val"]], list(fit(c).predict(X["val"])))["macro_f1"])
        clf = fit(best_c)
        probs = {s: [dict(zip(clf.classes_, p)) for p in clf.predict_proba(X[s])] for s in SPLITS}

        def run(policy: Policy, s: str):
            decisions = [
                decide(policy, rules[s][i], probs[s][i], fused[s][i], dense[s][i], card_ids, card_intents, guard_mask)
                for i in range(len(rows[s]))
            ]
            outs = [outcome(d, e.intent, e.card, ok) for d, e, ok in zip(decisions, rows[s], stocks_ok[s])]
            return decisions, outs

        # Router thresholds on val: best utility among policies that catch every val guardrail.
        candidates = []
        for tg, to, tc, restrict in itertools.product(T_GUARD, T_OOS, T_CARD, (True, False)):
            p = Policy(tg, to, tc, restrict)
            decisions, outs = run(p, "val")
            summary = summarize(outs, decisions, [e.intent for e in rows["val"]])
            candidates.append((summary["guardrail_recall"] == 1.0, summary["utility"], tg, p))
        _, _, _, policy = max(candidates, key=lambda c: (c[0], c[1], -c[2]))

        entry = {
            "variant": variant,
            "fusion_weight": w,
            "intent_C": best_c,
            "policy": policy.__dict__,
            "retrieval": {s: {"dense": r_metrics(dense[s], s), "fused": r_metrics(fused[s], s)} for s in SPLITS},
            "intent": {},
            "router": {},
        }
        for s in SPLITS:
            preds = [max(p, key=p.get) for p in probs[s]]
            m = metrics.classification_metrics([e.intent for e in rows[s]], preds)
            entry["intent"][s] = {"macro_f1": m["macro_f1"], "accuracy": m["accuracy"], "per_class_f1": {k: v["f1"] for k, v in m["per_class"].items()}}
            decisions, outs = run(policy, s)
            entry["router"][s] = summarize(outs, decisions, [e.intent for e in rows[s]])
            if s == "test_ood":
                entry["ood_router_intents"] = [d.intent for d in decisions]
                entry["ood_failures"] = [
                    {"text": e.text, "style": e.style, "expected": e.card or e.intent, "got": d.card or d.intent, "kind": d.kind, "outcome": o}
                    for e, d, o in zip(rows[s], decisions, outs)
                    if o != "correct"
                ]
        entry["latency_ms"] = measure_latency(enc, [e.text for e in rows["test_ood"]][:50])
        results[label] = entry
        configs[label] = {
            "model_path": path,
            "model_key": key,
            "variant": variant,
            "pooling": cfg["models"][key]["pooling"],
            "fusion_weight": w,
            "policy": policy.__dict__,
            "intent_head": {"classes": list(clf.classes_), "coef": clf.coef_.tolist(), "intercept": clf.intercept_.tolist()},
        }
        enc.close()

    selected = max(results, key=lambda n: results[n]["router"]["val"]["utility"])
    out = {"kb_hash": export["kb_hash"], "selected": selected, "rule_quality": rule_quality, "results": results}
    REPORTS_DIR.mkdir(exist_ok=True)
    (REPORTS_DIR / "finetune.json").write_text(json.dumps({k: v for k, v in out.items()}, indent=2, default=float))
    router_cfg = {"kb_hash": export["kb_hash"], "selected": selected, **configs[selected]}
    (ARTIFACTS_DIR / "router_config.json").write_text(json.dumps(router_cfg, indent=2))

    from .report_p3 import write_p3_report

    write_p3_report(out, [e.intent for e in rows["test_ood"]])
    print(f"selected {selected}; wrote {REPORTS_DIR / 'finetune.md'}")


if __name__ == "__main__":
    main()
