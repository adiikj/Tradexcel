"use client";
import React, { useCallback, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '../dashboard/Header';
import Vheader from '../dashboard/Vheader';
import { getPortfolio } from '../../api/api';
import TradeModal from '../trade/TradeModal';
import { formatInr, formatSignedInr, formatPercent } from '../../utils/format';
import { useLiveQuotes } from '../../hooks/useLiveQuotes';
import { useMarketStatus } from '../../hooks/useMarketStatus';
import LiveStatusBadge from '../layout/LiveStatusBadge';
import MarketClosedBanner from '../layout/MarketClosedBanner';
import { useAsyncEffect } from "../../hooks/useAsyncEffect";
import { onActivateKey } from "../../utils/a11y";
import { apiErrorMessage } from "../../api/http";
import type { PortfolioHolding, PortfolioSummary } from "@tradexcel/shared";

// Cycled across holdings for the allocation bar + row avatars; cash stays neutral gray.
const ALLOCATION_COLORS = [
  "bg-blue-500", "bg-purple-500", "bg-teal-500", "bg-amber-500",
  "bg-pink-500", "bg-indigo-500", "bg-cyan-500", "bg-rose-500",
];

function Portfolio() {
  const router = useRouter();

  const [holdings, setHoldings] = useState<PortfolioHolding[]>([]);
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [tradeModal, setTradeModal] = useState<{ symbol: string; side: "BUY" | "SELL"; initialPrice: number; availableQty: number } | null>(null);

  // State is only set after the first await, so effects can call this directly.
  const loadPortfolio = useCallback(async (isActive: () => boolean = () => true) => {
    try {
      const response = await getPortfolio();
      if (!isActive()) return;
      setHoldings(response?.data?.holdings || []);
      setSummary(response?.data?.summary || null);
    } catch (err) {
      if (!isActive()) return;
      setError(apiErrorMessage(err, 'Failed to load portfolio.'));
    } finally {
      if (isActive()) setIsLoading(false);
    }
  }, []);

  // For buttons/handlers: show the loading state, then load.
  const fetchPortfolio = useCallback(
    () => {
      setIsLoading(true);
      return loadPortfolio();
    },
    [loadPortfolio]
  );

  useAsyncEffect((isActive) => loadPortfolio(isActive), [loadPortfolio]);

  const openStockDetail = (symbol: string) => {
    router.push(`/market?symbol=${encodeURIComponent(symbol)}`);
  };

  const { quotes: liveQuotes, connected: liveConnected } = useLiveQuotes(
    holdings.map((h) => h.symbol)
  );
  const marketStatus = useMarketStatus();

  // Overlays a live tick onto a holding's derived fields using the same math
  // the backend uses in portfolio.controller.ts (currentValue = price * qty,
  // unrealizedPnl = currentValue - investedValue). Holdings with no tick yet
  // pass through untouched (still showing the values from the initial fetch).
  const liveHoldings = holdings.map((holding) => {
    const tick = liveQuotes[holding.symbol];
    if (!tick) return holding;

    const quantity = Number(holding.quantity);
    const investedValue = Number(holding.investedValue ?? Number(holding.avgBuyPrice) * quantity);
    const currentValue = tick.price * quantity;
    const unrealizedPnl = currentValue - investedValue;
    const unrealizedPnlPercent = investedValue > 0 ? (unrealizedPnl / investedValue) * 100 : null;

    return {
      ...holding,
      currentPrice: tick.price,
      currentValue,
      unrealizedPnl,
      unrealizedPnlPercent,
      priceStale: false,
    };
  });

  const walletBalance = Number(summary?.walletBalance ?? 0);
  const totalInvested = Number(summary?.totalInvested ?? 0);
  const totalCurrentValue = liveHoldings.reduce(
    (sum, h) => sum + Number(h.currentValue ?? h.investedValue ?? 0),
    0
  );
  const totalPnl = totalCurrentValue - totalInvested;
  const netWorth = walletBalance + totalCurrentValue;
  const isPnlPositive = totalPnl >= 0;

  const allocation = [
    ...liveHoldings.map((h, i) => ({
      label: h.symbol,
      value: Number(h.currentValue ?? Number(h.avgBuyPrice) * h.quantity),
      color: ALLOCATION_COLORS[i % ALLOCATION_COLORS.length],
    })),
    { label: "Cash", value: walletBalance, color: "bg-gray-300 dark:bg-gray-600" },
  ].filter((slice) => slice.value > 0);

  const cardBg = "bg-gray-50 dark:bg-gray-900";

  return (
    <>
      <div className={`bg-white text-black dark:bg-gray-800 dark:text-white font-pop mb-16 md:mb-0 transition-colors duration-300`}>
        <Header />
        <div className="flex">
          <Vheader />
          <main className="flex-1 min-w-0 p-6 m-0 md:m-10">
            <h1 className="text-2xl md:text-3xl font-bold">Your Portfolio</h1>
            <div className="h-2 w-44 bg-blue-500 rounded-full mb-6 animate-line"></div>
            <MarketClosedBanner />

            {error && (
              <div className="mb-4 flex items-center gap-3">
                <p className="text-red-500">{error}</p>
                <button onClick={fetchPortfolio} className="text-sm text-blue-500 underline">
                  Retry
                </button>
              </div>
            )}

            {isLoading ? (
              <div className="space-y-6">
                <div className={`h-40 rounded-2xl animate-pulse ${cardBg}`} />
                <div className={`h-24 rounded-2xl animate-pulse ${cardBg}`} />
              </div>
            ) : (
              <>
                {/* Net worth hero */}
                <section className={`p-6 md:p-8 rounded-2xl w-full shadow-lg ${cardBg} transition-colors duration-300`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs md:text-sm uppercase tracking-widest text-gray-400">Net Worth</span>
                    <LiveStatusBadge connected={liveConnected} marketOpen={marketStatus.open} />
                  </div>
                  <div className="flex flex-wrap items-baseline gap-3 mb-6">
                    <span className="text-2xl md:text-4xl font-bold tabular-nums">{formatInr(netWorth)}</span>
                    <span
                      className={`text-xs md:text-sm px-2.5 py-1 rounded-full font-semibold tabular-nums ${
                        isPnlPositive ? "bg-green-500/15 text-green-500" : "bg-red-500/15 text-red-500"
                      }`}
                    >
                      {formatSignedInr(totalPnl)}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-x-10 gap-y-4 pt-5 border-t border-gray-500/20">
                    <div>
                      <div className="text-xs uppercase tracking-wide text-gray-400 mb-1">Invested</div>
                      <div className="text-base font-semibold tabular-nums">{formatInr(summary?.totalInvested)}</div>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wide text-gray-400 mb-1">Cash</div>
                      <div className="text-base font-semibold tabular-nums">{formatInr(walletBalance)}</div>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wide text-gray-400 mb-1">Holdings</div>
                      <div className="text-base font-semibold tabular-nums">{holdings.length}</div>
                    </div>
                  </div>

                  {/* Allocation bar - real data (holding value vs cash), not decoration */}
                  {allocation.length > 0 && netWorth > 0 && (
                    <div className="mt-6 pt-5 border-t border-gray-500/20">
                      <div className="text-xs uppercase tracking-wide text-gray-400 mb-2">Allocation</div>
                      <div className="w-full h-3 rounded-full overflow-hidden flex">
                        {allocation.map((slice) => (
                          <div
                            key={slice.label}
                            className={slice.color}
                            style={{ width: `${(slice.value / netWorth) * 100}%` }}
                            title={`${slice.label}: ${((slice.value / netWorth) * 100).toFixed(1)}%`}
                          />
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
                        {allocation.map((slice) => (
                          <div key={slice.label} className="flex items-center gap-1.5 text-xs text-gray-400">
                            <span className={`w-2 h-2 rounded-full ${slice.color}`} />
                            {slice.label} · {((slice.value / netWorth) * 100).toFixed(1)}%
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </section>

                {/* Stock Holdings Section */}
                <section className={`mt-8 w-full p-6 rounded-2xl shadow-lg ${cardBg} transition-colors duration-300`}>
                  <h2 className="text-lg md:text-xl font-semibold mb-6">Stock Holdings</h2>
                  {holdings.length === 0 ? (
                    <div className="text-center py-10">
                      <p className="text-gray-400 mb-4">No holdings yet - make your first trade to see it here.</p>
                      <Link
                        href="/market"
                        className="inline-block px-6 py-2 rounded-md bg-blue-500 text-white hover:bg-blue-600 transition-colors duration-200"
                      >
                        Go to Market
                      </Link>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-gray-300 dark:border-gray-700">
                            <th className="py-3 px-4 text-sm md:text-base font-medium">Symbol</th>
                            <th className="py-3 px-4 text-sm md:text-base font-medium">Qty</th>
                            <th className="py-3 px-4 text-sm md:text-base font-medium">Avg Cost</th>
                            <th className="py-3 px-4 text-sm md:text-base font-medium">Current Price</th>
                            <th className="py-3 px-4 text-sm md:text-base font-medium">Current Value</th>
                            <th className="py-3 px-4 text-sm md:text-base font-medium">P&amp;L</th>
                            <th className="py-3 px-4 text-sm md:text-base font-medium"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {liveHoldings.map((holding, index) => {
                            const pnl = holding.unrealizedPnl !== null ? Number(holding.unrealizedPnl) : null;
                            const pnlPercent = holding.unrealizedPnlPercent !== null ? Number(holding.unrealizedPnlPercent) : null;
                            const pnlPositive = pnl !== null && pnl >= 0;
                            const accentColor = ALLOCATION_COLORS[index % ALLOCATION_COLORS.length];
                            return (
                              <tr
                                key={holding.id}
                                onClick={() => openStockDetail(holding.symbol)}
                                onKeyDown={onActivateKey(() => openStockDetail(holding.symbol))}
                                tabIndex={0}
                                aria-label={`View ${holding.symbol}`}
                                className={`border-b border-l-4 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                                  pnl === null
                                    ? "border-l-transparent"
                                    : pnlPositive
                                    ? "border-l-green-500"
                                    : "border-l-red-500"
                                } ${
                                  "border-gray-200 hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
                                } transition-colors duration-150`}
                              >
                                <td className="py-3 px-4 text-xs md:text-base font-medium">
                                  <div className="flex items-center gap-2">
                                    <span className={`w-6 h-6 rounded-full ${accentColor} text-white text-[10px] font-bold flex items-center justify-center shrink-0`}>
                                      {holding.symbol.slice(0, 1)}
                                    </span>
                                    {holding.symbol}
                                    {holding.priceStale && (
                                      <span className="text-xs text-yellow-500">(stale)</span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-3 px-4 text-xs md:text-base tabular-nums">{holding.quantity}</td>
                                <td className="py-3 px-4 text-xs md:text-base tabular-nums">{formatInr(holding.avgBuyPrice)}</td>
                                <td className="py-3 px-4 text-xs md:text-base tabular-nums">
                                  {holding.currentPrice !== null ? formatInr(holding.currentPrice) : '-'}
                                </td>
                                <td className="py-3 px-4 text-xs md:text-base tabular-nums">
                                  {holding.currentValue !== null ? formatInr(holding.currentValue) : '-'}
                                </td>
                                <td className={`py-3 px-4 text-xs md:text-base font-semibold tabular-nums ${pnl === null ? "" : pnlPositive ? "text-green-500" : "text-red-500"}`}>
                                  {pnl === null ? '-' : `${formatSignedInr(pnl)} (${formatPercent(pnlPercent)})`}
                                </td>
                                <td className="py-3 px-4 text-xs md:text-base">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setTradeModal({
                                        symbol: holding.symbol,
                                        side: "SELL",
                                        initialPrice: Number(holding.currentPrice ?? holding.avgBuyPrice),
                                        availableQty: holding.quantity,
                                      });
                                    }}
                                    className={`px-4 py-1.5 rounded text-white text-xs md:text-sm transition-colors duration-200 active:scale-95 bg-red-500 hover:bg-red-400 dark:bg-red-600 dark:hover:bg-red-500`}
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
