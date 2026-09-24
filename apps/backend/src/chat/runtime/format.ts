import { STOCK_LIST } from "@tradexcel/shared";

const inrFmt = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });
const NAMES = new Map(STOCK_LIST.map((s) => [s.symbol, s]));

export const inr = (n: number) => inrFmt.format(n);
export const signedInr = (n: number) => `${n >= 0 ? "+" : "−"}${inrFmt.format(Math.abs(n))}`;
export const signedPct = (n: number) => `${n >= 0 ? "+" : "−"}${Math.abs(n).toFixed(2)}%`;
export const arrow = (n: number | null) => (n == null ? "" : n >= 0 ? "▲" : "▼");

export function shortName(symbol: string): string {
  return NAMES.get(symbol)?.shortName ?? symbol.replace(/\.(NS|BO)$/, "");
}

export function fullName(symbol: string): string {
  return NAMES.get(symbol)?.fullName ?? shortName(symbol);
}

export function shortDate(d: Date): string {
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" });
}

export function asQuestion(q: string): string {
  const t = q.trim();
  return t.charAt(0).toUpperCase() + t.slice(1) + (/[?.!]$/.test(t) ? "" : "?");
}

// Card answers are markdown; the index embeds them as plain text (same as ml/tradexcel_ml/retrieval.py).
export function plainAnswer(markdown: string): string {
  return markdown
    .replace(/[*_`#>]/g, "")
    .replace(/^\s*(-|\d+\.)\s+/gm, "")
    .replace(/\s+/g, " ")
    .trim();
}
