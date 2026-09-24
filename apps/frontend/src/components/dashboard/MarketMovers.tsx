"use client";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getBatchStockData } from "../../api/api";
import stockUniverse from "../market/StockData.json";
import { rankFromData, type StockData } from "./marketMovers";
import { useLiveQuotes } from "../../hooks/useLiveQuotes";
import { tickToStockFields } from "../../utils/liveQuote";
import { changeGlyph, changeTextClass } from "../market/marketColors";
import { formatInr } from "../../utils/format";
import Sparkline from "../ui/Sparkline";

const allSymbols = [...new Set(stockUniverse.map((s) => s.symbol))];

type Direction = "gainers" | "losers";

// Today's top gainers or losers across the stock universe. Quotes are
// fetched once and re-ranked on every live tick; switching tabs is instant.
function MarketMovers({ limit = 5 }: { limit?: number }) {
  const [direction, setDirection] = useState<Direction>("gainers");
  const [baseData, setBaseData] = useState<Record<string, StockData>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getBatchStockData(allSymbols)
      .then((data) => {
        if (!cancelled) setBaseData(data || {});
      })
      .catch(() => {
        // Leave baseData empty; the list shows its empty state.
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const { quotes: liveQuotes } = useLiveQuotes(allSymbols);

  const merged = useMemo(() => {
    const out: Record<string, StockData> = {};
    for (const symbol of Object.keys(baseData)) {
      const base = baseData[symbol];
      const tick = liveQuotes[symbol];
      out[symbol] = base && tick ? { ...base, ...tickToStockFields(tick) } : base;
    }
    return out;
  }, [baseData, liveQuotes]);

  const movers = useMemo(() => rankFromData(stockUniverse, merged, direction, limit), [merged, direction, limit]);

  return (
    <div>
      <div role="group" aria-label="Market movers" className="mb-3 flex rounded-xl bg-gray-100 p-0.5 dark:bg-gray-800">
        {(["gainers", "losers"] as const).map((d) => (
          <button
            key={d}
            type="button"
            aria-pressed={direction === d}
            onClick={() => setDirection(d)}
            className={`flex-1 rounded-lg py-1.5 text-xs font-medium transition-colors ${
              direction === d
                ? d === "gainers"
                  ? "bg-white text-teal-700 shadow-sm dark:bg-teal-500/20 dark:text-teal-300"
                  : "bg-white text-rose-600 shadow-sm dark:bg-rose-500/20 dark:text-rose-300"
                : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            }`}
          >
            {d === "gainers" ? "Top gainers" : "Top losers"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: limit }, (_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
          ))}
        </div>
      ) : movers.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
          {direction === "gainers" ? "No gainers right now. The market's broadly down today." : "No losers right now. The market's broadly up today."}
        </p>
      ) : (
        <ul className="-mx-2">
          {movers.map((stock) => {
            const price = merged[stock.symbol]?.currentPrice;
            return (
              <li key={stock.symbol}>
                <Link
                  href={`/market?symbol=${encodeURIComponent(stock.symbol)}`}
                  className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/60"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{stock.shortName}</span>
                    <span className="block truncate text-xs text-gray-500 dark:text-gray-400">{stock.fullName}</span>
                  </span>
                  <Sparkline values={stock.stockPrices} />
                  <span className="w-24 shrink-0 text-right">
                    <span className="block text-sm font-medium tabular-nums">{price != null ? formatInr(price) : "—"}</span>
                    <span className={`block text-xs tabular-nums ${changeTextClass(stock.signedChange)}`}>
                      {changeGlyph(stock.signedChange)} {stock.signedChange >= 0 ? "+" : ""}
                      {stock.signedChange.toFixed(2)}%
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default MarketMovers;
