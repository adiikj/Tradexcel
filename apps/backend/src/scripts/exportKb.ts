import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { createHash } from "node:crypto";
import { loadKb, validateKb, REPO_ROOT } from "../chat/kb/loadKb.js";
import { loadDatasets, validateDatasets } from "../chat/kb/datasets.js";

// `pnpm chat:export` - writes the validated, placeholder-resolved knowledge
// base plus intents, stock data and eval sets to ml/data/kb_export.json, the
// single input of the Python training pipeline. Refuses to export invalid data.
const { cards, errors: loadErrors } = loadKb();
const { data, errors: dataErrors } = loadDatasets();
const errors = [...loadErrors, ...dataErrors, ...validateKb(cards), ...validateDatasets(data, cards)];
if (errors.length > 0) {
  console.error(`Not exporting - ${errors.length} validation problem(s). Run chat:validate for details.`);
  process.exit(1);
}

const payload = {
  cards: cards.map(({ file: _file, ...card }) => card),
  intents: data.intents,
  entities: data.entities,
  stocks: data.stocks,
  heldout: data.heldout,
  entity_cases: data.entityCases,
};
const body = JSON.stringify(payload, null, 2);
const out = join(REPO_ROOT, "ml/data/kb_export.json");
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify({ kb_hash: createHash("sha256").update(body).digest("hex").slice(0, 16), ...payload }, null, 2));
console.log(`Exported ${cards.length} cards, ${data.intents.length} intents, ${data.heldout.length} held-out and ${data.entityCases.length} entity cases to ml/data/kb_export.json`);
