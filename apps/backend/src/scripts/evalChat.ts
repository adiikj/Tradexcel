import { ChatEngine } from "../chat/runtime/engine.js";
import { loadKb } from "../chat/kb/loadKb.js";
import { loadDatasets } from "../chat/kb/datasets.js";

// `pnpm chat:eval` - runs the held-out questions through the real Node engine
// (model from Hugging Face, no database) and reports the same router metrics as
// ml/tradexcel_ml/evaluate.py, plus startup time, latency and memory. Unlike
// the Python eval, the runtime indexes *all* card questions, so card answers
// can only get better here - a big drop means the port is wrong.
const STOCK_INTENTS = new Set(["price_quote", "holding_detail"]);

const t0 = Date.now();
const engine = await ChatEngine.create();
const startupMs = Date.now() - t0;

const cardIntent = new Map(loadKb().cards.map((c) => [c.id, c.intent]));
const cases = loadDatasets().data.heldout;
const outcomes: string[] = [];
const times: number[] = [];
let guardTotal = 0, guardHit = 0, oosTotal = 0, oosHit = 0;

for (const c of cases) {
  const goldCard = c.expect.startsWith("intent:") ? null : c.expect;
  const goldIntent = goldCard ? cardIntent.get(goldCard)! : c.expect.slice("intent:".length);
  const start = performance.now();
  const d = await engine.route(c.text);
  times.push(performance.now() - start);

  if (goldIntent === "guardrail") { guardTotal++; guardHit += d.kind === "guardrail" ? 1 : 0; }
  if (goldIntent === "out_of_scope") { oosTotal++; oosHit += d.kind === "fallback" ? 1 : 0; }

  let outcome: string;
  if (goldCard) {
    if ((d.kind === "answer" || d.kind === "guardrail") && d.card === goldCard) outcome = "correct";
    else if (d.kind === "clarify") outcome = d.top3.includes(goldCard) ? "clarify_ok" : "clarify_miss";
    else outcome = "wrong";
  } else if (goldIntent === "out_of_scope") {
    outcome = d.kind === "fallback" ? "correct" : "wrong";
  } else {
    const stocksOk = !STOCK_INTENTS.has(goldIntent) || JSON.stringify([...engine.link(c.text).symbols].sort()) === JSON.stringify([...(c.stocks ?? [])].sort());
    outcome = d.kind === "data" && d.intent === goldIntent && stocksOk ? "correct" : "wrong";
  }
  outcomes.push(outcome);
}

const pct = (n: number, d: number) => `${((100 * n) / d).toFixed(1)}%`;
const count = (o: string) => outcomes.filter((x) => x === o).length;
const sorted = [...times].sort((a, b) => a - b);
const p = (q: number) => sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))].toFixed(1);
console.table({
  "held-out questions": cases.length,
  correct: pct(count("correct"), cases.length),
  "helpful (correct or right card offered)": pct(count("correct") + count("clarify_ok"), cases.length),
  wrong: pct(count("wrong"), cases.length),
  "asks 'did you mean'": pct(count("clarify_ok") + count("clarify_miss"), cases.length),
  "guardrail recall": pct(guardHit, guardTotal),
  "out-of-scope recall": pct(oosHit, oosTotal),
  "startup ms (model + index)": startupMs,
  "route p50 ms": p(0.5),
  "route p95 ms": p(0.95),
  "RSS MB": Math.round(process.memoryUsage().rss / 1e6),
});
process.exit(0);
