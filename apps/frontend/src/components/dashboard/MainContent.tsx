"use client";
import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { Contest, PortfolioHolding, PortfolioSummary, RankedUser } from "@tradexcel/shared";
import { getContests, getLeaderboard, getPortfolio, getUserName } from "../../api/api";
import { formatInr, formatSignedInr } from "../../utils/format";
import { useLiveQuotes } from "../../hooks/useLiveQuotes";
import { useMarketStatus } from "../../hooks/useMarketStatus";
import { useMinuteClock } from "../../hooks/useMinuteClock";
import { STARTING_BALANCE, formatCountdown, nextReset } from "../../utils/season";
import { changeGlyph, changeTextClass } from "../market/marketColors";
import LiveStatusBadge from "../layout/LiveStatusBadge";
import MarketClosedBanner from "../layout/MarketClosedBanner";
import { Card } from "../ui/Panel";
import { STOCK_LIST as stockList } from "@tradexcel/shared";
import type { StockListing } from "../../types/market";
import MarketMovers from "./MarketMovers";
import QuickTrade from "../trade/QuickTrade";
import AllocationDonut, { colorSlices, type Slice } from "../portfolio/AllocationDonut";
import { useTheme } from "../../context/ThemeContext";
import quotes from "./Quote.json";

const NAMES = new Map((stockList as StockListing[]).map((s) => [s.symbol, s.shortName]));
const stockName = (symbol: string) => NAMES.get(symbol) ?? symbol.replace(/\.(NS|BO)$/, "");

const signedPct = (v: number) => `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`;

