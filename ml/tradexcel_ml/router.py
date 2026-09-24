"""The full answer policy, as the runtime will run it, plus threshold tuning.

For one message:
1. guard rules match            -> guardrail card
2. classifier P(guardrail) >= t_guard -> guardrail card
3. max P < t_oos or argmax is out_of_scope -> fallback
4. live-data intent             -> that intent (+ linked stocks for stock intents)
5. card-backed intent           -> retrieval (optionally only over that intent's
   cards); top score < t_card   -> "did you mean" with the top 3

Thresholds are chosen on `val` only.
"""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np

CARD_INTENTS = {"faq_platform", "faq_education", "guardrail", "smalltalk"}
STOCK_INTENTS = {"price_quote", "holding_detail"}


@dataclass
class Decision:
    kind: str  # answer / clarify / data / fallback / guardrail
    intent: str
    card: str | None = None
    top3: tuple[str, ...] = ()


@dataclass
class Policy:
    t_guard: float
    t_oos: float
    t_card: float
    restrict: bool  # search only the predicted intent's cards


def decide(
    policy: Policy,
    rule_hit: bool,
    probs: dict[str, float],
    rank_scores: np.ndarray,
    confidence: np.ndarray,
    card_ids: list[str],
    card_intents: np.ndarray,
    guard_mask: np.ndarray,
) -> Decision:
    """`rank_scores` order the cards (possibly fused); `confidence` is the raw
    cosine similarity used for the gate, since fused rank scores aren't calibrated."""

    def best_cards(mask: np.ndarray):
        s = np.where(mask, rank_scores, -np.inf)
        order = np.argsort(-s)[:3]
        return order, float(confidence[order[0]])

    if rule_hit or probs.get("guardrail", 0.0) >= policy.t_guard:
        order, _ = best_cards(guard_mask)
        return Decision("guardrail", "guardrail", card_ids[order[0]])
    intent = max(probs, key=probs.get)
    if intent == "out_of_scope" or probs[intent] < policy.t_oos:
        return Decision("fallback", "out_of_scope")
    if intent not in CARD_INTENTS:
        return Decision("data", intent)
    order, top = best_cards(card_intents == intent if policy.restrict else ~guard_mask)
    top3 = tuple(card_ids[i] for i in order)
    if top < policy.t_card:
        return Decision("clarify", intent, None, top3)
    return Decision("answer", intent, top3[0], top3)


def outcome(d: Decision, gold_intent: str, gold_card: str | None, stocks_ok: bool = True) -> str:
    """correct / clarify_ok (right card offered) / clarify_miss / wrong. For
    stock intents the linked stocks must be right too (`stocks_ok`)."""
    if gold_card is not None:
        if d.kind in ("answer", "guardrail") and d.card == gold_card:
            return "correct"
        if d.kind == "clarify":
            return "clarify_ok" if gold_card in d.top3 else "clarify_miss"
        return "wrong"
    if gold_intent == "out_of_scope":
        return "correct" if d.kind == "fallback" else "wrong"
    return "correct" if d.kind == "data" and d.intent == gold_intent and stocks_ok else "wrong"


# A wrong answer is worse than asking; asking without the right option is useless.
UTILITY = {"correct": 1.0, "clarify_ok": 0.5, "clarify_miss": 0.0, "wrong": -1.0}


def summarize(outcomes: list[str], decisions: list[Decision], gold_intents: list[str]) -> dict:
    n = len(outcomes)
    guard = [d.kind == "guardrail" for d in decisions]
    is_guard = [g == "guardrail" for g in gold_intents]
    fallback = [d.kind == "fallback" for d in decisions]
    is_oos = [g == "out_of_scope" for g in gold_intents]

    def rate(hits, among):
        chosen = [h for h, a in zip(hits, among) if a]
        return float(np.mean(chosen)) if chosen else None

    return {
        "n": n,
        "correct": outcomes.count("correct") / n,
        "helpful": (outcomes.count("correct") + outcomes.count("clarify_ok")) / n,
        "wrong": outcomes.count("wrong") / n,
        "clarify_rate": sum(d.kind == "clarify" for d in decisions) / n,
        "utility": float(np.mean([UTILITY[o] for o in outcomes])),
        "guardrail_recall": rate(guard, is_guard),
        "guardrail_false_positive_rate": rate(guard, [not g for g in is_guard]),
        "oos_recall": rate(fallback, is_oos),
        "oos_false_positive_rate": rate(fallback, [not o for o in is_oos]),
    }
