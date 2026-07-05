"use client";
import React, { useCallback, useContext, useEffect, useState } from 'react';
import Header from '../dashboard/Header';
import Vheader from '../dashboard/Vheader';
import ThemeContext from "../../context/ThemeContext";
import { Helmet } from 'react-helmet';
import { getPortfolio } from '../../api/api';
import TradeModal from '../trade/TradeModal';

const formatInr = (value: number) =>
  `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function Portfolio() {
  const { darkMode, toggleDarkMode } = useContext(ThemeContext);

  const [holdings, setHoldings] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [sellTarget, setSellTarget] = useState<any>(null);

  const fetchPortfolio = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await getPortfolio();
      setHoldings(response?.data?.holdings || []);
      setSummary(response?.data?.summary || null);
    } catch (err: any) {
      setError(err.message || 'Failed to load portfolio.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPortfolio();
  }, [fetchPortfolio]);

  return (
    <>
      <Helmet>
        <title>Portfolio</title>
      </Helmet>
      <div className={`${darkMode ? "bg-gray-800 text-white" : "bg-white text-black"} font-pop mb-16 md:mb-0  transition-all duration-300`}>
        <Header darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
        <div className="flex">
          <Vheader darkMode={darkMode} />
          <main className="flex-1 p-6 m-0 md:m-10">
            <h1 className="text-3xl md:text-4xl font-bold">Your Portfolio</h1>
            <div className="h-2 w-44 bg-blue-500 rounded-full mb-6"></div>

            {error && (
              <p className="text-red-500 mb-4">{error}</p>
            )}

            {isLoading ? (
              <p className="text-gray-400">Loading portfolio...</p>
            ) : (
              <>
                {/* Portfolio Summary Section */}
                <section className={`p-6 rounded-lg w-full shadow-lg ${darkMode ? "bg-gray-900" : "bg-gray-50"} transition-all duration-300`}>
                  <h2 className="text-xl md:text-2xl font-semibold mb-6">Portfolio Overview</h2>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div
                      className={`p-3 md:p-5 rounded-lg border-2 ${
                        darkMode ? "border-blue-500 bg-gray-700" : "border-blue-300 bg-white"
                      } shadow-lg hover:scale-105 transform transition-all duration-300`}
                    >
                      <h3 className="text-md md:text-lg font-medium mb-2">Net Worth</h3>
                      <p className="text-2xl md:text-3xl font-bold">{formatInr(Number(summary?.netWorth ?? 0))}</p>
                    </div>
                    <div
                      className={`p-3 md:p-5 rounded-lg border-2 ${
                        darkMode ? "border-blue-500 bg-gray-700" : "border-blue-300 bg-white"
                      } shadow-lg hover:scale-105 transform transition-all duration-300`}
                    >
                      <h3 className="text-md md:text-lg font-medium mb-2">Invested Amount</h3>
                      <p className="text-2xl md:text-3xl font-bold">{formatInr(Number(summary?.totalInvested ?? 0))}</p>
                    </div>
                    <div
                      className={`p-3 md:p-5 rounded-lg border-2 ${
                        darkMode ? "border-blue-500 bg-gray-700" : "border-blue-300 bg-white"
                      } shadow-lg hover:scale-105 transform transition-all duration-300`}
                    >
                      <h3 className="text-md md:text-lg font-medium mb-2">Cash Balance</h3>
                      <p className="text-2xl md:text-3xl font-bold ">{formatInr(Number(summary?.walletBalance ?? 0))}</p>
                    </div>
                    <div
                      className={`p-3 md:p-5 rounded-lg border-2 ${
                        darkMode ? "border-blue-500 bg-gray-700" : "border-blue-300 bg-white"
                      } shadow-lg hover:scale-105 transform transition-all duration-300`}
                    >
                      <h3 className="text-md md:text-lg font-medium mb-2">Total P&amp;L</h3>
                      <p className={`text-2xl md:text-3xl font-bold ${Number(summary?.totalPnl ?? 0) >= 0 ? "text-green-500" : "text-red-500"}`}>
                        {Number(summary?.totalPnl ?? 0) >= 0 ? "+" : ""}{formatInr(Number(summary?.totalPnl ?? 0))}
                      </p>
                    </div>
                  </div>
                </section>

                {/* Stock Holdings Section */}
                <section className={`mt-8 w-full p-6 rounded-lg shadow-lg ${darkMode ? "bg-gray-900" : "bg-gray-50"} transition-all duration-300`}>
                  <h2 className="text-xl md:text-2xl font-semibold mb-6">Stock Holdings</h2>
                  {holdings.length === 0 ? (
                    <p className="text-gray-400">No holdings yet — head to Market to make your first trade.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-gray-300 dark:border-gray-700">
                            <th className="py-3 px-4 text-sm md:text-lg font-medium">Symbol</th>
                            <th className="py-3 px-4 text-sm md:text-lg font-medium">Qty</th>
                            <th className="py-3 px-4 text-sm md:text-lg font-medium">Avg Cost</th>
                            <th className="py-3 px-4 text-sm md:text-lg font-medium">Current Price</th>
                            <th className="py-3 px-4 text-sm md:text-lg font-medium">Current Value</th>
                            <th className="py-3 px-4 text-sm md:text-lg font-medium">P&amp;L</th>
                            <th className="py-3 px-4 text-sm md:text-lg font-medium"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {holdings.map((holding) => {
                            const pnl = holding.unrealizedPnl !== null ? Number(holding.unrealizedPnl) : null;
                            const pnlPercent = holding.unrealizedPnlPercent !== null ? Number(holding.unrealizedPnlPercent) : null;
                            const pnlPositive = pnl !== null && pnl >= 0;
                            return (
                              <tr
                                key={holding.id}
                                className={`border-b ${
                                  darkMode ? "dark:border-gray-700 hover:bg-gray-700" : "border-gray-200 hover:bg-gray-100"
                                } `}
                              >
                                <td className="py-3 px-4 text-xs md:text-lg font-medium">
                                  {holding.symbol}
                                  {holding.priceStale && (
                                    <span className="ml-2 text-xs text-yellow-500">(stale price)</span>
                                  )}
                                </td>
                                <td className="py-3 px-4 text-xs md:text-lg">{holding.quantity}</td>
                                <td className="py-3 px-4 text-xs md:text-lg">{formatInr(Number(holding.avgBuyPrice))}</td>
                                <td className="py-3 px-4 text-xs md:text-lg">
                                  {holding.currentPrice !== null ? formatInr(Number(holding.currentPrice)) : '—'}
                                </td>
                                <td className="py-3 px-4 text-xs md:text-lg">
                                  {holding.currentValue !== null ? formatInr(Number(holding.currentValue)) : '—'}
                                </td>
                                <td className={`py-3 px-4 text-xs md:text-lg font-semibold ${pnl === null ? "" : pnlPositive ? "text-green-500" : "text-red-500"}`}>
                                  {pnl === null
                                    ? '—'
                                    : `${pnlPositive ? '+' : ''}${formatInr(pnl)} (${pnlPositive ? '+' : ''}${pnlPercent?.toFixed(2)}%)`}
                                </td>
                                <td className="py-3 px-4 text-xs md:text-lg">
                                  <button
                                    onClick={() => setSellTarget(holding)}
                                    className={`px-4 py-1.5 rounded text-white text-xs md:text-sm ${darkMode ? "bg-red-600 hover:bg-red-500" : "bg-red-500 hover:bg-red-400"}`}
                                  >
                                    Sell
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              </>
            )}
          </main>
        </div>
      </div>
      {sellTarget && (
        <TradeModal
          symbol={sellTarget.symbol}
          side="SELL"
          initialPrice={Number(sellTarget.currentPrice ?? sellTarget.avgBuyPrice)}
          availableQty={sellTarget.quantity}
          darkMode={darkMode}
          onClose={() => setSellTarget(null)}
          onSuccess={fetchPortfolio}
        />
      )}
    </>
  );
}

export default Portfolio;
