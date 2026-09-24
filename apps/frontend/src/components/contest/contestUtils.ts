import stockList from "../market/StockData.json";
import type { StockListing } from "../../types/market";

// Shared by the contest list and detail views.
export const SURFACE = "rounded-2xl bg-white shadow-sm ring-1 ring-gray-200 dark:bg-gray-900 dark:shadow-none dark:ring-gray-800";

export const STATUS_META: Record<string, { label: string; chip: string; dot: string }> = {
  LIVE: { label: "Live", chip: "bg-green-600/10 text-green-700 dark:text-green-300", dot: "bg-green-500 animate-pulse" },
  UPCOMING: { label: "Upcoming", chip: "bg-amber-500/15 text-amber-700 dark:text-amber-300", dot: "bg-amber-500" },
  ENDED: { label: "Ended", chip: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400", dot: "bg-gray-400" },
};

const NAMES = new Map((stockList as StockListing[]).map((s) => [s.symbol, s]));

export const stockName = (symbol: string) => NAMES.get(symbol)?.shortName ?? symbol.replace(/\.(NS|BO)$/, "");

export const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

export function contestProgress(contest: { startAt: string; endAt: string; status: string }) {
  if (contest.status === "ENDED") return 100;
  if (contest.status === "UPCOMING") return 0;
  const start = new Date(contest.startAt).getTime();
  const end = new Date(contest.endAt).getTime();
  const now = Date.now();
  return Math.max(0, Math.min(100, ((now - start) / (end - start)) * 100));
}