function greeting(now: number | null) {
  if (now == null) return "Welcome back";
  const hour = new Date(now).getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

const Skeleton = ({ className }: { className: string }) => <span className={`inline-block animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800 ${className}`} />;

function MainContent() {
  const [userName, setUserName] = useState<string | null>(null);
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [holdings, setHoldings] = useState<PortfolioHolding[]>([]);
  const [isLoadingSummary, setIsLoadingSummary] = useState(true);
  const [me, setMe] = useState<RankedUser | null>(null);
  const [totalPlayers, setTotalPlayers] = useState(0);
  const [liveContests, setLiveContests] = useState<Contest[] | null>(null);
  const now = useMinuteClock();
  const { darkMode } = useTheme();

  // State is only set after the request resolves, so the effect can call this directly.
  const loadPortfolio = useCallback(() => {
    return getPortfolio()
      .then((res) => {
        setSummary(res?.data?.summary || null);
        setHoldings(res?.data?.holdings || []);
      })
      .catch(() => {})
      .finally(() => setIsLoadingSummary(false));
  }, []);

  useEffect(() => {
    getUserName()
      .then((res) => setUserName(res?.data?.name ?? ""))
      .catch(() => setUserName(""));

    loadPortfolio();

    getLeaderboard(1)
      .then((res) => {
        setMe(res?.data?.currentUser ?? null);
        setTotalPlayers(res?.data?.totalPlayers ?? 0);
      })
      .catch(() => {});

    getContests("public")
      .then((res) => setLiveContests((res?.data || []).filter((c: Contest) => c.status === "LIVE")))
      .catch(() => setLiveContests([]));
  }, [loadPortfolio]);

  const { quotes: liveQuotes, connected: liveConnected } = useLiveQuotes(holdings.map((h) => h.symbol));
  const marketStatus = useMarketStatus();

  // Same math as portfolio.controller.ts's getPortfolio, run client-side on each live tick.
  const liveHoldings = holdings.map((holding) => {
    const tick = liveQuotes[holding.symbol];
    if (!tick) return holding;
    return { ...holding, currentPrice: tick.price, currentValue: tick.price * Number(holding.quantity), priceStale: false };
  });

  const cash = Number(summary?.walletBalance ?? 0);
  const invested = Number(summary?.totalInvested ?? 0);
  const holdingsValue = liveHoldings.reduce((sum, h) => sum + Number(h.currentValue ?? h.investedValue ?? 0), 0);
  const netWorth = cash + holdingsValue;
  const seasonReturn = netWorth - STARTING_BALANCE;
  const openPnl = holdingsValue - invested;

  const byValue = [...liveHoldings].sort((a, b) => Number(b.currentValue ?? b.investedValue) - Number(a.currentValue ?? a.investedValue));
  const topHoldings = byValue.slice(0, 5);
  const valueOf = (h: PortfolioHolding) => Number(h.currentValue ?? h.investedValue);

  // Same slicing as the Portfolio page's donut: 4 holdings, "Other", cash.
  const otherValue = byValue.slice(4).reduce((sum, h) => sum + valueOf(h), 0);
  const slices: Slice[] = [
    ...byValue.slice(0, 4).map((h): Slice => ({ key: h.symbol, label: stockName(h.symbol), value: valueOf(h), kind: "holding" })),
    ...(otherValue > 0 ? [{ key: "other", label: "Other", value: otherValue, kind: "other" } as Slice] : []),
    { key: "cash", label: "Cash", value: cash, kind: "cash" },
  ];
  const colors = new Map(colorSlices(slices, darkMode).map((s) => [s.key, s.color]));

  const dailyQuote = now != null ? quotes[new Date(now).getDate() % quotes.length] : null;

  return (
    <main className="mb-20 min-w-0 flex-1 space-y-4 font-pop md:mb-0 px-5 py-6 md:px-8 md:py-8 lg:px-12 lg:py-10">
      {/* Greeting */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">
            {greeting(now)}
            {userName == null ? <Skeleton className="ml-2 h-7 w-28 align-middle" /> : userName && <>, {userName.split(" ")[0]}</>}
          </h1>
          <div className="mt-1 h-0.5 w-24 rounded-full bg-blue-600 dark:bg-blue-400 animate-line" />
          <p data-tour="season" className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {now != null ? <>Season resets in {formatCountdown(nextReset(new Date(now)).getTime() - now)}</> : " "}
            {liveContests != null && liveContests.length > 0 && (
              <>
                {" · "}
                <Link href="/contest" className="font-medium text-blue-600 hover:underline dark:text-blue-400">
                  {liveContests.length} {liveContests.length === 1 ? "contest" : "contests"} live
                </Link>
              </>
            )}
          </p>
        </div>
        <div data-tour="quick-trade" className="w-full sm:w-auto">
          <QuickTrade cash={cash} holdings={holdings} onTraded={loadPortfolio} />
        </div>
      </div>

      {dailyQuote && (
        <figure className="rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-gray-200 dark:bg-gray-900 dark:shadow-none dark:ring-gray-800 md:px-5">
          <div className="min-w-0 text-sm">
            <blockquote className="inline italic text-gray-700 dark:text-gray-200">{dailyQuote.quote}</blockquote>
            <figcaption className="inline text-gray-500 dark:text-gray-400"> — {dailyQuote.author}</figcaption>
          </div>
        </figure>
      )}

      <MarketClosedBanner />

      {/* Left: portfolio (net worth, then holdings). Right: today's market. */}
      <div className="grid gap-4 lg:grid-cols-3">
        <section className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-200 dark:bg-gray-900 dark:shadow-none dark:ring-gray-800 lg:col-span-2">
          <div data-tour="networth" className="p-5 md:p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xs text-gray-500 dark:text-gray-400">Net worth</h2>
              <LiveStatusBadge connected={liveConnected} marketOpen={marketStatus.open} />
            </div>
            {isLoadingSummary ? (
              <div className="mt-2 space-y-2">
                <Skeleton className="h-10 w-52" />
                <Skeleton className="block h-4 w-40" />
              </div>
            ) : (
              <>
                <p className="mt-1 text-4xl font-semibold tracking-tight tabular-nums">{formatInr(netWorth)}</p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  <span className={`font-semibold ${changeTextClass(seasonReturn)}`}>
                    {changeGlyph(seasonReturn)} {formatSignedInr(seasonReturn)} ({signedPct((seasonReturn / STARTING_BALANCE) * 100)})
                  </span>{" "}
                  this season
                </p>
              </>
            )}
            <dl className="mt-5 grid grid-cols-2 gap-x-3 gap-y-4 border-t border-gray-100 pt-4 dark:border-gray-800 sm:grid-cols-4">
              <div>
                <dt className="text-xs text-gray-500 dark:text-gray-400">Cash</dt>
                <dd className="mt-0.5 font-semibold tabular-nums">{isLoadingSummary ? <Skeleton className="h-5 w-20" /> : formatInr(cash)}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500 dark:text-gray-400">Invested</dt>
                <dd className="mt-0.5 font-semibold tabular-nums">{isLoadingSummary ? <Skeleton className="h-5 w-20" /> : formatInr(holdingsValue)}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500 dark:text-gray-400">Open P&amp;L</dt>
                <dd className={`mt-0.5 font-semibold tabular-nums ${isLoadingSummary ? "" : changeTextClass(openPnl)}`}>
                  {isLoadingSummary ? <Skeleton className="h-5 w-20" /> : formatSignedInr(openPnl)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500 dark:text-gray-400">Leaderboard</dt>
                <dd className="mt-0.5 font-semibold tabular-nums">
                  {me ? (
                    <Link href="/leaderboard" className="hover:underline">
                      #{me.rank}
                      <span className="font-normal text-gray-500 dark:text-gray-400"> of {totalPlayers}</span>
                    </Link>
                  ) : (
                    <Link href="/leaderboard" className="font-medium text-blue-600 hover:underline dark:text-blue-400">
                      View
                    </Link>
                  )}
                </dd>
              </div>
            </dl>
          </div>
          <div data-tour="holdings" className="border-t border-gray-100 p-5 dark:border-gray-800 md:p-6">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold">Holdings</h2>
              {holdings.length > 0 && (
                <Link href="/portfolio" className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400">
                  View portfolio
                </Link>
              )}
            </div>
            {isLoadingSummary ? (
              <div className="space-y-2">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-12 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
                ))}
              </div>
            ) : topHoldings.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center">
                <p className="font-medium">No holdings yet</p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">You have {formatInr(cash || STARTING_BALANCE)} to invest this season.</p>
                <Link href="/market" className="mt-4 rounded-xl bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700">
                  Make your first trade
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid items-center gap-6 sm:grid-cols-[1fr_auto]">
                  <ul className="-mx-2 min-w-0">
                    {topHoldings.map((h, i) => {
                      const value = valueOf(h);
                      const pnl = value - Number(h.investedValue);
                      const pnlPct = Number(h.investedValue) > 0 ? (pnl / Number(h.investedValue)) * 100 : 0;
                      const share = netWorth > 0 ? (value / netWorth) * 100 : 0;
                      return (
                        <li key={h.id}>
                          <Link
                            href={`/market?symbol=${encodeURIComponent(h.symbol)}`}
                            className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/60"
                          >
                            <span aria-hidden="true" className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: colors.get(i < 4 ? h.symbol : "other") }} />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-semibold">{stockName(h.symbol)}</span>
                              <span className="block text-xs tabular-nums text-gray-500 dark:text-gray-400">
                                {h.quantity} {Number(h.quantity) === 1 ? "share" : "shares"} · {share.toFixed(0)}% of net worth
                              </span>
                            </span>
                            <span className="text-right">
                              <span className="block text-sm font-semibold tabular-nums">{formatInr(value)}</span>
                              <span className={`block text-xs tabular-nums ${changeTextClass(pnl)}`}>
                                {changeGlyph(pnl)} {signedPct(pnlPct)}
                              </span>
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                    <li className="flex items-center gap-3 px-2 py-2.5">
                      <span aria-hidden="true" className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: colors.get("cash") }} />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold">Cash</span>
                        <span className="block text-xs tabular-nums text-gray-500 dark:text-gray-400">
                          {netWorth > 0 ? ((cash / netWorth) * 100).toFixed(0) : 0}% of net worth
                        </span>
                      </span>
                      <span className="text-sm font-semibold tabular-nums">{formatInr(cash)}</span>
                    </li>
                  </ul>
                  <AllocationDonut slices={slices} total={netWorth} legend={false} />
                </div>
                {holdings.length < 5 && (
                  <p className="rounded-xl bg-violet-50 px-3 py-2.5 text-xs text-violet-900 dark:bg-violet-500/10 dark:text-violet-200">
                    You hold {holdings.length} {holdings.length === 1 ? "stock" : "stocks"}. Spreading across 5 or more earns the{" "}
                    <Link href="/achievements" className="font-semibold text-violet-700 underline-offset-2 hover:underline dark:text-violet-300">
                      Diversified
                    </Link>{" "}
                    badge.{" "}
                    <Link href="/market" className="font-semibold text-violet-700 underline-offset-2 hover:underline dark:text-violet-300">
                      Find stocks
                    </Link>
                  </p>
                )}
              </div>
            )}
          </div>
        </section>

        <Card
          title="Today's market"
          tour="movers"
          action={
            <Link href="/market" className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400">
              All stocks
            </Link>
          }
        >
          {/* Longer list when the holdings list is long, so both columns end together. */}
          <MarketMovers limit={topHoldings.length >= 4 ? 8 : 6} />
        </Card>
      </div>
    </main>
  );
}

export default MainContent;
