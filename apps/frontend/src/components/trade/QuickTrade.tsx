"use client";
import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import { PiMagnifyingGlass, PiSpinnerGap } from "react-icons/pi";
import toast from "react-hot-toast";
import { STOCK_LIST as stockList } from "@tradexcel/shared";
import type { StockListing } from "../../types/market";
import { getStockData } from "../../api/api";
import TradeModal from "./TradeModal";

// The stock list has a few duplicate symbols; keep one of each.
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

// Search-to-trade bar: type a stock and buy or sell it in place, instead of
// leaving the page for Market. Your holdings are suggested before you type.
function QuickTrade({ cash, holdings, onTraded }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [target, setTarget] = useState<Target | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
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

  // "T" opens the panel from anywhere on the page, unless you're typing.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== "t" || e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
      const el = e.target as HTMLElement | null;
      if (el && (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName))) return;
      if (document.querySelector('[role="dialog"][aria-modal="true"]')) return; // a modal or the tour is open
      e.preventDefault();
      inputRef.current?.focus();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        inputRef.current?.blur();
      }
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
    <div ref={rootRef} className="relative w-full sm:w-80">
      {/* A search field with a "Trade" end cap: type a stock, then buy or sell it from the list below. */}
      <div
        className={`flex items-stretch overflow-hidden rounded-xl bg-white ring-1 transition-shadow dark:bg-gray-900 ${
          open ? "ring-2 ring-blue-500" : "ring-gray-200 hover:ring-gray-300 dark:ring-gray-700 dark:hover:ring-gray-600"
        }`}
      >
        <label className="relative flex-1">
          <span className="sr-only">Search a stock to trade</span>
          <PiMagnifyingGlass aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder="Search a stock to trade"
            aria-controls={panelId}
            aria-keyshortcuts="t"
            autoComplete="off"
            className="w-full bg-transparent py-2.5 pl-9 pr-3 text-sm outline-none placeholder:text-gray-500 dark:placeholder:text-gray-400"
          />
        </label>
        <button
          type="button"
          onClick={() => inputRef.current?.focus()}
          aria-controls={panelId}
          className="bg-blue-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
        >
          Trade
        </button>
      </div>

      {open && (
        <div
          id={panelId}
          role="region"
          aria-label="Stocks to trade"
          className="absolute right-0 z-40 mt-2 w-full min-w-[min(22rem,calc(100vw-2.5rem))] overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-gray-700"
        >
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
