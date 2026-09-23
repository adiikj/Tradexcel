"use client";
import { useMemo, useState } from "react";
import type { MarketStock } from "../../types/market";
import { changeGlyph, changeTextClass } from "./marketColors";
import { formatInr } from "../../utils/format";

export type WatchFilter = "all" | "gainers" | "losers" | "holdings";
type SortKey = "name" | "price" | "change";

type WatchlistProps = {
  stocks: MarketStock[];
  isLoading: boolean;
  selectedSymbol: string | null;
  onSelect: (symbol: string) => void;
  holdings: Record<string, number>;
};

// 30-day trend line. Decorative (aria-hidden) - the row's numbers carry the data.
function Sparkline({ closes: raw }: { closes: number[] }) {
  // Yahoo leaves null for bars still forming; plotting them as 0 draws a cliff.
  const closes = raw.filter((v) => Number.isFinite(v));
  if (closes.length < 2) return <span className="inline-block w-14" />;
  const min = Math.min(...closes);
  const max = Math.max(...closes);
  const span = max - min || 1;
  const points = closes.map((v, i) => `${(i / (closes.length - 1)) * 56},${22 - ((v - min) / span) * 20}`).join(" ");
  const up = closes[closes.length - 1] >= closes[0];
  return (
    <svg width="56" height="24" viewBox="0 0 56 24" aria-hidden="true" className="shrink-0">
      <polyline
        points={points}
        fill="none"
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        className={up ? "stroke-teal-600" : "stroke-red-600 dark:stroke-red-500"}
      />
    </svg>
  );
}

const FILTERS: { key: WatchFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "gainers", label: "Gainers" },
  { key: "losers", label: "Losers" },
  { key: "holdings", label: "Holdings" },
];

function Watchlist({ stocks, isLoading, selectedSymbol, onSelect, holdings }: WatchlistProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<WatchFilter>("all");
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "change", dir: -1 });

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = stocks.filter((s) => {
      if (q && !s.shortName.toLowerCase().includes(q) && !s.fullName.toLowerCase().includes(q)) return false;
      if (filter === "gainers") return (s.changePct ?? 0) > 0;
      if (filter === "losers") return (s.changePct ?? 0) < 0;
      if (filter === "holdings") return Boolean(holdings[s.symbol]);
      return true;
    });
    const value = (s: MarketStock) => (sort.key === "name" ? s.shortName : sort.key === "price" ? (s.price ?? -Infinity) : (s.changePct ?? -Infinity));
    return [...filtered].sort((a, b) => {
      const va = value(a);
      const vb = value(b);
      return (typeof va === "string" ? va.localeCompare(vb as string) : (va as number) - (vb as number)) * sort.dir;
    });
  }, [stocks, query, filter, sort, holdings]);

  const toggleSort = (key: SortKey) =>
    setSort((prev) => (prev.key === key ? { key, dir: prev.dir === 1 ? -1 : 1 } : { key, dir: key === "name" ? 1 : -1 }));

  const sortLabel = (key: SortKey, label: string) => (
    <button type="button" onClick={() => toggleSort(key)} className="inline-flex items-center gap-1 hover:text-gray-900 dark:hover:text-white">
      {label}
      <span aria-hidden="true" className="w-2">{sort.key === key ? (sort.dir === 1 ? "↑" : "↓") : ""}</span>
    </button>
  );
  const ariaSort = (key: SortKey) => (sort.key === key ? (sort.dir === 1 ? "ascending" : "descending") : "none");

  return (
    <section aria-labelledby="watchlist-heading" className="flex flex-col rounded-2xl bg-white shadow-sm ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-gray-800 dark:shadow-none min-h-0 lg:h-full">
      <div className="p-4 pb-3 space-y-3">
        <h2 id="watchlist-heading" className="text-base font-semibold">
          Stocks <span className="text-sm font-normal text-gray-500 dark:text-gray-400">({rows.length})</span>
        </h2>
        <input
          type="search"
          aria-label="Search stocks"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or symbol"
          className="w-full rounded-lg bg-gray-100 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
        />
        <div role="group" aria-label="Filter stocks" className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              aria-pressed={filter === f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                filter === f.key
                  ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-y-auto max-h-[560px] lg:max-h-none lg:flex-1 border-t border-gray-100 dark:border-gray-800">
        <table className="w-full table-fixed text-sm">
          <caption className="sr-only">Stocks with price, today&apos;s change and 30-day trend</caption>
          <thead className="sticky top-0 z-10 bg-white text-xs text-gray-500 dark:bg-gray-900 dark:text-gray-400">
            <tr>
              <th scope="col" aria-sort={ariaSort("name")} className="pl-4 pr-2 py-2 text-left font-medium">{sortLabel("name", "Name")}</th>
              <th scope="col" className="w-[64px] py-2 font-medium"><span className="sr-only">30-day trend</span></th>
              <th scope="col" aria-sort={ariaSort("price")} className="w-[88px] px-2 py-2 text-right font-medium">{sortLabel("price", "Price")}</th>
              <th scope="col" aria-sort={ariaSort("change")} className="w-[76px] pl-1 pr-4 py-2 text-right font-medium">{sortLabel("change", "Chg")}</th>
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 8 }, (_, i) => (
                  <tr key={i}>
                    <td colSpan={4} className="px-4 py-2.5">
                      <div className="h-6 rounded bg-gray-100 dark:bg-gray-800 animate-pulse" />
                    </td>
                  </tr>
                ))
              : rows.map((s) => {
                  const selected = s.symbol === selectedSymbol;
                  return (
                    <tr
                      key={s.symbol}
                      onClick={() => onSelect(s.symbol)}
                      className={`cursor-pointer border-t border-gray-50 dark:border-gray-800/60 ${
                        selected ? "bg-blue-50 dark:bg-blue-500/10" : "hover:bg-gray-50 dark:hover:bg-gray-800/60"
                      }`}
                    >
                      <td className="pl-4 pr-2 py-2">
                        <button
                          type="button"
                          aria-current={selected ? "true" : undefined}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelect(s.symbol);
                          }}
                          className="block w-full min-w-0 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
                        >
                          <span className="block font-medium truncate">{s.shortName}</span>
                          <span className="block text-xs text-gray-500 dark:text-gray-400 truncate">{s.fullName}</span>
                        </button>
                      </td>
                      <td className="py-2">
                        <Sparkline closes={s.closes} />
                      </td>
                      <td className="px-2 py-2 text-right tabular-nums whitespace-nowrap">{s.price != null ? formatInr(s.price) : "—"}</td>
                      <td className={`pl-1 pr-4 py-2 text-right text-xs tabular-nums whitespace-nowrap ${changeTextClass(s.changePct)}`}>
                        {s.changePct != null ? (
                          <>
                            <span aria-hidden="true" className="text-[10px]">{changeGlyph(s.changePct)} </span>
                            {s.changePct >= 0 ? "+" : ""}
                            {s.changePct.toFixed(2)}%
                          </>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  );
                })}
            {!isLoading && rows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-500">
                  No stocks match.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default Watchlist;
