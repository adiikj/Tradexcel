import type { StockListing } from "@tradexcel/shared";

// Stock-name linker: which listed stocks a message mentions. A line-for-line
// port of ml/tradexcel_ml/linker.py (see that file for the reasoning); the
// parity test checks both give identical output on ~1,900 questions, so keep
// them in step - including the order forms are added in, which breaks ties.

export type EntitiesFile = {
  aliases: Record<string, string[]>;
  ambiguous: { term: string; candidates: string[]; default?: string }[];
  common_words: string[];
};

export type LinkResult = { symbols: string[]; ambiguous: string[] };

const CUES = new Set(["share", "shares", "stock", "stocks", "ltp", "quote", "price", "nse"]);
const AMBIGUOUS_NEXT_OK = new Set([...CUES, "prices", "today", "doing", "now", "up", "down", "and", "or", "vs", "is", "was", "trading", "group", "chart", "news"]);
const STOPWORDS = new Set([
  "a", "an", "the", "of", "and", "or", "in", "on", "at", "for", "to", "is", "it", "my", "me", "i", "vs",
  "what", "whats", "how", "why", "when", "which", "do", "does", "did", "today", "now", "price", "prices",
]);
const FUZZY_SKIP = new Set([
  ...STOPWORDS, ...CUES,
  "trend", "trade", "trading", "market", "markets", "bank", "banks", "power", "doing", "profit", "balance",
  "portfolio", "gainers", "losers", "falling", "rising", "shares", "stocks", "india", "indian", "company",
  "limited", "sensex", "nifty", "hello", "should", "would", "could", "about", "there", "their", "where",
  "alert", "alerts", "order", "orders", "holding", "holdings", "chart", "latest", "compare", "quote",
]);
const NAME_SUFFIXES = new Set(["limited", "ltd", "company", "co", "corporation", "corp", "enterprise"]);
const FUZZY_CUTOFF = 85;
const MIN_FUZZY_LEN = 5;

export function normalize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/'s\b/g, "")
    .replace(/'/g, "")
    .replace(/\./g, " ")
    .replace(/[^a-z0-9&]+/g, " ")
    .split(" ")
    .filter(Boolean);
}

// rapidfuzz's fuzz.ratio: 100 * 2 * LCS / (len(a) + len(b)).
export function ratio(a: string, b: string): number {
  if (!a.length && !b.length) return 100;
  let prev = new Array<number>(b.length + 1).fill(0);
  for (let i = 1; i <= a.length; i++) {
    const cur = new Array<number>(b.length + 1).fill(0);
    for (let j = 1; j <= b.length; j++) {
      cur[j] = a[i - 1] === b[j - 1] ? prev[j - 1] + 1 : Math.max(prev[j], cur[j - 1]);
    }
    prev = cur;
  }
  return (200 * prev[b.length]) / (a.length + b.length);
}

const key = (tokens: string[]) => tokens.join(" ");

export class StockLinker {
  private forms = new Map<string, string>();
  private commonSymbols: Set<string>;
  private commonForms = new Set<string>();
  private ambiguous = new Map<string, EntitiesFile["ambiguous"][number]>();
  private maxLen: number;
  private fuzzyForms: [string, string][];

