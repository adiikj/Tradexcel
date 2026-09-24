import numpy as np
import pytest

from tradexcel_ml.evaluate import weighted_rrf
from tradexcel_ml.guard_rules import guard_match
from tradexcel_ml.router import Decision, Policy, decide, outcome, summarize

CARDS = ["faq.a", "faq.b", "edu.c", "guardrail.x"]
INTENTS = np.array(["faq_platform", "faq_platform", "faq_education", "guardrail"])
GUARD = INTENTS == "guardrail"


def run(probs, scores, policy=Policy(0.5, 0.3, 0.5, True), rule=False, conf=None):
    s = np.asarray(scores, dtype=float)
    return decide(policy, rule, probs, s, s if conf is None else np.asarray(conf), CARDS, INTENTS, GUARD)


def test_rule_hit_always_refuses():
    d = run({"faq_platform": 0.99, "guardrail": 0.0}, [0.9, 0.1, 0.1, 0.2], rule=True)
    assert (d.kind, d.card) == ("guardrail", "guardrail.x")


def test_guardrail_probability_threshold():
    assert run({"guardrail": 0.6, "faq_platform": 0.4}, [0.9, 0, 0, 0.1]).kind == "guardrail"
    assert run({"guardrail": 0.4, "faq_platform": 0.6}, [0.9, 0, 0, 0.1]).kind == "answer"


def test_out_of_scope_and_low_confidence_intent():
    assert run({"out_of_scope": 0.7, "faq_platform": 0.3}, [0.9, 0, 0, 0]).kind == "fallback"
    assert run({"faq_platform": 0.25, "price_quote": 0.2, "guardrail": 0.1}, [0.9, 0, 0, 0]).kind == "fallback"


def test_data_intent_skips_retrieval():
    assert run({"price_quote": 0.9}, [0.9, 0, 0, 0]) == Decision("data", "price_quote")


def test_restricts_to_predicted_intent_and_gates_on_confidence():
    d = run({"faq_education": 0.9}, [0.9, 0.8, 0.6, 0.1])
    assert (d.kind, d.card) == ("answer", "edu.c")  # faq cards scored higher but are the wrong intent
    d = run({"faq_platform": 0.9}, [0.9, 0.8, 0.6, 0.1], conf=[0.4, 0.3, 0.2, 0.1])
    assert d.kind == "clarify" and d.top3[0] == "faq.a"


def test_outcomes_and_summary():
    ans = Decision("answer", "faq_platform", "faq.a", ("faq.a", "faq.b"))
    ask = Decision("clarify", "faq_platform", None, ("faq.b", "faq.a"))
    assert outcome(ans, "faq_platform", "faq.a") == "correct"
    assert outcome(ask, "faq_platform", "faq.a") == "clarify_ok"
    assert outcome(ans, "faq_platform", "faq.b") == "wrong"
    assert outcome(Decision("data", "price_quote"), "price_quote", None, stocks_ok=False) == "wrong"
    s = summarize(["correct", "clarify_ok", "wrong"], [ans, ask, ans], ["faq_platform"] * 3)
    assert s["correct"] == pytest.approx(1 / 3) and s["helpful"] == pytest.approx(2 / 3) and s["utility"] == pytest.approx(0.5 / 3)


def test_weighted_rrf_extremes():
    dense = np.array([[0.9, 0.1, 0.5]])
    sparse = np.array([[0.0, 5.0, 1.0]])
    assert weighted_rrf(dense, sparse, 1.0).argmax() == 0
    assert weighted_rrf(dense, sparse, 0.0).argmax() == 1


@pytest.mark.parametrize(
    "text, kind",
    [
        ("should i buy reliance", "advice"),
        ("tcs target price for next year", "prediction"),
        ("my otp is 482913", "credentials"),
        ("how much tax on selling shares", "tax"),
        ("how to change my pin", None),
        ("set a target price alert", None),
        ("what is insider trading", None),
        ("which stocks can i trade", None),
    ],
)
def test_guard_rules(text, kind):
    assert guard_match(text) == kind
