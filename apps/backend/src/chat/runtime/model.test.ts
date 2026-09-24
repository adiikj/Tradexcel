import { describe, expect, it } from "vitest";
import { decide, intentProbs } from "./model.js";

const CARDS = ["faq.a", "faq.b", "edu.c", "guardrail.x"];
const INTENTS = ["faq_platform", "faq_platform", "faq_education", "guardrail"];
const POLICY = { t_guard: 0.5, t_oos: 0.3, t_card: 0.5, restrict: true };

const run = (probs: Record<string, number>, scores: number[], rule = false, policy = POLICY) => decide(policy, rule, probs, scores, CARDS, INTENTS);

// Same cases as ml/tests/test_router.py, so both implementations agree on the policy.
describe("decide", () => {
  it("refuses on a guard rule hit, picking the best guardrail card", () => {
    expect(run({ faq_platform: 0.99, guardrail: 0 }, [0.9, 0.1, 0.1, 0.2], true)).toMatchObject({ kind: "guardrail", card: "guardrail.x" });
  });

  it("refuses when the guardrail probability crosses the threshold", () => {
    expect(run({ guardrail: 0.6, faq_platform: 0.4 }, [0.9, 0, 0, 0.1]).kind).toBe("guardrail");
    expect(run({ guardrail: 0.4, faq_platform: 0.6 }, [0.9, 0, 0, 0.1]).kind).toBe("answer");
  });

  it("falls back for out-of-scope or low-confidence intents", () => {
    expect(run({ out_of_scope: 0.7, faq_platform: 0.3 }, [0.9, 0, 0, 0]).kind).toBe("fallback");
    expect(run({ faq_platform: 0.25, price_quote: 0.2, guardrail: 0.1 }, [0.9, 0, 0, 0]).kind).toBe("fallback");
  });

  it("sends live-data intents to their handler without retrieval", () => {
    expect(run({ price_quote: 0.9 }, [0.9, 0, 0, 0])).toEqual({ kind: "data", intent: "price_quote", confidence: 0.9 });
  });

  it("restricts retrieval to the predicted intent and asks when unsure", () => {
    expect(run({ faq_education: 0.9 }, [0.9, 0.8, 0.6, 0.1])).toMatchObject({ kind: "answer", card: "edu.c" });
    expect(run({ faq_platform: 0.9 }, [0.45, 0.3, 0.2, 0.1])).toMatchObject({ kind: "clarify", top3: ["faq.a", "faq.b"] });
  });

  it("searches every non-guardrail card when not restricted", () => {
    expect(run({ faq_platform: 0.9 }, [0.6, 0.5, 0.95, 0.99], false, { ...POLICY, restrict: false })).toMatchObject({ kind: "answer", card: "edu.c" });
  });
});

describe("intentProbs", () => {
  it("is a softmax over W·x + b", () => {
    const head = { classes: ["a", "b"], coef: [[1, 0], [0, 1]], intercept: [0, 0] };
    const p = intentProbs(head, [2, 0]);
    expect(p.a).toBeCloseTo(Math.exp(2) / (Math.exp(2) + 1), 6);
    expect(p.a + p.b).toBeCloseTo(1, 10);
  });
});
