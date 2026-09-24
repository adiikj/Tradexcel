"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { ChartData, ChartRange } from "@tradexcel/shared";
import Header from "../dashboard/Header";
import Vheader from "../dashboard/Vheader";
import { getBatchStockData, getChart, getWallet, getPortfolio } from "../../api/api";
import { STOCK_LIST as stockList } from "@tradexcel/shared";
import TradeModal from "../trade/TradeModal";
import { formatInr } from "../../utils/format";
import { useLiveQuotes } from "../../hooks/useLiveQuotes";
import { useMarketStatus } from "../../hooks/useMarketStatus";
import { tickToStockFields } from "../../utils/liveQuote";
import LiveStatusBadge from "../layout/LiveStatusBadge";
import MarketClosedBanner from "../layout/MarketClosedBanner";
import { useAsyncEffect } from "../../hooks/useAsyncEffect";
import { apiErrorMessage } from "../../api/http";
import type { MarketStock, StockListing } from "../../types/market";
import MarketOverview from "./MarketOverview";
import StockPanel from "./StockPanel";
import Watchlist from "./Watchlist";
import Heatmap from "./Heatmap";

// The stock list has a few duplicate symbols; keep the first of each.
const LISTINGS: StockListing[] = (stockList as StockListing[]).filter(
  (stock, i, all) => all.findIndex((s) => s.symbol === stock.symbol) === i
);

const INTRADAY_REFRESH_MS = 60_000;

// Batch/tick change fields come as strings: todayChange is signed ("+12.30"),
// percentageChange is unsigned ("0.73") - combine them into signed numbers.
function toChange(todayChange: unknown, percentageChange: unknown) {
  const change = parseFloat(String(todayChange));
  const magnitude = parseFloat(String(percentageChange));
  if (!Number.isFinite(change)) return { change: null, changePct: null };
  return { change, changePct: Number.isFinite(magnitude) ? Math.sign(change) * Math.abs(magnitude) : null };
}

type ChartState = { key: string; data: ChartData } | null;

