"use client";
import React, { useState, useEffect } from 'react';
import TopGainers from './TopGainers';
import TopLosers from './TopLosers';
import { getUserName, getPortfolio } from '../../api/api';
import Link from "next/link";
import quotes from './Quote.json';
import { formatInr, formatPercent, formatSignedInr } from '../../utils/format';

function MainContent({ darkMode  }: any) {
  const [selectedMarket, setSelectedMarket] = useState<any>('gainers');
  const [userName, setUserName] = useState<any>('');
  const [isLoadingUserName, setIsLoadingUserName] = useState(true);
  const [dailyQuote] = useState<any>(() => quotes[new Date().getDate() % quotes.length]);
  const [summary, setSummary] = useState<any>(null);
  const [holdingsCount, setHoldingsCount] = useState(0);
  const [isLoadingSummary, setIsLoadingSummary] = useState(true);

  const handleToggle = (marketType) => {
    setSelectedMarket(marketType);
  };

  useEffect(() => {
    const fetchUserName = async () => {
      try {
        const authToken = (typeof window !== 'undefined' ? localStorage.getItem("authToken") : null);
        if (!authToken) {
          throw new Error("Authentication token is missing. Please log in again.");
        }

        const name = await getUserName();
        setUserName(name.data.name);
      } catch (error) {
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
        setHoldingsCount((response?.data?.holdings || []).length);
      } catch (error: any) {
        // Summary stays null; the skeleton below just keeps showing.
      } finally {
        setIsLoadingSummary(false);
      }
    };

    fetchUserName();
    fetchSummary();
  }, []);

  const totalInvested = Number(summary?.totalInvested ?? 0);
  const totalPnl = Number(summary?.totalPnl ?? 0);
  const returnsPercent = totalInvested > 0 ? (totalPnl / totalInvested) * 100 : 0;
  const isPnlPositive = totalPnl >= 0;
  const netWorth = Number(summary?.netWorth ?? 0);
  const holdingsValue = Number(summary?.totalCurrentValue ?? 0);
  const cashValue = Number(summary?.walletBalance ?? 0);
  const holdingsPercent = netWorth > 0 ? (holdingsValue / netWorth) * 100 : 0;
  const cashPercent = netWorth > 0 ? (cashValue / netWorth) * 100 : 0;

  const StatSkeleton = () => (
    <span className={`inline-block h-6 md:h-8 w-20 rounded animate-pulse ${darkMode ? 'bg-gray-700' : 'bg-gray-300'}`} />
  );
  const HeroSkeleton = () => (
    <span className={`inline-block h-8 md:h-10 w-40 rounded animate-pulse ${darkMode ? 'bg-gray-700' : 'bg-gray-300'}`} />
  );

  return (
    <div className={`flex flex-col md:flex-row md:items-start w-10/12 md:w-10/12 rounded-2xl h-auto font-pop mx-7 md:mx-auto ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-black'} transition-colors duration-300`}>
      {/* Portfolio Section */}
      <div className="flex flex-col w-full md:w-3/5 m-6 ml-0 md:m-14 ">
        <div className="flex flex-col items-start">
          <div className="flex flex-col items-start mb-2 md:mt-0">
            <div className="text-2xl md:text-4xl font-semibold mt-5 flex items-center gap-2">
              Welcome{" "}
              {isLoadingUserName ? (
                <span className={`inline-block h-8 md:h-10 w-32 rounded animate-pulse ${darkMode ? 'bg-gray-700' : 'bg-gray-300'}`} />
              ) : (
                <span className="text-blue-500">{userName}!</span>
              )}
            </div>
            <div className="h-2 w-44 bg-blue-500 rounded-full animate-line"></div>
            <div className=" text-lg mt-10 font-semibold">Today's Quote</div>
            <div className="h-1 w-20 bg-blue-500 rounded-full animate-line" style={{ animationDelay: '0.15s' }}></div>
            <div className="text-sm md:text-base mt-2 mb-5">
              <p>"{dailyQuote.quote}"</p>
              <p className="mt-2 text-sm md:text-sm text-right">- {dailyQuote.author}</p>
            </div>
          </div>
        </div>

        <div className="text-lg md:text-xl font-semibold mb-1">My Portfolio</div>
        <div className="h-2 w-20 bg-blue-500 rounded-full mb-6 animate-line" style={{ animationDelay: '0.3s' }}></div>
        <div className={`w-full rounded-3xl p-5 md:p-6 ${darkMode ? 'bg-gray-900 text-white' : 'bg-grey text-black'} transition-colors duration-300`}>
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`w-6 h-6 flex items-center justify-center rounded-full text-sm font-bold ${
                darkMode ? "bg-blue-500/20 text-blue-400" : "bg-blue-100 text-blue-700"
              }`}
            >
              ₹
            </span>
            <span className="text-xs uppercase tracking-widest text-gray-400">Net Worth</span>
          </div>
          <div className="flex flex-wrap items-baseline gap-3 mb-5">
            <span className="text-2xl md:text-3xl font-bold tabular-nums">
              {isLoadingSummary ? <HeroSkeleton /> : formatInr(summary?.netWorth)}
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

          <div className={`flex flex-wrap gap-x-8 gap-y-4 pt-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-300'}`}>
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
                {isLoadingSummary ? <StatSkeleton /> : holdingsCount}
              </div>
            </div>
          </div>

          {/* Allocation: real cash-vs-holdings split */}
          {!isLoadingSummary && netWorth > 0 && (
            <div className={`mt-5 pt-5 border-t ${darkMode ? 'border-gray-700' : 'border-gray-300'}`}>
              <div className="text-xs uppercase tracking-wide text-gray-400 mb-2">Allocation</div>
              <div className="w-full h-3 rounded-full overflow-hidden flex">
                <div className="bg-blue-500" style={{ width: `${holdingsPercent}%` }} title={`Holdings: ${holdingsPercent.toFixed(1)}%`} />
                <div className={darkMode ? "bg-gray-600" : "bg-gray-300"} style={{ width: `${cashPercent}%` }} title={`Cash: ${cashPercent.toFixed(1)}%`} />
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  Holdings · {holdingsPercent.toFixed(1)}%
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <span className={`w-2 h-2 rounded-full ${darkMode ? "bg-gray-600" : "bg-gray-300"}`} />
                  Cash · {cashPercent.toFixed(1)}%
                </div>
              </div>
            </div>
          )}
        </div>
        {!isLoadingSummary && holdingsCount === 0 && (
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
        <div className="text-lg md:text-xl font-semibold mb-1">Today's Market</div>
        <div className="h-2 w-20 bg-blue-500 rounded-full mb-6 animate-line" style={{ animationDelay: '0.45s' }}></div>
        <div className={`w-full h-auto rounded-3xl p-5 flex flex-col items-center mt-0 ${darkMode ? 'bg-gray-900 text-white' : 'bg-grey text-black'} transition-colors duration-300`}>
          <div className={`flex w-full mb-4 p-1 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-gray-200'}`}>
            <button
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 active:scale-95 ${
                selectedMarket === 'gainers'
                  ? 'bg-green-500 text-white shadow'
                  : darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-black'
              }`}
              onClick={() => handleToggle('gainers')}
            >
              Top Gainers
            </button>
            <button
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 active:scale-95 ${
                selectedMarket === 'losers'
                  ? 'bg-red-500 text-white shadow'
                  : darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-black'
              }`}
              onClick={() => handleToggle('losers')}
            >
              Top Losers
            </button>
          </div>

          {/* Market Content */}
          <div className="w-full h-full text-center text-sm">
            {selectedMarket === 'gainers' ? <TopGainers darkMode={darkMode} /> : <TopLosers darkMode={darkMode} />}
            <Link href="/market" className="text-sm md:text-sm text-blue-500 hover:underline">See More &gt;</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MainContent;
