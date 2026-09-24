"use client";
import React, { useEffect, useState } from "react";
import { getBatchStockData } from "../../api/api";
import stockList from "../market/StockData.json";
import type { StockListing } from "../../types/market";

// Large, well-known NSE names for the landing page tape.
export const TICKER_SYMBOLS = [
  "RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "INFY.NS", "ICICIBANK.NS", "SBIN.NS", "BHARTIARTL.NS", "ITC.NS", "LT.NS", "HINDUNILVR.NS",
  "KOTAKBANK.NS", "AXISBANK.NS", "MARUTI.NS", "TITAN.NS", "BAJFINANCE.NS", "SUNPHARMA.NS", "ASIANPAINT.NS", "WIPRO.NS", "TATASTEEL.NS", "NTPC.NS",
];

const NAMES = new Map((stockList as StockListing[]).map((s) => [s.symbol, s.shortName]));

type RawQuote = { currentPrice?: number; percentageChange?: string | number; todayChange?: string | number; stockPrices?: number[] } | null;

// One request per page load, shared by every ticker on the page (the bento and
// the closing call to action both show the same symbols).
// Reused for a minute, then refetched, so prices never go stale across page visits.
const SHARE_MS = 60_000;
const inflight = new Map<string, { at: number; promise: Promise<Record<string, RawQuote>> }>();
function fetchQuotes(symbols: string[]) {
  const key = symbols.join(",");
  const hit = inflight.get(key);
  if (hit && Date.now() - hit.at < SHARE_MS) return hit.promise;
  const promise = getBatchStockData(symbols)
    .then((res) => (res || {}) as Record<string, RawQuote>)
    .catch(() => {
      inflight.delete(key); // let a later mount try again
      return {} as Record<string, RawQuote>;
    });
  inflight.set(key, { at: Date.now(), promise });
  return promise;
}

export type TickerQuote = { symbol: string; name: string; price: number | null; changePct: number | null; closes: number[] };

// Live quotes from the public /finance/quotes endpoint. Until they arrive (or
// if the request fails) callers get names only, never invented numbers.
export function useTickerQuotes(symbols: string[] = TICKER_SYMBOLS): TickerQuote[] {
  const [data, setData] = useState<Record<string, RawQuote>>({});

  useEffect(() => {
    let cancelled = false;
    fetchQuotes(symbols).then((res) => {
      if (!cancelled) setData(res);
    });
    return () => {
      cancelled = true;
    };
  }, [symbols]);

  return symbols.map((symbol) => {
    const q = data[symbol];
    const magnitude = q ? parseFloat(String(q.percentageChange ?? "")) : NaN;
    // percentageChange is unsigned; the sign lives in todayChange.
    const negative = String(q?.todayChange ?? "").trim().startsWith("-");
    return {
      symbol,
      name: NAMES.get(symbol) ?? symbol.replace(/\.NS$/, ""),
      price: q?.currentPrice ?? null,
      changePct: Number.isFinite(magnitude) ? (negative ? -magnitude : magnitude) : null,
      closes: (q?.stockPrices ?? []).filter((v) => Number.isFinite(v)),
    };
  });
}

function TickerItem({ q, dark }: { q: TickerQuote; dark: boolean }) {
  const up = (q.changePct ?? 0) >= 0;
  return (
    <span className="flex shrink-0 items-center gap-2 px-5 text-sm">
      <span className={`font-pop font-semibold ${dark ? "text-white" : "text-gray-900"}`}>{q.name}</span>
      {q.price != null && (
        <span className={`tabular-nums ${dark ? "text-gray-300" : "text-gray-600"}`}>
          ₹{q.price.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
        </span>
      )}
      {q.changePct != null && (
        <span className={`font-medium tabular-nums ${up ? (dark ? "text-green-400" : "text-green-700") : dark ? "text-red-400" : "text-red-600"}`}>
          {up ? "▲" : "▼"} {Math.abs(q.changePct).toFixed(2)}%
        </span>
      )}
    </span>
  );
}

// An endless scrolling tape of live NSE quotes. Pauses on hover; people who
// prefer reduced motion get a static, wrapped row instead.
function LiveTicker({ quotes, dark = false, speed = 40 }: { quotes: TickerQuote[]; dark?: boolean; speed?: number }) {
  return (
    <div className="group relative overflow-hidden" aria-label="Live NSE prices">
      <div
        className="flex w-max motion-safe:animate-[ticker_var(--ticker-duration)_linear_infinite] group-hover:[animation-play-state:paused] motion-reduce:w-auto motion-reduce:flex-wrap"
        style={{ "--ticker-duration": `${speed}s` } as React.CSSProperties}
      >
        {/* The list twice, so the loop is seamless at -50%. */}
        {[0, 1].map((copy) => (
          <div key={copy} className={`flex ${copy === 1 ? "motion-reduce:hidden" : ""}`} aria-hidden={copy === 1 || undefined}>
            {quotes.map((q) => (
              <TickerItem key={`${copy}-${q.symbol}`} q={q} dark={dark} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default LiveTicker;