function Market() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [balance, setBalance] = useState(0);
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);
  const [holdings, setHoldings] = useState<Record<string, number>>({});
  const [baseStocks, setBaseStocks] = useState<MarketStock[]>([]);
  const [isLoadingStocks, setIsLoadingStocks] = useState(true);
  const [tradeSide, setTradeSide] = useState<"BUY" | "SELL" | null>(null);
  const [range, setRange] = useState<ChartRange>("1D");
  const [chart, setChart] = useState<ChartState>(null);
  const [session, setSession] = useState<ChartState>(null);
  const [chartError, setChartError] = useState("");
  const [refreshTick, setRefreshTick] = useState(0);

  // ---- account (cash + holdings) ----
  const loadAccountState = useCallback(async (isActive: () => boolean = () => true) => {
    try {
      const [walletResponse, portfolioResponse] = await Promise.all([getWallet(), getPortfolio()]);
      if (!isActive()) return;
      setBalance(Number(walletResponse?.data?.balance ?? 0));
      const holdingsMap: Record<string, number> = {};
      for (const holding of portfolioResponse?.data?.holdings || []) {
        holdingsMap[holding.symbol] = holding.quantity;
      }
      setHoldings(holdingsMap);
    } catch {
      // Wallet/portfolio failed to load; balance stays at its last known value.
    } finally {
      if (isActive()) setIsLoadingBalance(false);
    }
  }, []);

  const refreshAccountState = useCallback(() => {
    setIsLoadingBalance(true);
    return loadAccountState();
  }, [loadAccountState]);

  useAsyncEffect((isActive) => loadAccountState(isActive), [loadAccountState]);

  // ---- quotes for every listed stock (one batch request) ----
  const loadStocks = useCallback(async (isActive: () => boolean) => {
    try {
      const batch = await getBatchStockData(LISTINGS.map((stock) => stock.symbol));
      if (!isActive()) return;
      setBaseStocks(
        LISTINGS.map((stock): MarketStock => {
          const data = batch[stock.symbol];
          return {
            ...stock,
            price: data?.currentPrice ?? null,
            ...toChange(data?.todayChange, data?.percentageChange),
            closes: data?.stockPrices ?? [],
          };
        })
      );
    } catch {
      if (isActive()) setBaseStocks(LISTINGS.map((stock) => ({ ...stock, price: null, change: null, changePct: null, closes: [] })));
    } finally {
      if (isActive()) setIsLoadingStocks(false);
    }
  }, []);

  useAsyncEffect((isActive) => loadStocks(isActive), [loadStocks]);

  const { quotes: liveQuotes, connected: liveConnected } = useLiveQuotes(LISTINGS.map((stock) => stock.symbol));
  const marketStatus = useMarketStatus();

  // Live ticks overlay the batch snapshot.
  const stocks = useMemo(
    () =>
      baseStocks.map((stock) => {
        const tick = liveQuotes[stock.symbol];
        if (!tick) return stock;
        const fields = tickToStockFields(tick);
        return { ...stock, price: fields.currentPrice, ...toChange(fields.todayChange, fields.percentageChange) };
      }),
    [baseStocks, liveQuotes]
  );

  // ---- selection (URL-driven, defaults to the first stock) ----
  const requestedSymbol = searchParams.get("symbol");
  const selectedSymbol = LISTINGS.some((s) => s.symbol === requestedSymbol) ? requestedSymbol : (LISTINGS[0]?.symbol ?? null);
  const selectedStock = stocks.find((stock) => stock.symbol === selectedSymbol) ?? null;
  const ownedQuantity = selectedSymbol ? holdings[selectedSymbol] || 0 : 0;

  const selectStock = useCallback(
    (symbol: string) => {
      router.replace(`/market?symbol=${encodeURIComponent(symbol)}`, { scroll: false });
    },
    [router]
  );

  // ---- charts: the chosen range, plus today's session for the key stats ----
  const chartKey = selectedSymbol ? `${selectedSymbol}:${range}` : "";
  const sessionKey = selectedSymbol ? `${selectedSymbol}:1D` : "";

  const loadChart = useCallback(
    async (symbol: string, chartRange: ChartRange, isActive: () => boolean) => {
      try {
        const data = await getChart(symbol, chartRange);
        if (!isActive()) return;
        setChart({ key: `${symbol}:${chartRange}`, data });
        if (chartRange === "1D") setSession({ key: `${symbol}:1D`, data });
        setChartError("");
      } catch (error) {
        if (isActive()) setChartError(apiErrorMessage(error, "Couldn't load the chart."));
      }
    },
    []
  );

  const loadSession = useCallback(async (symbol: string, isActive: () => boolean) => {
    try {
      const data = await getChart(symbol, "1D");
      if (isActive()) setSession({ key: `${symbol}:1D`, data });
    } catch {
      // Stats show "—" without the session; the main chart still renders.
    }
  }, []);

  useAsyncEffect(
    (isActive) => (selectedSymbol ? loadChart(selectedSymbol, range, isActive) : Promise.resolve()),
    // refreshTick re-runs the load on the intraday refresh timer.
    [selectedSymbol, range, refreshTick, loadChart]
  );

  useAsyncEffect(
    (isActive) => (selectedSymbol && range !== "1D" ? loadSession(selectedSymbol, isActive) : Promise.resolve()),
    [selectedSymbol, range, loadSession]
  );

  // Intraday charts follow the session while the market is open.
  useEffect(() => {
    if (!marketStatus.open || (range !== "1D" && range !== "5D")) return;
    const id = setInterval(() => setRefreshTick((n) => n + 1), INTRADAY_REFRESH_MS);
    return () => clearInterval(id);
  }, [marketStatus.open, range]);

  // Keep showing the previous chart (dimmed) until the new one arrives; a
  // different stock's chart is never shown under this one's name.
  const sameStock = chart?.key.startsWith(`${selectedSymbol}:`);
  const shownChart = sameStock ? chart!.data : null;
  const isChartLoading = chart?.key !== chartKey;
  const shownSession = session?.key === sessionKey ? session.data : null;

  return (
    <>
      <div className="bg-gray-50 text-gray-900 dark:bg-gray-800 dark:text-white min-h-screen transition-colors duration-300 font-pop">
        <Header />
        <div className="flex flex-col md:flex-row">
          <Vheader />
          <main className="flex-1 min-w-0 px-5 py-6 md:px-8 md:py-8 lg:px-12 lg:py-10 mb-20 md:mb-0 space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">Market</h1>
                <div className="h-0.5 w-28 bg-blue-600 dark:bg-blue-400 rounded-full mt-1 animate-line"></div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <LiveStatusBadge connected={liveConnected} marketOpen={marketStatus.open} />
                <span className="rounded-full bg-white px-3 py-1 ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-gray-700">
                  <span className="text-gray-500 dark:text-gray-400">Cash </span>
                  {isLoadingBalance ? (
                    <span className="inline-block h-3 w-16 rounded bg-gray-200 dark:bg-gray-700 animate-pulse align-middle" />
                  ) : (
                    <span className="font-semibold">{formatInr(balance)}</span>
                  )}
                </span>
              </div>
            </div>

            <MarketClosedBanner />

            <MarketOverview stocks={stocks} isLoading={isLoadingStocks} onSelect={selectStock} />

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(340px,400px)]">
              {selectedStock ? (
                <StockPanel
                  key={selectedStock.symbol}
                  stock={selectedStock}
                  chart={shownChart}
                  session={shownSession}
                  chartError={chartError}
                  isChartLoading={isChartLoading}
                  range={range}
                  onRangeChange={setRange}
                  ownedQuantity={ownedQuantity}
                  onBuy={() => setTradeSide("BUY")}
                  onSell={() => setTradeSide("SELL")}
                />
              ) : (
                <div className="min-h-[560px] rounded-2xl bg-white ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-gray-800 animate-pulse" />
              )}
              {/* On wide screens the watchlist matches the chart panel's height. */}
              <div className="lg:relative">
                <div className="lg:absolute lg:inset-0 flex flex-col">
                  <Watchlist
                    stocks={stocks}
                    isLoading={isLoadingStocks}
                    selectedSymbol={selectedSymbol}
                    onSelect={selectStock}
                    holdings={holdings}
                  />
                </div>
              </div>
            </div>

            {!isLoadingStocks && <Heatmap stocks={stocks} selectedSymbol={selectedSymbol} onSelect={selectStock} />}
          </main>
        </div>
      </div>
      {tradeSide && selectedStock && selectedStock.price != null && (
        <TradeModal
          symbol={selectedStock.symbol}
          fullName={selectedStock.fullName}
          side={tradeSide}
          initialPrice={selectedStock.price}
          availableCash={balance}
          availableQty={ownedQuantity}
          onClose={() => setTradeSide(null)}
          onSuccess={refreshAccountState}
        />
      )}
    </>
  );
}

export default Market;
