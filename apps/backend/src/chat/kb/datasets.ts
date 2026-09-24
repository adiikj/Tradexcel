import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";
import { z } from "zod";
import { STOCK_LIST, type StockListing } from "@tradexcel/shared";
import { KB_DIR, REPO_ROOT, normalizeQuestion } from "./loadKb.js";
import { CATEGORY_INTENT, type KbCard } from "./schema.js";

// Everything besides the cards: live-data intents, stock-name data, and the
// held-out evaluation sets. All of it is synthetic; these checks keep it
// internally consistent and keep test cases out of the training data.

export const DATA_INTENTS = [
  "price_quote",
  "holding_detail",
  "portfolio_summary",
  "my_rank",
  "my_achievements",
  "my_contests",
  "my_alerts",
  "my_orders",
  "out_of_scope",
] as const;
export const ALL_INTENTS = [...new Set([...Object.values(CATEGORY_INTENT), ...DATA_INTENTS])];

const SLOT = /\{(\w+)\}/g;

const intentSchema = z
  .object({
    id: z.enum(DATA_INTENTS),
    description: z.string().min(5),
    handler: z.string().min(3),
    templates: z.array(z.string().trim().min(2)).default([]),
    examples: z.array(z.string().trim().min(2)).default([]),
  })
  .strict();
const intentsFileSchema = z.object({ intents: z.array(intentSchema) }).strict();
export type IntentDef = z.infer<typeof intentSchema>;

const entitiesFileSchema = z
  .object({
    aliases: z.record(z.string(), z.array(z.string().trim().toLowerCase().min(2))),
    ambiguous: z.array(
      z
        .object({
          term: z.string().trim().toLowerCase().min(2),
          candidates: z.array(z.string()).min(2),
          default: z.string().optional(),
        })
        .strict()
    ),
    common_words: z.array(z.string()),
  })
  .strict();
export type EntitiesFile = z.infer<typeof entitiesFileSchema>;

// `expect` is a card id, or "intent:<id>" for data-backed intents.
const heldoutCaseSchema = z
  .object({
    text: z.string().trim().min(1),
    expect: z.string().min(3),
    stocks: z.array(z.string()).optional(),
    style: z.enum(["terse", "typo", "rambling", "multi", "formal", "slang", "adversarial", "plain"]),
  })
  .strict();
const heldoutFileSchema = z.object({ cases: z.array(heldoutCaseSchema) }).strict();
export type HeldoutCase = z.infer<typeof heldoutCaseSchema>;

const entityCaseSchema = z
  .object({
    text: z.string().trim().min(1),
    stocks: z.array(z.string()).default([]),
    ambiguous: z.string().optional(),
  })
  .strict();
const entityFileSchema = z.object({ cases: z.array(entityCaseSchema) }).strict();
export type EntityCase = z.infer<typeof entityCaseSchema>;

export type Datasets = {
  intents: IntentDef[];
  entities: EntitiesFile | null;
  heldout: HeldoutCase[];
  entityCases: EntityCase[];
  stocks: StockListing[];
};

function readYaml<T>(path: string, schema: z.ZodType<T>, errors: string[]): T | null {
  const rel = path.slice(REPO_ROOT.length + 1);
  if (!existsSync(path)) {
    errors.push(`${rel}: missing`);
    return null;
  }
  let raw: unknown;
  try {
    raw = parse(readFileSync(path, "utf8"));
  } catch (error: any) {
    errors.push(`${rel}: invalid YAML - ${error.message}`);
    return null;
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    for (const issue of parsed.error.issues) errors.push(`${rel}: ${issue.path.join(".")} - ${issue.message}`);
    return null;
  }
  return parsed.data;
}

export function loadDatasets(kbDir = KB_DIR): { data: Datasets; errors: string[] } {
  const errors: string[] = [];
  const intents = readYaml(join(kbDir, "intents.yaml"), intentsFileSchema, errors)?.intents ?? [];
  const entities = readYaml(join(kbDir, "entities/stocks.yaml"), entitiesFileSchema, errors);

  const evalDir = join(kbDir, "eval");
  const heldout: HeldoutCase[] = [];
  const entityCases: EntityCase[] = [];
  for (const file of existsSync(evalDir) ? readdirSync(evalDir).filter((f) => f.endsWith(".yaml")).sort() : []) {
    const path = join(evalDir, file);
    if (file.startsWith("entities")) entityCases.push(...(readYaml(path, entityFileSchema, errors)?.cases ?? []));
    else heldout.push(...(readYaml(path, heldoutFileSchema, errors)?.cases ?? []));
  }

  return { data: { intents, entities, heldout, entityCases, stocks: STOCK_LIST }, errors };
}