  constructor(stocks: StockListing[], entities: EntitiesFile) {
    this.commonSymbols = new Set(entities.common_words);
    for (const a of entities.ambiguous) this.ambiguous.set(key(normalize(a.term)), a);

    const add = (form: string, symbol: string) => {
      const k = key(normalize(form));
      if (k && !this.ambiguous.has(k) && !this.forms.has(k)) this.forms.set(k, symbol);
    };

    const prefixOwner = new Map<string, Set<string>>();
    for (const s of stocks) {
      const symbol = s.symbol;
      const base = symbol.split(".").slice(0, -1).join(".") || symbol;
      const full = s.fullName.replace(/\(.*?\)/g, " ");
      for (const form of [base, s.shortName, full]) add(form, symbol);
      for (const m of s.fullName.matchAll(/\((.*?)\)/g)) add(m[1], symbol);
      let tokens = normalize(full);
      while (tokens.length && NAME_SUFFIXES.has(tokens[tokens.length - 1])) {
        tokens = tokens.slice(0, -1);
        add(tokens.join(" "), symbol);
      }
      for (let n = 2; n < tokens.length; n++) {
        if (!STOPWORDS.has(tokens[n - 1])) {
          const p = key(tokens.slice(0, n));
          if (!prefixOwner.has(p)) prefixOwner.set(p, new Set());
          prefixOwner.get(p)!.add(symbol);
        }
      }
      if (this.commonSymbols.has(symbol)) {
        for (const form of [base, s.shortName]) {
          const t = normalize(form);
          if (t.length === 1) this.commonForms.add(key(t));
        }
      }
    }
    for (const [prefix, owners] of prefixOwner) {
      if (owners.size === 1 && !this.forms.has(prefix) && !this.ambiguous.has(prefix)) this.forms.set(prefix, [...owners][0]);
    }
    for (const [symbol, aliases] of Object.entries(entities.aliases)) for (const alias of aliases) add(alias, symbol);

    this.maxLen = Math.max(...[...this.forms.keys()].map((k) => k.split(" ").length));
    this.fuzzyForms = [...this.forms].filter(([k]) => k.split(" ").length <= 2 && k.length >= MIN_FUZZY_LEN);
  }

  private hasCue(tokens: string[], start: number, end: number): boolean {
    return [...tokens.slice(Math.max(0, start - 2), start), ...tokens.slice(end, end + 2)].some((t) => CUES.has(t));
  }

  private fuzzy(phrase: string): string | null {
    let best: string | null = null;
    let bestScore = FUZZY_CUTOFF - 1;
    for (const [form, symbol] of this.fuzzyForms) {
      if (Math.abs(form.length - phrase.length) > 3) continue;
      const score = ratio(phrase, form);
      if (score > bestScore) {
        best = symbol;
        bestScore = score;
      }
    }
    return best;
  }

  link(text: string): LinkResult {
    const tokens = normalize(text);
    const upperWords = new Set([...text.matchAll(/\b[A-Z]{2,}\b/g)].map((m) => m[0].toLowerCase()));
    const result: LinkResult = { symbols: [], ambiguous: [] };
    const emit = (symbol: string) => {
      if (!result.symbols.includes(symbol)) result.symbols.push(symbol);
    };

    let i = 0;
    while (i < tokens.length) {
      let matched = false;
      for (let n = Math.min(this.maxLen, tokens.length - i); n > 0; n--) {
        const k = key(tokens.slice(i, i + n));
        const symbol = this.forms.get(k);
        if (symbol === undefined) continue;
        if (this.commonForms.has(k) && !upperWords.has(tokens[i]) && !this.hasCue(tokens, i, i + n)) break; // everyday word here
        emit(symbol);
        i += n;
        matched = true;
        break;
      }
      if (matched) continue;

      const amb = this.ambiguous.get(tokens[i]);
      // Typos: two tokens first, then one - never fuzz an ambiguous word itself.
      for (const n of amb ? [2] : [2, 1]) {
        if (i + n > tokens.length) continue;
        const span = tokens.slice(i, i + n);
        if (span.some((t) => FUZZY_SKIP.has(t)) || span[span.length - 1].length < 3) continue;
        const phrase = span.join(" ");
        if (phrase.length < MIN_FUZZY_LEN) continue;
        const symbol = this.fuzzy(phrase);
        if (symbol && !(this.commonSymbols.has(symbol) && !this.hasCue(tokens, i, i + n))) {
          emit(symbol);
          i += n;
          matched = true;
          break;
        }
      }
      if (matched) continue;

      if (amb) {
        const next = tokens[i + 1];
        if (next === undefined || AMBIGUOUS_NEXT_OK.has(next)) {
          if (!result.ambiguous.includes(amb.term)) result.ambiguous.push(amb.term);
          if (amb.default) emit(amb.default);
        }
        // Otherwise it's another, unlisted company from the same group.
      }
      i += 1;
    }
    return result;
  }
}
