import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { ChatReply } from "@tradexcel/shared";
import { STOCK_LIST } from "@tradexcel/shared";
import logger from "../../utils/logger.js";
import { loadKb } from "../kb/loadKb.js";
import type { KbCard } from "../kb/schema.js";
import { CHAT_CACHE_DIR, CHAT_MODEL_REVISION, loadEntities, loadRouterConfig } from "./config.js";
import { loadEncoder, type Encoder } from "./encoder.js";
import { asQuestion, plainAnswer } from "./format.js";
import { DATA_HANDLERS } from "./handlers.js";
import { StockLinker, type EntitiesFile } from "./linker.js";
import { compileGuards, decide, guardMatch, intentProbs, type Decision, type RouterConfig } from "./model.js";

const FALLBACK_SUGGESTIONS = ["What can you do?", "How does the weekly reset work?", "What's my portfolio worth?"];

// Every string a card is found by: its title, answer text, tags and all its
// questions. A card's score is its best-matching string.
function indexStrings(cards: KbCard[]): { texts: string[]; owner: number[] } {
  const texts: string[] = [];
  const owner: number[] = [];
  cards.forEach((card, i) => {
    for (const t of [card.title, plainAnswer(card.answer), ...(card.tags.length ? [card.tags.join(", ")] : []), ...card.questions]) {
      texts.push(t);
      owner.push(i);
    }
  });
  return { texts, owner };
}

// Embedding ~1,700 strings takes a few seconds on the VM; cache them on disk
// keyed by model revision + exact texts, so restarts and deploys are instant.
async function embedIndex(encoder: Encoder, texts: string[]): Promise<Float32Array[]> {
  const key = createHash("sha256").update(CHAT_MODEL_REVISION).update(JSON.stringify(texts)).digest("hex").slice(0, 16);
  const file = join(CHAT_CACHE_DIR, `index-${key}.bin`);
  if (existsSync(file)) {
    const buf = readFileSync(file);
    const all = new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4);
    const dim = all.length / texts.length;
    return texts.map((_, i) => all.slice(i * dim, (i + 1) * dim));
  }
  const out: Float32Array[] = [];
  for (let i = 0; i < texts.length; i += 32) out.push(...(await encoder.embed(texts.slice(i, i + 32))));
  mkdirSync(CHAT_CACHE_DIR, { recursive: true });
  const flat = new Float32Array(out.length * out[0].length);
  out.forEach((v, i) => flat.set(v, i * v.length));
  writeFileSync(file, Buffer.from(flat.buffer));
  return out;
}

function dot(a: Float32Array, b: Float32Array): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}

export class ChatEngine {
  private readonly guards;
  private readonly cardById: Map<string, KbCard>;
  private readonly cardIds: string[];
  private readonly cardIntents: string[];
  private readonly ambiguous: Map<string, EntitiesFile["ambiguous"][number]>;

  constructor(
    private readonly cfg: RouterConfig,
    private readonly encoder: Encoder,
    private readonly cards: KbCard[],
    private readonly index: { vectors: Float32Array[]; owner: number[] },
    private readonly linker: StockLinker,
    entities: EntitiesFile
  ) {
    this.guards = compileGuards(cfg.guard_patterns, cfg.guard_pattern_flags);
    this.cardById = new Map(cards.map((c) => [c.id, c]));
    this.cardIds = cards.map((c) => c.id);
    this.cardIntents = cards.map((c) => c.intent);
    this.ambiguous = new Map(entities.ambiguous.map((a) => [a.term, a]));
  }

  static async create(): Promise<ChatEngine> {
    const started = Date.now();
    const cfg = await loadRouterConfig();
    if (cfg.fusion.dense_weight !== 1) {
      logger.warn({ weight: cfg.fusion.dense_weight }, "Chat: BM25 fusion isn't implemented in the runtime; ranking by embeddings only");
    }
    const { cards, errors } = loadKb();
    if (errors.length) throw new Error(`Chat knowledge base is invalid: ${errors[0]}`);
    const encoder = await loadEncoder(cfg);
    const { texts, owner } = indexStrings(cards);
    const vectors = await embedIndex(encoder, texts);
    const entities = loadEntities();
    const engine = new ChatEngine(cfg, encoder, cards, { vectors, owner }, new StockLinker(STOCK_LIST, entities), entities);
    logger.info({ ms: Date.now() - started, cards: cards.length, strings: texts.length }, "Chat engine ready");
    return engine;
  }

