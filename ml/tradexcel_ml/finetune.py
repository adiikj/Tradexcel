"""P3: contrastive fine-tuning of a small sentence encoder.

    python -m tradexcel_ml.finetune minilm      # or: bge

One encoder serves both jobs at runtime, so it's trained on both at once:
- retrieval pairs: a card question -> another string of the same card
  (question, title or answer text)
- intent pairs: a live-data intent example -> another example of that intent

Loss: in-batch contrastive (InfoNCE / "multiple negatives ranking") plus one
mined hard negative per anchor. Unlike the stock loss, columns that belong to
the anchor's own group (same card or intent) are masked out, so two
paraphrases of the same card are never pushed apart as if they were negatives.

The best epoch is chosen on val + the dev held-out set (mean of retrieval R@1 and intent macro-F1);
test sets are not looked at here.
"""

from __future__ import annotations

import copy
import json
import random
import sys
import time
from collections import defaultdict
from dataclasses import dataclass

import numpy as np
import torch
import torch.nn.functional as F
import yaml
from sentence_transformers import SentenceTransformer
from sklearn.linear_model import LogisticRegression
from transformers import get_linear_schedule_with_warmup

from . import metrics
from .data import build_dataset, by_split, load_export
from .linker import StockLinker
from .paths import ARTIFACTS_DIR, CONFIG_DIR
from .retrieval import Index, plain_answer, ranks_of


@dataclass
class Anchor:
    text: str
    group: str  # card id, or intent:<id> for live-data intents
    intent: str = ""  # label for the multi-task intent head


def build_pools(cards: list[dict], train) -> tuple[list[Anchor], dict[str, list[str]]]:
    """Anchors to train on, and every train string per group (positives are drawn from these)."""
    pools: dict[str, list[str]] = defaultdict(list)
    for card in cards:
        pools[card["id"]] += [card["title"], plain_answer(card["answer"])]
    anchors = []
    for e in train:
        group = e.card if e.card else f"intent:{e.intent}"
        pools[group].append(e.text)
        anchors.append(Anchor(e.text, group, e.intent))
    return anchors, pools


def mine_negatives(model: SentenceTransformer, anchors: list[Anchor], pools: dict[str, list[str]], cards: list[dict], top_n: int) -> dict[str, list[str]]:
    """For each anchor, the strings from *other* groups the current model finds most similar."""
    strings, owners = [], []
    for group, texts in pools.items():
        strings += texts
        owners += [group] * len(texts)
    owners_arr = np.asarray(owners)
    emb = model.encode(strings, batch_size=64, normalize_embeddings=True, show_progress_bar=False)
    anchor_emb = model.encode([a.text for a in anchors], batch_size=64, normalize_embeddings=True, show_progress_bar=False)
    declared = {c["id"]: set(c["hard_negatives"]) for c in cards}
    out = {}
    sims = anchor_emb @ emb.T
    for a, row in zip(anchors, sims):
        row = np.where(owners_arr == a.group, -np.inf, row)
        picks = [strings[j] for j in np.argsort(-row)[:top_n]]
        # Hand-declared confusable cards count as hard negatives too.
        for neg_card in declared.get(a.group, ()):
            picks += random.sample(pools[neg_card], min(2, len(pools[neg_card])))
        out[a.text] = picks
    return out


def embed(model, texts):
    features = model.preprocess(texts) if hasattr(model, "preprocess") else model.tokenize(texts)
    return F.normalize(model(features)["sentence_embedding"], dim=-1)


def contrastive_loss(model, anchors: list[Anchor], positives: list[str], negatives: list[str], neg_groups: list[str], scale: float, a=None) -> torch.Tensor:
    a = embed(model, [x.text for x in anchors]) if a is None else a
    c = embed(model, positives + negatives)
    logits = a @ c.T * scale
    groups = [x.group for x in anchors]
    col_groups = groups + neg_groups
    n = len(anchors)
    mask = torch.zeros_like(logits, dtype=torch.bool)
    for i, g in enumerate(groups):
        for j, h in enumerate(col_groups):
            if j != i and h == g:
                mask[i, j] = True  # same card/intent: not a negative
    logits = logits.masked_fill(mask, float("-inf"))
    return F.cross_entropy(logits, torch.arange(n))


class IntentHead(torch.nn.Module):
    """Linear classifier on the normalised sentence embedding - the same
    softmax(W·x + b) the runtime already evaluates for its intent head."""

    def __init__(self, dim: int, classes: list[str]):
        super().__init__()
        self.classes = classes
        self.linear = torch.nn.Linear(dim, len(classes))

    def forward(self, x):
        return self.linear(x)

    def export(self) -> dict:
        return {"classes": self.classes, "coef": self.linear.weight.detach().tolist(), "intercept": self.linear.bias.detach().tolist()}


def evaluate_val(model: SentenceTransformer, cards, examples, seed: int, head: IntentHead | None = None) -> dict[str, float]:
    train_q = defaultdict(list)
    for e in by_split(examples, "train"):
        if e.source == "card":
            train_q[e.card].append(e.text)
    index = Index(cards, train_q)
    enc = lambda texts: model.encode(texts, batch_size=64, normalize_embeddings=True, show_progress_bar=False)  # noqa: E731
    matrix = enc(index.texts)
    # Epoch selection on val + the dev held-out set (the locked test is never touched here).
    dev = by_split(examples, "val") + by_split(examples, "ood_dev")
    val_cards = [e for e in dev if e.card]
    card_index = {c["id"]: i for i, c in enumerate(cards)}
    scores = index.card_scores(enc([e.text for e in val_cards]) @ matrix.T)
    r1 = metrics.retrieval_metrics(ranks_of(scores, [card_index[e.card] for e in val_cards]))["R@1"]

    train, val = by_split(examples, "train"), dev
    clf = LogisticRegression(max_iter=3000, C=10, class_weight="balanced", random_state=seed)
    clf.fit(enc([e.text for e in train]), [e.intent for e in train])
    val_emb = enc([e.text for e in val])
    f1 = metrics.classification_metrics([e.intent for e in val], list(clf.predict(val_emb)))["macro_f1"]
    out = {"val_R@1": r1, "val_intent_macro_f1": f1}
    if head is not None:
        with torch.no_grad():
            pred = head(torch.tensor(val_emb)).argmax(1).tolist()
        out["val_head_macro_f1"] = metrics.classification_metrics([e.intent for e in val], [head.classes[i] for i in pred])["macro_f1"]
    out["val_score"] = (r1 + max(f1, out.get("val_head_macro_f1", 0.0))) / 2
    return out


