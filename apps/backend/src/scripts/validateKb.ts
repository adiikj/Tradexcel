import { loadKb, validateKb } from "../chat/kb/loadKb.js";
import { loadDatasets, validateDatasets } from "../chat/kb/datasets.js";

// `pnpm chat:validate` - checks the chatbot knowledge base, intents, stock
// aliases and eval sets, and prints a summary. Exits non-zero on any error so
// CI can gate on it.
const { cards, errors: loadErrors } = loadKb();
const { data, errors: dataErrors } = loadDatasets();
const errors = [...loadErrors, ...dataErrors, ...validateKb(cards), ...validateDatasets(data, cards)];

const byCategory = new Map<string, { cards: number; questions: number }>();
for (const card of cards) {
  const row = byCategory.get(card.category) ?? { cards: 0, questions: 0 };
  row.cards += 1;
  row.questions += card.questions.length;
  byCategory.set(card.category, row);
}
console.table(Object.fromEntries(byCategory));
console.log(`${cards.length} cards, ${cards.reduce((n, c) => n + c.questions.length, 0)} questions`);

console.table(Object.fromEntries(data.intents.map((i) => [i.id, { templates: i.templates.length, examples: i.examples.length }])));

const expectCounts = new Map<string, number>();
for (const c of data.heldout) {
  const bucket = c.expect.startsWith("intent:") ? c.expect : c.expect.split(".")[0];
  expectCounts.set(bucket, (expectCounts.get(bucket) ?? 0) + 1);
}
console.log(`held-out eval: ${data.heldout.length} cases`, Object.fromEntries(expectCounts));
console.log(`entity eval: ${data.entityCases.length} cases, ${data.stocks.length} listed stocks`);

if (errors.length > 0) {
  console.error(`\n${errors.length} problem(s):`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log("Knowledge base OK");
process.exit(0);