export function validateDatasets(data: Datasets, cards: KbCard[]): string[] {
  const errors: string[] = [];
  const symbols = new Set(data.stocks.map((s) => s.symbol));
  const cardIds = new Set(cards.map((c) => c.id));

  // --- intents ---
  const seenIntents = new Set<string>();
  // Every training string, normalized, with who owns it - shared with cards so
  // the same sentence can't be labelled two ways.
  const trainOwner = new Map<string, string>();
  for (const card of cards) for (const q of card.questions) trainOwner.set(normalizeQuestion(q), card.id);

  for (const intent of data.intents) {
    if (seenIntents.has(intent.id)) errors.push(`intents: ${intent.id} defined twice`);
    seenIntents.add(intent.id);
    if (intent.templates.length + intent.examples.length < 8) errors.push(`intents: ${intent.id} needs at least 8 templates/examples`);

    for (const t of intent.templates) {
      const slots = [...t.matchAll(SLOT)].map((m) => m[1]);
      if (!slots.includes("stock")) errors.push(`intents: ${intent.id} template "${t}" has no {stock} slot`);
      for (const s of slots) if (s !== "stock" && s !== "stock2") errors.push(`intents: ${intent.id} template "${t}" uses unknown slot {${s}}`);
      if (slots.includes("stock2") && !slots.includes("stock")) errors.push(`intents: ${intent.id} template "${t}" uses {stock2} without {stock}`);
    }
    for (const e of intent.examples) {
      if (SLOT.test(e)) errors.push(`intents: ${intent.id} example "${e}" has a slot - put it under templates`);
      SLOT.lastIndex = 0;
      const key = normalizeQuestion(e);
      const owner = trainOwner.get(key);
      if (owner) errors.push(`intents: ${intent.id} example "${e}" duplicates one in ${owner}`);
      else trainOwner.set(key, `intent:${intent.id}`);
    }
  }
  for (const id of DATA_INTENTS) if (!seenIntents.has(id)) errors.push(`intents: ${id} is missing`);

  // --- entities ---
  if (data.entities) {
    const { aliases, ambiguous, common_words } = data.entities;
    const aliasOwner = new Map<string, string>();
    for (const [symbol, forms] of Object.entries(aliases)) {
      if (!symbols.has(symbol)) errors.push(`entities: alias symbol ${symbol} isn't in the stock list`);
      for (const form of forms) {
        const other = aliasOwner.get(form);
        if (other && other !== symbol) errors.push(`entities: alias "${form}" maps to both ${other} and ${symbol}`);
        aliasOwner.set(form, symbol);
      }
    }
    // Base forms a listed stock is always known by.
    const baseOwner = new Map<string, string>();
    for (const s of data.stocks) {
      for (const form of [s.shortName, s.symbol.replace(/\.(NS|BO)$/, "")].map((f) => f.toLowerCase())) baseOwner.set(form, s.symbol);
    }
    for (const a of ambiguous) {
      for (const c of [...a.candidates, ...(a.default ? [a.default] : [])]) {
        if (!symbols.has(c)) errors.push(`entities: ambiguous "${a.term}" lists unknown symbol ${c}`);
      }
      if (a.default && !a.candidates.includes(a.default)) errors.push(`entities: ambiguous "${a.term}" default isn't a candidate`);
      if (aliasOwner.has(a.term)) errors.push(`entities: "${a.term}" is both an alias (${aliasOwner.get(a.term)}) and ambiguous`);
      const base = baseOwner.get(a.term);
      if (base && !a.candidates.includes(base)) errors.push(`entities: ambiguous "${a.term}" is ${base}'s own name but doesn't list it`);
    }
    for (const c of common_words) if (!symbols.has(c)) errors.push(`entities: common word ${c} isn't in the stock list`);
  }

  // --- held-out eval ---
  const intentIds = new Set<string>(ALL_INTENTS);
  const heldoutSeen = new Set<string>();
  for (const c of data.heldout) {
    const key = normalizeQuestion(c.text);
    if (c.expect.startsWith("intent:")) {
      if (!intentIds.has(c.expect.slice(7))) errors.push(`eval: "${c.text}" expects unknown intent ${c.expect}`);
    } else if (!cardIds.has(c.expect)) {
      errors.push(`eval: "${c.text}" expects unknown card ${c.expect}`);
    }
    for (const s of c.stocks ?? []) if (!symbols.has(s)) errors.push(`eval: "${c.text}" lists unknown symbol ${s}`);
    const leaked = trainOwner.get(key);
    if (leaked) errors.push(`eval: "${c.text}" is also a training example (${leaked}) - test cases must be unseen`);
    if (heldoutSeen.has(key)) errors.push(`eval: "${c.text}" appears twice`);
    heldoutSeen.add(key);
  }

  // --- entity eval ---
  const ambiguousTerms = new Set(data.entities?.ambiguous.map((a) => a.term) ?? []);
  for (const c of data.entityCases) {
    for (const s of c.stocks) if (!symbols.has(s)) errors.push(`entity eval: "${c.text}" lists unknown symbol ${s}`);
    if (c.ambiguous && !ambiguousTerms.has(c.ambiguous)) errors.push(`entity eval: "${c.text}" uses unknown ambiguous term ${c.ambiguous}`);
  }

  return errors;
}
