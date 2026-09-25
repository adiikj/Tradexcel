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


# A card this similar overrides a *weak* live-data intent ("badges list" is
# about the badges card, not "my badges").
DATA_OVERRIDE_SIM = 0.85


@dataclass
class Policy:
    t_guard: float
    t_oos: float
    t_card: float
    restrict: bool  # search only the predicted intent's cards
    t_margin: float = 0.0  # ask if the top two cards are closer than this
    t_data: float = 0.0  # below this, a very close card beats a live-data intent


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
        order = np.argsort(-s, kind="stable")[:3]
        return order, float(confidence[order[0]])

    if rule_hit or probs.get("guardrail", 0.0) >= policy.t_guard:
        order, _ = best_cards(guard_mask)
        return Decision("guardrail", "guardrail", card_ids[order[0]])
    intent = max(probs, key=probs.get)
    if intent == "out_of_scope" or probs[intent] < policy.t_oos:
        return Decision("fallback", "out_of_scope")
    if intent not in CARD_INTENTS:
        if probs[intent] < policy.t_data:
            order, top = best_cards(~guard_mask)
            if top >= DATA_OVERRIDE_SIM:
                return Decision("answer", str(card_intents[order[0]]), card_ids[order[0]], tuple(card_ids[i] for i in order))
        return Decision("data", intent)
    mask = card_intents == intent if policy.restrict else ~guard_mask
    order, top = best_cards(mask)
    top3 = tuple(card_ids[i] for i in order)
    # Only a card that's actually eligible can make the choice ambiguous.
    second = float(confidence[order[1]]) if len(order) > 1 and mask[order[1]] else -np.inf
    if top < policy.t_card or top - second < policy.t_margin:
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


class FastPolicyEval:
    """Scores many policies at once over the same rows - the same decisions
    as `decide`, vectorised (tests/test_router.py checks they agree)."""

    KIND = {"answer": 0, "clarify": 1, "data": 2, "fallback": 3, "guardrail": 4}

    def __init__(self, rule_hits, probs, rank_scores, confidence, card_ids, card_intents, guard_mask, gold_intents, gold_cards, stocks_ok):
        self.n = n = len(probs)
        classes = sorted(probs[0])
        P = np.array([[p[c] for c in classes] for p in probs])
        self.rule = np.asarray(rule_hits, bool)
        self.pg = P[:, classes.index("guardrail")] if "guardrail" in classes else np.zeros(n)
        arg = P.argmax(1)
        self.intent = np.array(classes)[arg]
        self.pmax = P[np.arange(n), arg]
        self.is_card_intent = np.isin(self.intent, list(CARD_INTENTS))
        card_ids = np.asarray(card_ids)
        rank_scores, confidence = np.asarray(rank_scores), np.asarray(confidence)

        def top(mask_rows):
            s = np.where(mask_rows, rank_scores, -np.inf)
            order = np.argsort(-s, axis=1, kind="stable")[:, :3]
            rows = np.arange(n)[:, None]
            conf = np.where(np.isfinite(s[rows, order]), confidence[rows, order], -np.inf)
            return order, conf

        g_order, _ = top(np.broadcast_to(guard_mask, rank_scores.shape))
        self.guard_card = card_ids[g_order[:, 0]]
        self.all = top(np.broadcast_to(~guard_mask, rank_scores.shape))
        own = np.asarray(card_intents)[None, :] == self.intent[:, None]
        self.own = top(own)
        self.card_ids, self.card_intents = card_ids, np.asarray(card_intents)
        self.gold_intent = np.asarray(gold_intents)
        self.gold_card = np.array([c if c is not None else "" for c in gold_cards])
        self.stocks_ok = np.asarray(stocks_ok, bool)

    def evaluate(self, p: Policy) -> dict:
        n = self.n
        kind = np.full(n, -1)
        card = np.full(n, "", dtype=object)
        top3_idx = np.zeros((n, 3), dtype=int)
        guard = self.rule | (self.pg >= p.t_guard)
        kind[guard] = self.KIND["guardrail"]
        card[guard] = self.guard_card[guard]
        rest = ~guard
        fb = rest & ((self.intent == "out_of_scope") | (self.pmax < p.t_oos))
        kind[fb] = self.KIND["fallback"]
        rest &= ~fb
        data = rest & ~self.is_card_intent
        a_order, a_conf = self.all
        override = data & (self.pmax < p.t_data) & (a_conf[:, 0] >= DATA_OVERRIDE_SIM)
        kind[override] = self.KIND["answer"]
        card[override] = self.card_ids[a_order[override, 0]]
        top3_idx[override] = a_order[override]
        kind[data & ~override] = self.KIND["data"]
        cardpath = rest & self.is_card_intent
        order, conf = self.own if p.restrict else self.all
        ask = cardpath & ((conf[:, 0] < p.t_card) | (conf[:, 0] - conf[:, 1] < p.t_margin))
        ans = cardpath & ~ask
        kind[ask] = self.KIND["clarify"]
        kind[ans] = self.KIND["answer"]
        card[ans] = self.card_ids[order[ans, 0]]
        top3_idx[cardpath] = order[cardpath]
        top3 = self.card_ids[top3_idx]

        has_card = self.gold_card != ""
        in_top3 = (top3 == self.gold_card[:, None]).any(1)
        correct = np.where(
            has_card,
            ((kind == 0) | (kind == 4)) & (card == self.gold_card),
            np.where(self.gold_intent == "out_of_scope", kind == 3, (kind == 2) & (self.intent == self.gold_intent) & self.stocks_ok),
        )
        clar = has_card & (kind == 1)
        clar_ok, clar_miss = clar & in_top3, clar & ~in_top3
        wrong = ~correct & ~clar
        is_g = self.gold_intent == "guardrail"
        is_o = self.gold_intent == "out_of_scope"
        return {
            "n": n,
            "correct": correct.mean(),
            "helpful": (correct | clar_ok).mean(),
            "wrong": wrong.mean(),
            "clarify_rate": (kind == 1).mean(),
            "utility": (correct * 1.0 + clar_ok * 0.5 - wrong * 1.0).mean(),
            "guardrail_recall": (kind[is_g] == 4).mean() if is_g.any() else None,
            "oos_recall": (kind[is_o] == 3).mean() if is_o.any() else None,
        }
