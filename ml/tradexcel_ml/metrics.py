"""Evaluation metrics. Small and dependency-free so they're easy to test."""

from __future__ import annotations

from collections import Counter

import numpy as np


def retrieval_metrics(ranks: list[int], ks: tuple[int, ...] = (1, 3, 5)) -> dict[str, float]:
    """`ranks` are 1-based positions of the correct card in each ranking."""
    r = np.asarray(ranks, dtype=float)
    out = {f"R@{k}": float(np.mean(r <= k)) for k in ks}
    out["MRR"] = float(np.mean(1.0 / r))
    return out


def classification_metrics(y_true: list[str], y_pred: list[str]) -> dict:
    labels = sorted(set(y_true) | set(y_pred))
    per_class = {}
    for label in labels:
        tp = sum(t == label and p == label for t, p in zip(y_true, y_pred))
        fp = sum(t != label and p == label for t, p in zip(y_true, y_pred))
        fn = sum(t == label and p != label for t, p in zip(y_true, y_pred))
        precision = tp / (tp + fp) if tp + fp else 0.0
        recall = tp / (tp + fn) if tp + fn else 0.0
        f1 = 2 * precision * recall / (precision + recall) if precision + recall else 0.0
        per_class[label] = {"precision": precision, "recall": recall, "f1": f1, "support": tp + fn}
    present = [l for l in labels if per_class[l]["support"] > 0]
    return {
        "accuracy": float(np.mean([t == p for t, p in zip(y_true, y_pred)])),
        "macro_f1": float(np.mean([per_class[l]["f1"] for l in present])),
        "per_class": per_class,
    }


def confusion(y_true: list[str], y_pred: list[str], labels: list[str]) -> np.ndarray:
    index = {l: i for i, l in enumerate(labels)}
    m = np.zeros((len(labels), len(labels)), dtype=int)
    for t, p in zip(y_true, y_pred):
        m[index[t], index[p]] += 1
    return m


def linker_metrics(cases: list[dict], predictions: list) -> dict:
    """Exact-match accuracy (symbols and ambiguity flags both right) plus micro P/R/F1 over symbols."""
    exact = tp = fp = fn = amb_right = 0
    for case, pred in zip(cases, predictions):
        gold, got = Counter(case["stocks"]), Counter(pred.symbols)
        tp += sum((gold & got).values())
        fp += sum((got - gold).values())
        fn += sum((gold - got).values())
        gold_amb = [case["ambiguous"]] if case.get("ambiguous") else []
        amb_ok = sorted(gold_amb) == sorted(pred.ambiguous)
        amb_right += amb_ok
        exact += gold == got and amb_ok
    precision = tp / (tp + fp) if tp + fp else 0.0
    recall = tp / (tp + fn) if tp + fn else 0.0
    return {
        "exact_match": exact / len(cases),
        "precision": precision,
        "recall": recall,
        "f1": 2 * precision * recall / (precision + recall) if precision + recall else 0.0,
        "ambiguity_accuracy": amb_right / len(cases),
        "n": len(cases),
    }
