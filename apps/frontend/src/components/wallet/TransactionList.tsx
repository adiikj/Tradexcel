"use client";
import Link from "next/link";
import { PiArrowDownLeft, PiArrowUpRight } from "react-icons/pi";
import type { TransactionRecord } from "@tradexcel/shared";
import { formatInr } from "../../utils/format";
import stockList from "../market/StockData.json";
import type { StockListing } from "../../types/market";

const NAMES = new Map((stockList as StockListing[]).map((s) => [s.symbol, s]));

function dayLabel(date: Date, now: Date) {
  const start = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diff = Math.round((start(now) - start(date)) / 86_400_000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return date.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: date.getFullYear() === now.getFullYear() ? undefined : "numeric" });
}

// Trades grouped by day, newest first. Amounts are cash movement: buys
// spend (−), sells bring cash in (+).
function TransactionList({ transactions }: { transactions: TransactionRecord[] }) {
  const now = new Date();
  const groups: { label: string; items: TransactionRecord[] }[] = [];
  // Newest first; grouping relies on same-day trades being adjacent.
  const ordered = [...transactions].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  for (const t of ordered) {
    const label = dayLabel(new Date(t.createdAt), now);
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.items.push(t);
    else groups.push({ label, items: [t] });
  }

  return (
    <div className="space-y-5">
      {groups.map((group) => {
        const net = group.items.reduce((sum, t) => sum + (t.side === "SELL" ? 1 : -1) * Number(t.total), 0);
        return (
          <section key={group.label} aria-label={group.label}>
            <div className="mb-1 flex items-center justify-between px-1 text-xs font-medium text-gray-500 dark:text-gray-400">
              <span>{group.label}</span>
              <span className="tabular-nums">
                Net {net >= 0 ? "+" : "−"}
                {formatInr(Math.abs(net))}
              </span>
            </div>
            <ul className="divide-y divide-gray-100 rounded-xl ring-1 ring-gray-100 dark:divide-gray-800 dark:ring-gray-800">
              {group.items.map((t) => {
                const buy = t.side === "BUY";
                const listing = NAMES.get(t.symbol);
                return (
                  <li key={t.id} className="flex items-center gap-3 px-3 py-3">
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                        buy ? "bg-green-600/10 text-green-700 dark:text-green-300" : "bg-red-600/10 text-red-600 dark:text-red-400"
                      }`}
                    >
                      {buy ? <PiArrowUpRight aria-hidden="true" className="h-5 w-5" /> : <PiArrowDownLeft aria-hidden="true" className="h-5 w-5" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <Link href={`/market?symbol=${encodeURIComponent(t.symbol)}`} className="truncate text-sm font-semibold hover:underline">
                          {listing?.shortName ?? t.symbol.replace(/\.NS$/, "")}
                        </Link>
                        <span
                          className={`rounded px-1.5 py-px text-[10px] font-bold tracking-wide ${
                            buy ? "bg-green-600/10 text-green-700 dark:text-green-300" : "bg-red-600/10 text-red-600 dark:text-red-400"
                          }`}
                        >
                          {t.side}
                        </span>
                      </span>
                      <span className="block truncate text-xs text-gray-500 dark:text-gray-400">
                        {t.quantity} × {formatInr(t.price)} ·{" "}
                        <time dateTime={t.createdAt}>{new Date(t.createdAt).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}</time>
                      </span>
                    </span>
                    <span className="shrink-0 text-right text-sm font-semibold tabular-nums">
                      {buy ? "−" : "+"}
                      {formatInr(t.total)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

export default TransactionList;