  // Best cosine similarity per card.
  private cardScores(q: Float32Array): number[] {
    const scores = new Array<number>(this.cards.length).fill(-Infinity);
    this.index.vectors.forEach((v, i) => {
      const s = dot(q, v);
      const c = this.index.owner[i];
      if (s > scores[c]) scores[c] = s;
    });
    return scores;
  }

  private cardReply(kind: "answer" | "guardrail", cardId: string, confidence: number): ChatReply {
    const card = this.cardById.get(cardId)!;
    const suggestions = card.related
      .map((id) => this.cardById.get(id)?.questions[0])
      .filter((q): q is string => Boolean(q))
      .slice(0, 3)
      .map(asQuestion);
    return { kind, intent: card.intent, text: card.answer, links: card.links, suggestions, cardId, confidence };
  }

  // The routing decision alone, with no database access (used by reply() and chat:eval).
  async route(message: string): Promise<Decision> {
    const text = message.trim();
    const [q] = await this.encoder.embed([text]);
    const probs = intentProbs(this.cfg.intent_head, q);
    return decide(this.cfg.policy, guardMatch(this.guards, text) !== null, probs, this.cardScores(q), this.cardIds, this.cardIntents);
  }

  link(message: string) {
    return this.linker.link(message);
  }

  async reply(message: string, userId: string): Promise<ChatReply> {
    const text = message.trim();
    const decision = await this.route(text);

    switch (decision.kind) {
      case "guardrail":
      case "answer":
        return this.cardReply(decision.kind, decision.card, decision.confidence);
      case "clarify":
        return {
          kind: "clarify",
          intent: decision.intent,
          text: "Hmm, I want to make sure I get this right. Did you mean one of these?",
          links: [],
          suggestions: decision.top3.map((id) => asQuestion(this.cardById.get(id)!.questions[0])),
          cardId: null,
          confidence: decision.confidence,
        };
      case "fallback":
        return {
          kind: "fallback",
          intent: "out_of_scope",
          text: "That's a bit outside my lane! I'm best at questions about Tradexcel, live stock prices, and how your portfolio, rank and contests are doing.",
          links: [],
          suggestions: FALLBACK_SUGGESTIONS,
          cardId: null,
          confidence: decision.confidence,
        };
      case "data": {
        const link = this.linker.link(text);
        const ambiguous = link.ambiguous.map((t) => this.ambiguous.get(t)!).filter(Boolean);
        try {
          const answer = await DATA_HANDLERS[decision.intent]({ userId, link, ambiguous });
          return { kind: "data", intent: decision.intent, cardId: null, confidence: decision.confidence, ...answer };
        } catch (error) {
          logger.error({ err: error, intent: decision.intent }, "Chat data handler failed");
          return {
            kind: "data",
            intent: decision.intent,
            text: "Sorry, I couldn't pull that up just now. Mind trying again in a moment?",
            links: [],
            suggestions: [],
            cardId: null,
            confidence: decision.confidence,
          };
        }
      }
    }
  }
}

let enginePromise: Promise<ChatEngine> | null = null;

// One engine per process, created on first use (or by warmChatEngine at boot).
// A failed start is forgotten so the next request retries.
export function getChatEngine(): Promise<ChatEngine> {
  if (!enginePromise) {
    enginePromise = ChatEngine.create().catch((error) => {
      enginePromise = null;
      throw error;
    });
  }
  return enginePromise;
}

export function warmChatEngine(): void {
  getChatEngine().catch((error) => logger.error({ err: error }, "Chat engine failed to start"));
}
