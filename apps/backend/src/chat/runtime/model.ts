// The router settings shipped with the model (tradexcel_router.json on the
// Hugging Face repo, written by ml/tradexcel_ml/export_onnx.py), and the small
// pure pieces that apply them: guard rules, the intent head, and the policy.

export type RouterConfig = {
  kb_hash: string;
  encoder: { base_model: string; pooling: "mean" | "cls"; max_seq_length: number; normalize: boolean; onnx_file: string; dtype: "fp32" | "q8" };
  fusion: { method: "weighted_rrf"; dense_weight: number; k: number };
  policy: { t_guard: number; t_oos: number; t_card: number; restrict: boolean };
  intent_head: { classes: string[]; coef: number[][]; intercept: number[] };
  guard_patterns: Record<string, string[]>;
  guard_pattern_flags: string;
};

export const CARD_INTENTS = new Set(["faq_platform", "faq_education", "guardrail", "smalltalk"]);

export function compileGuards(patterns: RouterConfig["guard_patterns"], flags = "i"): [string, RegExp][] {
  return Object.entries(patterns).flatMap(([kind, list]) => list.map((p) => [kind, new RegExp(p, flags)] as [string, RegExp]));
}

export function guardMatch(guards: [string, RegExp][], text: string): string | null {
  for (const [kind, re] of guards) if (re.test(text)) return kind;
  return null;
}

// sklearn's multinomial LogisticRegression.predict_proba: softmax(W·x + b).
export function intentProbs(head: RouterConfig["intent_head"], x: ArrayLike<number>): Record<string, number> {
  const logits = head.coef.map((w, c) => w.reduce((sum, wi, i) => sum + wi * x[i], head.intercept[c]));
  const max = Math.max(...logits);
  const exps = logits.map((l) => Math.exp(l - max));
  const total = exps.reduce((a, b) => a + b, 0);
  return Object.fromEntries(head.classes.map((c, i) => [c, exps[i] / total]));
}

export type Decision =
  | { kind: "guardrail"; intent: "guardrail"; card: string; confidence: number }
  | { kind: "fallback"; intent: "out_of_scope"; confidence: number }
  | { kind: "data"; intent: string; confidence: number }
  | { kind: "answer" | "clarify"; intent: string; card: string; top3: string[]; confidence: number };

// Mirrors ml/tradexcel_ml/router.py `decide`. `cardScores[i]` is the best
// cosine similarity between the message and card i's indexed strings.
export function decide(
  policy: RouterConfig["policy"],
  ruleHit: boolean,
  probs: Record<string, number>,
  cardScores: number[],
  cardIds: string[],
  cardIntents: string[]
): Decision {
  const best = (allowed: (i: number) => boolean) =>
    cardScores
      .map((s, i) => [s, i] as const)
      .filter(([, i]) => allowed(i))
      .sort((a, b) => b[0] - a[0])
      .slice(0, 3);

  const pGuard = probs.guardrail ?? 0;
  if (ruleHit || pGuard >= policy.t_guard) {
    const [[score, i]] = best((i) => cardIntents[i] === "guardrail");
    return { kind: "guardrail", intent: "guardrail", card: cardIds[i], confidence: ruleHit ? 1 : Math.max(pGuard, score) };
  }
  const intent = Object.keys(probs).reduce((a, b) => (probs[b] > probs[a] ? b : a));
  if (intent === "out_of_scope" || probs[intent] < policy.t_oos) return { kind: "fallback", intent: "out_of_scope", confidence: probs[intent] };
  if (!CARD_INTENTS.has(intent)) return { kind: "data", intent, confidence: probs[intent] };

  const top = best((i) => (policy.restrict ? cardIntents[i] === intent : cardIntents[i] !== "guardrail"));
  const top3 = top.map(([, i]) => cardIds[i]);
  const confidence = top[0][0];
  return { kind: confidence < policy.t_card ? "clarify" : "answer", intent, card: top3[0], top3, confidence };
}
