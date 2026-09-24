"use client";
import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import { PiMagnifyingGlass, PiSpinnerGap } from "react-icons/pi";
import toast from "react-hot-toast";
import stockList from "../market/StockData.json";
import type { StockListing } from "../../types/market";
import { getStockData } from "../../api/api";
import TradeModal from "./TradeModal";

// StockData.json has a few duplicate symbols; keep one of each.
const STOCKS = Array.from(new Map((stockList as StockListing[]).map((s) => [s.symbol, s])).values());
const BY_SYMBOL = new Map(STOCKS.map((s) => [s.symbol, s]));
const MAX_RESULTS = 8;

type Props = {
  cash: number;
  holdings: { symbol: string; quantity: number }[];
  // Called after a trade goes through, so the page can refresh its numbers.
  onTraded: () => void;
};

type Target = { symbol: string; fullName: string; side: "BUY" | "SELL"; price: number; availableQty: number };

// "Quick trade": search a stock and buy or sell it in place, instead of
// leaving the page for Market. Your holdings are suggested before you type.
function QuickTrade({ cash, holdings, onTraded }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [target, setTarget] = useState<Target | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  const held = useMemo(() => new Map(holdings.map((h) => [h.symbol, Number(h.quantity)])), [holdings]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      const mine = holdings.flatMap((h) => BY_SYMBOL.get(h.symbol) ?? []);
      const rest = STOCKS.filter((s) => !held.has(s.symbol));
      return [...mine, ...rest].slice(0, MAX_RESULTS);
    }
    return STOCKS.filter(
      (s) => s.shortName.toLowerCase().includes(q) || s.fullName.toLowerCase().includes(q) || s.symbol.toLowerCase().includes(q)
    ).slice(0, MAX_RESULTS);
  }, [query, holdings, held]);

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const start = async (stock: StockListing, side: "BUY" | "SELL") => {
    const key = `${stock.symbol}:${side}`;
    setLoading(key);
    try {
      const data = await getStockData(stock.symbol);
      if (!data?.currentPrice) throw new Error("no price");
      setTarget({ symbol: stock.symbol, fullName: stock.fullName, side, price: data.currentPrice, availableQty: held.get(stock.symbol) ?? 0 });
      setOpen(false);
      setQuery("");
    } catch {
      toast.error(`Couldn't get a price for ${stock.shortName}. Try again.`);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={panelId}
        className={`rounded-xl px-4 py-2 text-sm font-medium shadow-sm ring-1 transition-colors ${
          open
            ? "bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:ring-blue-500/30"
            : "bg-white ring-gray-200 hover:bg-gray-50 dark:bg-gray-900 dark:ring-gray-700 dark:hover:bg-gray-800"
        }`}
      >
        Quick trade
      </button>

      {open && (
        <div
          id={panelId}
          role="dialog"
          aria-label="Quick trade"
          className="absolute right-0 z-40 mt-2 w-[min(22rem,calc(100vw-2.5rem))] overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-gray-700"
        >
          <label className="relative block border-b border-gray-100 dark:border-gray-800">
            <span className="sr-only">Search stocks</span>
            <PiMagnifyingGlass aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              autoFocus
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search a stock to trade"
              className="w-full bg-transparent py-3 pl-10 pr-4 text-sm outline-none placeholder:text-gray-400"
            />
          </label>

          {!query.trim() && holdings.length > 0 && (
            <p className="px-4 pt-2.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Your stocks first</p>
          )}

          {results.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">No stocks match &ldquo;{query.trim()}&rdquo;.</p>
          ) : (
            <ul className="max-h-80 overflow-y-auto py-1">
              {results.map((stock) => {
                const qty = held.get(stock.symbol);
                return (
                  <li key={stock.symbol} className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800/60">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{stock.shortName}</span>
                      <span className="block truncate text-xs text-gray-500 dark:text-gray-400">
                        {qty ? `You own ${qty} · ` : ""}
                        {stock.fullName}
                      </span>
                    </span>
                    {qty ? (
                      <button
                        type="button"
                        onClick={() => start(stock, "SELL")}
                        disabled={loading != null}
                        aria-label={`Sell ${stock.shortName}`}
                        className="rounded-lg px-2.5 py-1 text-xs font-medium text-red-600 ring-1 ring-red-200 hover:bg-red-50 disabled:opacity-50 dark:text-red-400 dark:ring-red-500/30 dark:hover:bg-red-500/10"
                      >
                        {loading === `${stock.symbol}:SELL` ? <PiSpinnerGap aria-hidden="true" className="h-3.5 w-3.5 animate-spin" /> : "Sell"}
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => start(stock, "BUY")}
                      disabled={loading != null}
                      aria-label={`Buy ${stock.shortName}`}
                      className="rounded-lg bg-blue-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      {loading === `${stock.symbol}:BUY` ? <PiSpinnerGap aria-hidden="true" className="h-3.5 w-3.5 animate-spin" /> : "Buy"}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {target && (
        <TradeModal
          symbol={target.symbol}
          fullName={target.fullName}
          side={target.side}
          initialPrice={target.price}
          availableCash={cash}
          availableQty={target.availableQty}
          onClose={() => setTarget(null)}
          onSuccess={onTraded}
        />
      )}
    </div>
  );
}

export default QuickTrade;
