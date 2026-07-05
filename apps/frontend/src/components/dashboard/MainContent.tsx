"use client";
import React, { useState, useEffect } from 'react';
import TopGainers from './TopGainers';
import TopLosers from './TopLosers';
import rupee from '../../assets/rupee.png';
import { getUserName, getPortfolio } from '../../api/api';
import Link from "next/link";
import quotes from './Quote.json';
import { formatInr, formatPercent } from '../../utils/format';

function MainContent({ darkMode  }: any) {
  const [selectedMarket, setSelectedMarket] = useState<any>('gainers'); // State to track the selected market
  const [userName, setUserName] = useState<any>(''); // State to store user's name
  const [dailyQuote, setDailyQuote] = useState<any>('');
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

        const name = await getUserName(); // Fetch user profile from API

        // Assuming the API returns { data: { name: "User Name" } }
        setUserName(name.data.name);
      } catch (error) {
        console.error("Failed to fetch user name:", error.message);
        setUserName('User'); // Fallback to 'User' if there's an error
      }
    };

    const fetchSummary = async () => {
      try {
        setIsLoadingSummary(true);
        const response = await getPortfolio();
        setSummary(response?.data?.summary || null);
        setHoldingsCount((response?.data?.holdings || []).length);
      } catch (error: any) {
        console.error("Failed to fetch portfolio summary:", error.message);
      } finally {
        setIsLoadingSummary(false);
      }
    };

    fetchUserName(); // Fetch user profile when component mounts
    fetchSummary();

    const todayQuote = quotes[new Date().getDate() % quotes.length];
    setDailyQuote(todayQuote);
  }, []); // Empty dependency array to run only once on mount

  const totalInvested = Number(summary?.totalInvested ?? 0);
  const totalPnl = Number(summary?.totalPnl ?? 0);
  const returnsPercent = totalInvested > 0 ? (totalPnl / totalInvested) * 100 : 0;

  // Same footprint as the real figure so nothing shifts once it loads —
  // just reads as "loading" instead of a flash of literal "...".
  const StatSkeleton = () => (
    <span className={`inline-block h-6 md:h-8 w-20 rounded animate-pulse ${darkMode ? 'bg-gray-700' : 'bg-gray-300'}`} />
  );

  return (
    <div className={`flex flex-col md:flex-row w-10/12 md:w-10/12 rounded-2xl h-auto font-pop mx-7 md:mx-auto ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-black'} transition-colors duration-300`}>
      {/* Portfolio Section */}
      <div className="flex flex-col w-full md:w-3/5 m-6 ml-0 md:m-14 ">
        <div className="flex flex-col items-start">
          <div className="flex flex-col items-start mb-2 md:mt-0">
            <div className="text-2xl md:text-4xl font-semibold mt-5">
              Welcome <span className="text-blue-500">{userName || 'User'}!</span>
            </div>
            <div className="h-2 w-44 bg-blue-500 rounded-full animate-line"></div> {/* Blue Div below name */}
            <div className=" text-lg mt-10 font-semibold">Today's Quote</div>
            <div className="h-1 w-20 bg-blue-500 rounded-full animate-line" style={{ animationDelay: '0.15s' }}></div>
            <div className="text-sm md:text-base mt-2 mb-5">
            {dailyQuote ? (
                <>
                  <p>"{dailyQuote.quote}"</p>
                  <p className="mt-2 text-sm md:text-sm text-right">- {dailyQuote.author}</p>
                </>
              ) : (
                <p>Loading quote...</p>
              )}
            </div>
          </div>
        </div>

        <div className="text-lg md:text-xl font-semibold mb-1">My Portfolio</div>
        <div className="h-2 w-20 bg-blue-500 rounded-full mb-6 animate-line" style={{ animationDelay: '0.3s' }}></div>
        <div className={`w-full h-60 md:h-72 rounded-3xl relative ${darkMode ? 'bg-gray-900 text-white' : 'bg-grey text-black'} transition-colors duration-300`}>
          <div className="font-pop absolute top-0 left-0 p-5">
            <div className=" p-2 relative">
              <div className="text-sm md:text-base font-normal">Portfolio Value</div>
              <div className="text-xl md:text-2xl font-semibold tabular-nums">
                {isLoadingSummary ? <StatSkeleton /> : formatInr(summary?.netWorth)}
              </div>
              {/* Rupee Icon */}
              <img
                src={((rupee)?.src || (rupee)) as string}
                alt="Rupee"
                className="absolute w-9/12 h-9/12 md:w-10/12 md:h-10/12 opacity-30 -left-8 md:-left-10 -right-1 top-12 md:top-16  transform"
              />
            </div>
          </div>
          <div className="font-pop absolute top-0 right-0 p-5">
            <div className=" p-2">
              <div className="text-sm md:text-base">P&amp;L</div>
              <div className={`text-xl md:text-2xl font-semibold tabular-nums ${totalPnl >= 0 ? "text-green-600" : "text-red-500"}`}>
                {isLoadingSummary ? <StatSkeleton /> : formatPercent(returnsPercent)}
              </div>
            </div>
          </div>
          <div className="font-pop absolute bottom-0 left-0 p-5">
            <div className=" p-2">
              <div className="text-sm md:text-base">Balance</div>
              <div className="text-xl md:text-2xl font-semibold tabular-nums">
                {isLoadingSummary ? <StatSkeleton /> : formatInr(summary?.walletBalance)}
              </div>
            </div>
          </div>
          <div className="font-pop absolute bottom-0 right-0 p-5 text-right">
            <div className=" p-2">
              <div className="text-sm md:text-base">Holdings</div>
              <div className="text-xl md:text-2xl font-semibold tabular-nums">{isLoadingSummary ? <StatSkeleton /> : holdingsCount}</div>
            </div>
          </div>
        </div>
        {!isLoadingSummary && holdingsCount === 0 && (
          <p className="mt-3 text-sm text-gray-400">
            No holdings yet —{" "}
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
        <div className={`w-full h-full rounded-3xl p-5 flex flex-col items-center justify-center mt-0 ${darkMode ? 'bg-gray-900 text-white' : 'bg-grey text-black'} transition-colors duration-300`}>
          <div className="flex justify-center mb-4 space-x-4">
            <button
              className={`px-4 py-2 rounded-xl transition-colors duration-200 active:scale-95 ${
                selectedMarket === 'gainers' ? 'bg-green-500 text-white'
                : darkMode ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-gray-300 text-black hover:bg-gray-400'
              }`}
              onClick={() => handleToggle('gainers')}
            >
              Top Gainers
            </button>
            <button
              className={`px-5 py-2 rounded-xl transition-colors duration-200 active:scale-95 ${
                selectedMarket === 'losers' ? 'bg-red-500 text-white'
                : darkMode ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-gray-300 text-black hover:bg-gray-400'
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
