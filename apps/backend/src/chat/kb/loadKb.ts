import { readdirSync, readFileSync, existsSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";
import { cardFileSchema, CATEGORY_INTENT, FACTUAL_CATEGORIES, type KbCard } from "./schema.js";
import { resolvePlaceholders } from "./facts.js";

// src/chat/kb (or dist/chat/kb) -> apps/backend
const BACKEND_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
export const REPO_ROOT = resolve(BACKEND_ROOT, "../..");
export const KB_DIR = join(BACKEND_ROOT, "chat/kb");
const FRONTEND_APP_DIR = join(REPO_ROOT, "apps/frontend/src/app");

export type KbLoadResult = { cards: KbCard[]; errors: string[] };

// Parses every cards/*.yaml file and fills placeholders. Schema problems are
// collected rather than thrown so one run reports everything that's wrong.
export function loadKb(kbDir = KB_DIR): KbLoadResult {
  const cardsDir = join(kbDir, "cards");
  const files = readdirSync(cardsDir).filter((f) => f.endsWith(".yaml")).sort();
  const cards: KbCard[] = [];
  const errors: string[] = [];

  for (const file of files) {
    const rel = relative(REPO_ROOT, join(cardsDir, file));
    let raw: unknown;
    try {
      raw = parse(readFileSync(join(cardsDir, file), "utf8"));
    } catch (error: any) {
      errors.push(`${rel}: invalid YAML - ${error.message}`);
      continue;
    }

    const parsed = cardFileSchema.safeParse(raw);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        errors.push(`${rel}: ${issue.path.join(".")} - ${issue.message}`);
      }
      continue;
    }

    for (const card of parsed.data.cards) {
      const answer = resolvePlaceholders(card.answer);
      const questions = card.questions.map((q) => resolvePlaceholders(q));
      for (const u of [...answer.unknown, ...questions.flatMap((q) => q.unknown)]) {
        errors.push(`${rel}: ${card.id} - unknown placeholder ${u}`);
      }
      cards.push({
        ...card,
        answer: answer.text,
        questions: questions.map((q) => q.text),
        file: rel,
        intent: CATEGORY_INTENT[card.category],
      });
    }
  }

  return { cards, errors };
}

export function normalizeQuestion(q: string): string {
  return q.toLowerCase().replace(/[^a-z0-9₹%\s]/g, " ").replace(/\s+/g, " ").trim();
}

// Every page route in the Next.js app, as regexes ([param] segments match anything).
export function listAppRoutes(appDir = FRONTEND_APP_DIR): RegExp[] {
  const routes: RegExp[] = [];
  const walk = (dir: string, segments: string[]) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) walk(join(dir, entry.name), [...segments, entry.name]);
      else if (entry.name === "page.tsx") {
        const pattern = segments
          .filter((s) => !/^\(.*\)$/.test(s)) // route groups don't appear in the URL
          .map((s) => (/^\[.*\]$/.test(s) ? "[^/]+" : s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")))
          .join("/");
        routes.push(new RegExp(`^/${pattern}$`));
      }
    }
  };
  walk(appDir, []);
  return routes;
}

export type ValidateOptions = { routes?: RegExp[]; fileExists?: (repoRelPath: string) => boolean };

// Cross-card checks the per-card schema can't express.
export function validateKb(cards: KbCard[], opts: ValidateOptions = {}): string[] {
  const routes = opts.routes ?? listAppRoutes();
  const fileExists = opts.fileExists ?? ((p: string) => existsSync(join(REPO_ROOT, p)));
  const errors: string[] = [];
  const ids = new Set<string>();
  const questionOwner = new Map<string, string>();

  for (const card of cards) {
    if (ids.has(card.id)) errors.push(`${card.id}: duplicate id`);
    ids.add(card.id);
  }

  for (const card of cards) {
    const where = `${card.file}: ${card.id}`;

    for (const q of card.questions) {
      const key = normalizeQuestion(q);
      const owner = questionOwner.get(key);
      if (owner) errors.push(`${where} - question "${q}" duplicates one in ${owner}`);
      else questionOwner.set(key, card.id);
    }

    for (const link of card.links) {
      const path = link.href.split(/[?#]/)[0];
      if (!routes.some((r) => r.test(path))) errors.push(`${where} - link ${link.href} is not a page in the app`);
    }

    for (const [field, refs] of [["related", card.related], ["hard_negatives", card.hard_negatives]] as const) {
      for (const ref of refs) {
        if (ref === card.id) errors.push(`${where} - ${field} references itself`);
        else if (!ids.has(ref)) errors.push(`${where} - ${field} references unknown card ${ref}`);
      }
    }

    if (FACTUAL_CATEGORIES.includes(card.category) && card.sources.length === 0) {
      errors.push(`${where} - ${card.category} cards must list sources`);
    }
    for (const src of card.sources) {
      if (!fileExists(src)) errors.push(`${where} - source ${src} does not exist`);
    }
  }

  return errors;
}