def main(model_key: str) -> None:
    cfg = yaml.safe_load((CONFIG_DIR / "finetune.yaml").read_text())
    spec, tc, seed = cfg["models"][model_key], cfg["train"], cfg["seed"]
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    torch.set_num_threads(4)

    export = load_export()
    linker = StockLinker(export["stocks"], export["entities"])
    examples = build_dataset(export, linker, seed, augment=cfg.get("augment", 0))
    cards = export["cards"]
    anchors, pools = build_pools(cards, by_split(examples, "train"))

    model = SentenceTransformer(spec["name"], device="cpu")
    model.max_seq_length = tc["max_seq_length"]
    if spec.get("gradient_checkpointing"):
        model[0].auto_model.gradient_checkpointing_enable()
    # Multi-task: an intent head trained jointly, so the embedding space is
    # shaped for classification as well as retrieval.
    mt = cfg.get("multitask") or {}
    head = None
    if mt.get("weight", 0) > 0:
        classes = sorted({a.intent for a in anchors})
        head = IntentHead(model.get_sentence_embedding_dimension(), classes)
        counts = np.array([sum(a.intent == c for a in anchors) for c in classes], dtype=float)
        class_weight = torch.tensor(counts.sum() / (len(classes) * counts), dtype=torch.float32)
        label_of = {c: i for i, c in enumerate(classes)}

    history = [{"epoch": 0, **evaluate_val(model, cards, examples, seed, head)}]
    print(f"[{spec['label']}] epoch 0 (pretrained): {history[-1]}")
    best_score, best_state = history[-1]["val_score"], copy.deepcopy(model.state_dict())
    best_head = copy.deepcopy(head.state_dict()) if head else None

    steps_per_epoch = (len(anchors) + tc["batch_size"] - 1) // tc["batch_size"]
    groups = [{"params": model.parameters(), "lr": tc["lr"]}]
    if head:
        groups.append({"params": head.parameters(), "lr": mt.get("head_lr", 2e-3)})
    optimizer = torch.optim.AdamW(groups, weight_decay=tc["weight_decay"])
    scheduler = get_linear_schedule_with_warmup(optimizer, int(tc["warmup_ratio"] * steps_per_epoch * tc["epochs"]), steps_per_epoch * tc["epochs"])
    group_of = {}
    for group, texts in pools.items():
        for t in texts:
            group_of.setdefault(t, group)

    for epoch in range(1, tc["epochs"] + 1):
        start = time.time()
        model.eval()
        mined = mine_negatives(model, anchors, pools, cards, tc["mined_candidates"])  # re-mined with the current model
        model.train()
        order = anchors[:]
        random.shuffle(order)
        losses = []
        for b in range(0, len(order), tc["batch_size"]):
            batch = order[b : b + tc["batch_size"]]
            positives = []
            for a in batch:
                candidates = [t for t in pools[a.group] if t != a.text] or [a.text]
                positives.append(random.choice(candidates))
            negatives = [random.choice(mined[a.text]) for a in batch for _ in range(tc["hard_negatives_per_anchor"])]
            a = embed(model, [x.text for x in batch])
            loss = contrastive_loss(model, batch, positives, negatives, [group_of[n] for n in negatives], tc["scale"], a=a)
            if head:
                y = torch.tensor([label_of[x.intent] for x in batch])
                loss = loss + mt["weight"] * F.cross_entropy(head(a), y, weight=class_weight)
            optimizer.zero_grad()
            loss.backward()
            torch.nn.utils.clip_grad_norm_(list(model.parameters()) + (list(head.parameters()) if head else []), 1.0)
            optimizer.step()
            scheduler.step()
            losses.append(loss.item())
        model.eval()
        entry = {"epoch": epoch, "train_loss": float(np.mean(losses)), "seconds": round(time.time() - start, 1), **evaluate_val(model, cards, examples, seed, head)}
        history.append(entry)
        print(f"[{spec['label']}] epoch {epoch}: {entry}")
        if entry["val_score"] > best_score:
            best_score, best_state = entry["val_score"], copy.deepcopy(model.state_dict())
            best_head = copy.deepcopy(head.state_dict()) if head else None

    model.load_state_dict(best_state)
    best_epoch = max(history, key=lambda h: h["val_score"])["epoch"]
    out_dir = ARTIFACTS_DIR / "models" / model_key
    model.save(str(out_dir))
    if head:
        head.load_state_dict(best_head)
        (out_dir / "intent_head.json").write_text(json.dumps(head.export()))
    (out_dir / "training_history.json").write_text(
        json.dumps({"base_model": spec["name"], "label": spec["label"], "pooling": spec["pooling"], "best_epoch": best_epoch, "config": tc, "history": history, "kb_hash": export["kb_hash"]}, indent=2)
    )
    print(f"[{spec['label']}] saved best epoch {best_epoch} to {out_dir}")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "minilm")
