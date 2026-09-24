"use client";
import React, { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { PiArrowRight, PiChartLineUp } from "react-icons/pi";
import type { PortfolioHolding, PortfolioSummary, QueuedOrder, TransactionRecord } from "@tradexcel/shared";
import Header from "../dashboard/Header";
import Vheader from "../dashboard/Vheader";
import { getBatchStockData, getPortfolio, getPublicProfile, getQueuedOrders, getTransactions, getUserProfile } from "../../api/api";
import TradeModal from "../trade/TradeModal";
import QuickTrade from "../trade/QuickTrade";
import { formatInr } from "../../utils/format";
import { useLiveQuotes } from "../../hooks/useLiveQuotes";
import { useMarketStatus } from "../../hooks/useMarketStatus";
import LiveStatusBadge from "../layout/LiveStatusBadge";
import MarketClosedBanner from "../layout/MarketClosedBanner";
import { useAsyncEffect } from "../../hooks/useAsyncEffect";
import { apiErrorMessage } from "../../api/http";
import { changeGlyph, changeTextClass } from "../market/marketColors";
import { STOCK_LIST as stockList } from "@tradexcel/shared";
import type { StockListing } from "../../types/market";
import HoldingsTable, { type HoldingRow } from "./HoldingsTable";
import AllocationDonut, { type Slice } from "./AllocationDonut";
import WeeklyResults, { type WeekResult } from "./WeeklyResults";
import RecentTrades from "./RecentTrades";
import QueuedOrders, { recentQueuedOrders } from "./QueuedOrders";
import { Card, StatTile } from "../ui/Panel";

// Every wallet starts each weekly season with this much (backend tradeMath.ts).
const STARTING_BALANCE = 100000;
const DONUT_HOLDINGS = 4;

const NAMES = new Map((stockList as StockListing[]).map((s) => [s.symbol, s]));

type Quote = { changePerShare: number | null; changePct: number | null; closes: number[] };

const signedPct = (v: number) => `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`;
const signedInr = (v: number) => `${v >= 0 ? "+" : "−"}${formatInr(Math.abs(v))}`;

function Portfolio() {
  const [holdings, setHoldings] = useState<PortfolioHolding[]>([]);
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [quotes, setQuotes] = useState<Record<string, Quote>>({});
  const [trades, setTrades] = useState<TransactionRecord[]>([]);
  const [queuedOrders, setQueuedOrders] = useState<QueuedOrder[]>([]);
  const [weeks, setWeeks] = useState<WeekResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [tradeModal, setTradeModal] = useState<{ symbol: string; side: "BUY" | "SELL"; initialPrice: number; availableQty: number } | null>(null);

  // State is only set after the first await, so effects can call this directly.
  const loadPortfolio = useCallback(async (isActive: () => boolean = () => true) => {
    try {
      const [portfolioRes, tradesRes, ordersRes] = await Promise.all([
        getPortfolio(),
        getTransactions(1, 6).catch(() => null),
        getQueuedOrders().catch(() => null),
      ]);
      if (!isActive()) return;
      const nextHoldings = portfolioRes?.data?.holdings || [];
      setHoldings(nextHoldings);
      setSummary(portfolioRes?.data?.summary || null);
      setTrades(tradesRes?.data?.transactions || []);
      setQueuedOrders(recentQueuedOrders(ordersRes?.data || [], Date.now()));
      setError("");

      // Today's move + 30-day trend for each holding (one batch request).
      if (nextHoldings.length > 0) {
        const batch = await getBatchStockData(nextHoldings.map((h) => h.symbol)).catch(() => ({}));
        if (!isActive()) return;
        const next: Record<string, Quote> = {};
        for (const h of nextHoldings) {
          const q = (batch as Record<string, { todayChange?: unknown; percentageChange?: unknown; stockPrices?: number[] } | null>)[h.symbol];
          const change = parseFloat(String(q?.todayChange));
          const magnitude = parseFloat(String(q?.percentageChange));
          next[h.symbol] = {
            changePerShare: Number.isFinite(change) ? change : null,
            changePct: Number.isFinite(change) && Number.isFinite(magnitude) ? Math.sign(change) * Math.abs(magnitude) : null,
            closes: q?.stockPrices ?? [],
          };
        }
        setQuotes(next);
      }
    } catch (err) {
      if (!isActive()) return;
      setError(apiErrorMessage(err, "We couldn't load your portfolio. Please try again."));
    } finally {
      if (isActive()) setIsLoading(false);
    }
  }, []);

  // Weekly season results live on the public profile.
  const loadWeeks = useCallback(async (isActive: () => boolean) => {
    try {
      const me = await getUserProfile();
      if (!isActive() || !me?.data?.username) return;
      const profile = await getPublicProfile(me.data.username);
      if (!isActive()) return;
      const history = [...(profile?.data?.weeklyPerformance ?? [])].reverse();
      setWeeks(
        history.map((w) => ({
          key: w.weekStart,
          label: new Date(w.weekStart).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
          pnlPercent: w.pnlPercent,
        }))
      );
    } catch {
      // The chart falls back to just this week.
    }
  }, []);

  // For buttons/handlers: show the loading state, then load.
  const fetchPortfolio = useCallback(() => {
    setIsLoading(true);
    return loadPortfolio();
  }, [loadPortfolio]);

  useAsyncEffect((isActive) => loadPortfolio(isActive), [loadPortfolio]);
  useAsyncEffect((isActive) => loadWeeks(isActive), [loadWeeks]);

  const { quotes: liveQuotes, connected: liveConnected } = useLiveQuotes(holdings.map((h) => h.symbol));
  const marketStatus = useMarketStatus();

  // ---- derived figures (live ticks overlay the fetched snapshot) ----
  const walletBalance = Number(summary?.walletBalance ?? 0);

  const rows: HoldingRow[] = useMemo(() => {
    const base = holdings.map((h) => {
      const tick = liveQuotes[h.symbol];
      const quote = quotes[h.symbol];
      const quantity = Number(h.quantity);
      const avgPrice = Number(h.avgBuyPrice);
      const invested = Number(h.investedValue ?? avgPrice * quantity);
      const price = tick ? tick.price : h.currentPrice != null ? Number(h.currentPrice) : null;
      const value = price != null ? price * quantity : invested;
      const pnl = price != null ? value - invested : null;
      const dayChangePct = tick?.changePercent != null ? tick.changePercent : (quote?.changePct ?? null);
      const listing = NAMES.get(h.symbol);
      return {
        symbol: h.symbol,
        shortName: listing?.shortName ?? h.symbol.replace(/\.NS$/, ""),
        fullName: listing?.fullName ?? h.symbol,
        quantity,
        avgPrice,
        price,
        value,
        invested,
        pnl,
        pnlPct: pnl != null && invested > 0 ? (pnl / invested) * 100 : null,
        dayChangePct,
        closes: quote?.closes ?? [],
        weight: 0,
        stale: !tick && Boolean(h.priceStale),
        dayChangePerShare: tick?.change ?? quote?.changePerShare ?? null,
      };
    });
    const totalValue = base.reduce((sum, r) => sum + r.value, 0);
    return base.map((r) => ({ ...r, weight: totalValue > 0 ? (r.value / totalValue) * 100 : 0 }));
  }, [holdings, liveQuotes, quotes]);

  const holdingsValue = rows.reduce((sum, r) => sum + r.value, 0);
  const invested = rows.reduce((sum, r) => sum + r.invested, 0);
  const unrealised = holdingsValue - invested;
  const netWorth = walletBalance + holdingsValue;
  const seasonReturn = netWorth - STARTING_BALANCE;
  const dayPnl = rows.reduce(
    (sum, r) => sum + (r.dayChangePerShare ?? 0) * r.quantity,
    0
  );
  const dayBase = holdingsValue - dayPnl;

  const slices: Slice[] = useMemo(() => {
    const byValue = [...rows].sort((a, b) => b.value - a.value);
    const shown = byValue.slice(0, DONUT_HOLDINGS);
    const rest = byValue.slice(DONUT_HOLDINGS);
    return [
      ...shown.map((r): Slice => ({ key: r.symbol, label: r.shortName, value: r.value, kind: "holding" })),
      ...(rest.length ? [{ key: "other", label: `Other (${rest.length})`, value: rest.reduce((s, r) => s + r.value, 0), kind: "other" as const }] : []),
      ...(walletBalance > 0 ? [{ key: "cash", label: "Cash", value: walletBalance, kind: "cash" as const }] : []),
    ].filter((s) => s.value > 0);
  }, [rows, walletBalance]);

  const weekResults: WeekResult[] = [
    ...weeks,
    ...(summary ? [{ key: "current", label: "This week", pnlPercent: (seasonReturn / STARTING_BALANCE) * 100, current: true }] : []),
  ];

  const openTrade = (row: HoldingRow, side: "BUY" | "SELL") =>
    setTradeModal({ symbol: row.symbol, side, initialPrice: row.price ?? row.avgPrice, availableQty: row.quantity });

  return (
    <>
      <div className="min-h-screen bg-gray-50 font-pop text-gray-900 transition-colors duration-300 dark:bg-gray-800 dark:text-white">
        <Header />
        <div className="flex">
          <Vheader />
          <main className="mb-20 min-w-0 flex-1 space-y-4 md:mb-0 px-5 py-6 md:px-8 md:py-8 lg:px-12 lg:py-10">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold md:text-3xl">Portfolio</h1>
                <div className="mt-1 h-0.5 w-32 rounded-full bg-blue-600 dark:bg-blue-400 animate-line" />
              </div>
              <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
                <LiveStatusBadge connected={liveConnected} marketOpen={marketStatus.open} />
                <QuickTrade cash={walletBalance} holdings={holdings} onTraded={fetchPortfolio} />
              </div>
            </div>

            <MarketClosedBanner />

            {error && (
              <div className="flex items-center gap-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">
                <span className="flex-1">{error}</span>
                <button type="button" onClick={fetchPortfolio} className="font-medium underline">
                  Retry
                </button>
              </div>
            )}

            {isLoading && !summary ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
                  <div className="col-span-2 h-32 animate-pulse rounded-2xl bg-white dark:bg-gray-900" />
                  {Array.from({ length: 3 }, (_, i) => (
                    <div key={i} className="h-32 animate-pulse rounded-2xl bg-white dark:bg-gray-900" />
                  ))}
                </div>
                <div className="h-80 animate-pulse rounded-2xl bg-white dark:bg-gray-900" />
              </div>
            ) : (
              <div className={`space-y-4 transition-opacity ${isLoading ? "opacity-60" : ""}`}>
                {/* Headline numbers */}
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
                  <div className="col-span-2 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200 dark:bg-gray-900 dark:shadow-none dark:ring-gray-800">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Net worth</p>
                    <p className="mt-1 text-4xl font-semibold tracking-tight tabular-nums">{formatInr(netWorth)}</p>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      <span className={`font-semibold ${changeTextClass(seasonReturn)}`}>
                        {changeGlyph(seasonReturn)} {signedInr(seasonReturn)} ({signedPct((seasonReturn / STARTING_BALANCE) * 100)})
                      </span>{" "}
                      this season
                    </p>
                    <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-gray-100 pt-3 text-xs text-gray-500 dark:border-gray-800 dark:text-gray-400">
                      <span>
                        Invested <span className="font-semibold text-gray-900 dark:text-white">{formatInr(invested)}</span>
                      </span>
                      <span>
                        Worth <span className="font-semibold text-gray-900 dark:text-white">{formatInr(holdingsValue)}</span>
                      </span>
                    </p>
                  </div>
                  <StatTile label="Today" hint={dayBase > 0 ? <span className={changeTextClass(dayPnl)}>{signedPct((dayPnl / dayBase) * 100)} on holdings</span> : "No holdings"}>
                    <span className={changeTextClass(dayPnl)}>
                      {changeGlyph(dayPnl)} {signedInr(dayPnl)}
                    </span>
                  </StatTile>
                  <StatTile label="Total return" hint={invested > 0 ? <span className={changeTextClass(unrealised)}>{signedPct((unrealised / invested) * 100)} unrealised</span> : "Nothing invested yet"}>
                    <span className={changeTextClass(unrealised)}>
                      {changeGlyph(unrealised)} {signedInr(unrealised)}
                    </span>
                  </StatTile>
                  <StatTile label="Cash" hint="Buying power">
                    {formatInr(walletBalance)}
                  </StatTile>
                </div>

                <QueuedOrders orders={queuedOrders} onChanged={fetchPortfolio} />

                {/* Holdings + allocation */}
                <div className="grid gap-4 lg:grid-cols-3">
                  <Card
                    title={`Holdings (${rows.length})`}
                    className="lg:col-span-2"
                    action={
                      <Link href="/market" className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline dark:text-blue-400">
                        Browse market <PiArrowRight aria-hidden="true" className="h-4 w-4" />
                      </Link>
                    }
                  >
                    {rows.length === 0 ? (
                      <div className="flex flex-col items-center py-10 text-center">
                        <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300">
                          <PiChartLineUp aria-hidden="true" className="h-6 w-6" />
                        </span>
                        <p className="font-medium">No holdings yet</p>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">You have {formatInr(walletBalance)} to invest this season.</p>
                        <Link href="/market" className="mt-4 rounded-xl bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700">
                          Find a stock
                        </Link>
                      </div>
                    ) : (
                      <HoldingsTable rows={rows} onBuy={(r) => openTrade(r, "BUY")} onSell={(r) => openTrade(r, "SELL")} />
                    )}
                  </Card>
                  <Card title="Allocation">
                    <AllocationDonut slices={slices} total={netWorth} />
                  </Card>
                </div>

                {/* Seasons + recent trades */}
                <div className="grid gap-4 lg:grid-cols-3">
                  <Card title="Weekly results" className="lg:col-span-2" action={<span className="text-xs text-gray-500 dark:text-gray-400">Return per season</span>}>
                    <WeeklyResults weeks={weekResults} />
                  </Card>
                  <Card
                    title="Recent trades"
                    action={
                      <Link href="/wallet" className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline dark:text-blue-400">
                        All <PiArrowRight aria-hidden="true" className="h-4 w-4" />
                      </Link>
                    }
                  >
                    <RecentTrades trades={trades} />
                  </Card>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
      {tradeModal && (
        <TradeModal
          symbol={tradeModal.symbol}
          side={tradeModal.side}
          initialPrice={tradeModal.initialPrice}
          availableCash={walletBalance}
          availableQty={tradeModal.availableQty}
          onClose={() => setTradeModal(null)}
          onSuccess={fetchPortfolio}
        />
      )}
    </>
  );
}

export default Portfolio;
