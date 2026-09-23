"use client";
import React, { useState, useEffect } from 'react';
import TopGainers from './TopGainers';
import TopLosers from './TopLosers';
import { getUserName, getPortfolio } from '../../api/api';
import Link from "next/link";
import quotes from './Quote.json';
import { formatInr, formatPercent, formatSignedInr } from '../../utils/format';
import { useLiveQuotes } from '../../hooks/useLiveQuotes';
import { useMarketStatus } from '../../hooks/useMarketStatus';
import LiveStatusBadge from '../layout/LiveStatusBadge';
import MarketClosedBanner from '../layout/MarketClosedBanner';
import type { PortfolioHolding, PortfolioSummary } from "@tradexcel/shared";

// Module-level so React keeps their identity between renders.
const StatSkeleton = () => (
  <span className={`inline-block h-6 md:h-8 w-20 rounded animate-pulse bg-gray-300 dark:bg-gray-700`} />
);
const HeroSkeleton = () => (
  <span className={`inline-block h-8 md:h-10 w-40 rounded animate-pulse bg-gray-300 dark:bg-gray-700`} />
);

function MainContent() {
  const [selectedMarket, setSelectedMarket] = useState('gainers');
  const [userName, setUserName] = useState('');
  const [isLoadingUserName, setIsLoadingUserName] = useState(true);
  const [dailyQuote] = useState(() => quotes[new Date().getDate() % quotes.length]);
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [holdings, setHoldings] = useState<PortfolioHolding[]>([]);
  const [isLoadingSummary, setIsLoadingSummary] = useState(true);

  const handleToggle = (marketType: string) => {
    setSelectedMarket(marketType);
  };

  useEffect(() => {
    const fetchUserName = async () => {
      try {
        const name = await getUserName();
        setUserName(name.data.name);
      } catch {
        setUserName('User');
      } finally {
        setIsLoadingUserName(false);
      }
    };

    const fetchSummary = async () => {
      try {
        setIsLoadingSummary(true);
        const response = await getPortfolio();
        setSummary(response?.data?.summary || null);
        setHoldings(response?.data?.holdings || []);
      } catch {
        // Summary stays null; the skeleton below just keeps showing.
      } finally {
        setIsLoadingSummary(false);
      }
    };

    fetchUserName();
    fetchSummary();
  }, []);

  const { quotes: liveQuotes, connected: liveConnected } = useLiveQuotes(holdings.map((h) => h.symbol));
  const marketStatus = useMarketStatus();

  // Same math as portfolio.controller.ts's getPortfolio, executed client-side
  // against the already-known avgBuyPrice/quantity once a live tick arrives.
  const liveHoldings = holdings.map((holding) => {
    const tick = liveQuotes[holding.symbol];
    if (!tick) return holding;

    const quantity = Number(holding.quantity);
    const currentValue = tick.price * quantity;

    return { ...holding, currentPrice: tick.price, currentValue, priceStale: false };
  });

  const walletBalance = Number(summary?.walletBalance ?? 0);
  const totalInvested = Number(summary?.totalInvested ?? 0);
  const holdingsValue = liveHoldings.reduce((sum, h) => sum + Number(h.currentValue ?? h.investedValue ?? 0), 0);
  const totalPnl = holdingsValue - totalInvested;
  const returnsPercent = totalInvested > 0 ? (totalPnl / totalInvested) * 100 : 0;
  const isPnlPositive = totalPnl >= 0;
  const netWorth = walletBalance + holdingsValue;
  const cashValue = walletBalance;
  const holdingsPercent = netWorth > 0 ? (holdingsValue / netWorth) * 100 : 0;
  const cashPercent = netWorth > 0 ? (cashValue / netWorth) * 100 : 0;

  return (
    <main className={`flex flex-col md:flex-row md:items-start w-10/12 md:w-10/12 rounded-2xl h-auto font-pop mx-7 md:mx-auto bg-white text-black dark:bg-gray-800 dark:text-white transition-colors duration-300`}>
      {/* Portfolio Section */}
      <div className="flex flex-col w-full md:w-3/5 m-6 ml-0 md:m-14 ">
        <div className="flex flex-col items-start">
          <div className="flex flex-col items-start mb-2 md:mt-0">
            <div className="text-2xl md:text-4xl font-semibold mt-5 flex items-center gap-2">
              Welcome{" "}
              {isLoadingUserName ? (
                <span className={`inline-block h-8 md:h-10 w-32 rounded animate-pulse bg-gray-300 dark:bg-gray-700`} />
              ) : (
                <span className="text-blue-500">{userName}!</span>
              )}
            </div>
            <div className="h-2 w-44 bg-blue-500 rounded-full animate-line"></div>
            <div className=" text-lg mt-10 font-semibold">Today&apos;s Quote</div>
            <div className="h-1 w-20 bg-blue-500 rounded-full animate-line" style={{ animationDelay: '0.15s' }}></div>
            <div className="text-sm md:text-base mt-2 mb-5">
              <p>&quot;{dailyQuote.quote}&quot;</p>
              <p className="mt-2 text-sm md:text-sm text-right">- {dailyQuote.author}</p>
            </div>
          </div>
        </div>

        <div className="text-lg md:text-xl font-semibold mb-1">My Portfolio</div>
        <div className="h-2 w-20 bg-blue-500 rounded-full mb-6 animate-line" style={{ animationDelay: '0.3s' }}></div>
        <MarketClosedBanner />
        <div className={`w-full rounded-3xl p-5 md:p-6 bg-grey text-black dark:bg-gray-900 dark:text-white transition-colors duration-300`}>
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`w-6 h-6 flex items-center justify-center rounded-full text-sm font-bold ${
                "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400"
              }`}
            >
              ₹
            </span>
            <span className="text-xs uppercase tracking-widest text-gray-400">Net Worth</span>
            <LiveStatusBadge connected={liveConnected} marketOpen={marketStatus.open} />
          </div>
          <div className="flex flex-wrap items-baseline gap-3 mb-5">
            <span className="text-2xl md:text-3xl font-bold tabular-nums">
              {isLoadingSummary ? <HeroSkeleton /> : formatInr(netWorth)}
            </span>
            {!isLoadingSummary && (
              <span
                className={`text-xs md:text-sm px-2.5 py-1 rounded-full font-semibold tabular-nums ${
                  isPnlPositive ? "bg-green-500/15 text-green-500" : "bg-red-500/15 text-red-500"
                }`}
              >
                {formatSignedInr(totalPnl)} ({formatPercent(returnsPercent)})
              </span>
            )}
          </div>

          <div className={`flex flex-wrap gap-x-8 gap-y-4 pt-4 border-t border-gray-300 dark:border-gray-700`}>
            <div>
              <div className="text-xs uppercase tracking-wide text-gray-400 mb-1">Invested</div>
              <div className="text-base font-semibold tabular-nums">
                {isLoadingSummary ? <StatSkeleton /> : formatInr(summary?.totalInvested)}
              </div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-gray-400 mb-1">Cash</div>
              <div className="text-base font-semibold tabular-nums">
                {isLoadingSummary ? <StatSkeleton /> : formatInr(summary?.walletBalance)}
              </div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-gray-400 mb-1">Holdings</div>
              <div className="text-base font-semibold tabular-nums">
                {isLoadingSummary ? <StatSkeleton /> : holdings.length}
              </div>
            </div>
          </div>

          {/* Allocation: real cash-vs-holdings split */}
          {!isLoadingSummary && netWorth > 0 && (
            <div className={`mt-5 pt-5 border-t border-gray-300 dark:border-gray-700`}>
              <div className="text-xs uppercase tracking-wide text-gray-400 mb-2">Allocation</div>
              <div className="w-full h-3 rounded-full overflow-hidden flex">
                <div className="bg-blue-500" style={{ width: `${holdingsPercent}%` }} title={`Holdings: ${holdingsPercent.toFixed(1)}%`} />
                <div className="bg-gray-300 dark:bg-gray-600" style={{ width: `${cashPercent}%` }} title={`Cash: ${cashPercent.toFixed(1)}%`} />
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  Holdings · {holdingsPercent.toFixed(1)}%
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <span className={`w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600`} />
                  Cash · {cashPercent.toFixed(1)}%
                </div>
              </div>
            </div>
          )}
        </div>
        {!isLoadingSummary && holdings.length === 0 && (
          <p className="mt-3 text-sm text-gray-400">
            No holdings yet.{" "}
            <Link href="/market" className="text-blue-500 underline">
              make your first trade
            </Link>
            .
          </p>
        )}
      </div>

      {/* Market Section */}
      <div className="flex flex-col w-full md:w-2/5 m-14 ml-2 md:mt-16 mt-6">
        <div className="text-lg md:text-xl font-semibold mb-1">Today&apos;s Market</div>
        <div className="h-2 w-20 bg-blue-500 rounded-full mb-6 animate-line" style={{ animationDelay: '0.45s' }}></div>
        <div className={`w-full h-auto rounded-3xl p-5 flex flex-col items-center mt-0 bg-grey text-black dark:bg-gray-900 dark:text-white transition-colors duration-300`}>
          <div className={`flex w-full mb-4 p-1 rounded-xl bg-gray-200 dark:bg-gray-800`}>
            <button
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 active:scale-95 ${
                selectedMarket === 'gainers'
                  ? 'bg-green-500 text-white shadow'
                  : "text-gray-600 hover:text-black dark:text-gray-300 dark:hover:text-white"
              }`}
              onClick={() => handleToggle('gainers')}
            >
              Top Gainers
            </button>
            <button
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 active:scale-95 ${
                selectedMarket === 'losers'
                  ? 'bg-red-500 text-white shadow'
                  : "text-gray-600 hover:text-black dark:text-gray-300 dark:hover:text-white"
              }`}
              onClick={() => handleToggle('losers')}
            >
              Top Losers
            </button>
          </div>

          {/* Market Content */}
          <div className="w-full h-full text-center text-sm">
            {selectedMarket === 'gainers' ? <TopGainers /> : <TopLosers />}
            <Link href="/market" className="text-sm md:text-sm text-blue-500 hover:underline">See More &gt;</Link>
          </div>
        </div>
      </div>
    </main>
  );
}

export default MainContent;
