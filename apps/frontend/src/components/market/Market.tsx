"use client";
import React, { useState, useEffect, useContext, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Header from "../dashboard/Header";
import Vheader from "../dashboard/Vheader";
import Stock from "../market/Stocks";
import ThemeContext from "../../context/ThemeContext";
import { getBatchStockData, getWallet, getPortfolio } from "../../api/api";
import AllStocks from "./AllStocks";
import stockList from "./StockData.json";
import { Helmet } from 'react-helmet';
import TradeModal from "../trade/TradeModal";
import { formatInr } from "../../utils/format";
import { useLiveQuotes } from "../../hooks/useLiveQuotes";
import { useMarketStatus } from "../../hooks/useMarketStatus";
import { tickToStockFields } from "../../utils/liveQuote";
import LiveStatusBadge from "../layout/LiveStatusBadge";
import MarketClosedBanner from "../layout/MarketClosedBanner";

function Market() {
  const { darkMode, toggleDarkMode } = useContext(ThemeContext);
  const searchParams = useSearchParams();
  const [balance, setBalance] = useState(0);
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);
  const [holdings, setHoldings] = useState<Record<string, number>>({});
  const [selectedStock, setSelectedStock] = useState<any>(null);
  const [stocks, setStocks] = useState<any>([]);
  const [isLoadingStocks, setIsLoadingStocks] = useState(true);
  const [searchQuery, setSearchQuery] = useState<any>(""); // Track the search query
  const [filterMode, setFilterMode] = useState<"all" | "gainers" | "losers" | "holdings">("all");
  const [tradeModal, setTradeModal] = useState<{ side: "BUY" | "SELL" } | null>(null);

  const refreshAccountState = useCallback(async () => {
    try {
      setIsLoadingBalance(true);
      const [walletResponse, portfolioResponse] = await Promise.all([getWallet(), getPortfolio()]);
      setBalance(Number(walletResponse?.data?.balance ?? 0));
      const holdingsMap: Record<string, number> = {};
      for (const holding of portfolioResponse?.data?.holdings || []) {
        holdingsMap[holding.symbol] = holding.quantity;
      }
      setHoldings(holdingsMap);
    } catch (err) {
      // Wallet/portfolio failed to load; balance stays at its last known value.
    } finally {
      setIsLoadingBalance(false);
    }
  }, []);

  useEffect(() => {
    refreshAccountState();
  }, [refreshAccountState]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingStocks(true);

      try {
        // One request for every symbol on the page instead of one-per-stock.
        const batch = await getBatchStockData(stockList.map((stock) => stock.symbol));

        const updatedStocks = stockList.map((stock) => {
          const stockData = batch[stock.symbol] || {
            currentPrice: 1000,
            percentageChange: "N/A",
            todayChange: "N/A",
            stockPrices: Array(30).fill(1000),
            dates: null,
          };

          return {
            ...stock,
            rawPrice: stockData.currentPrice,
            price: `₹ ${stockData.currentPrice.toFixed(2)}`,
            percentageChange: `${stockData.percentageChange || 0}%`, // Format as percentage
            todayChange: `${stockData.todayChange || 0}`, // Format as ₹ with 2 decimal places
            stockPrices: stockData.stockPrices,
            labels: stockData.dates || Array.from({ length: 30 }, (_, i) => `Day ${i + 1}`),
          };
        });

        setStocks(updatedStocks);
      } catch (error) {
        setStocks([]);
      } finally {
        setIsLoadingStocks(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const symbol = searchParams.get("symbol");
    if (!symbol || stocks.length === 0) return;
    const match = stocks.find((stock) => stock.symbol === symbol);
    if (match) setSelectedStock(match);
  }, [searchParams, stocks]);

  const { quotes: liveQuotes, connected: liveConnected } = useLiveQuotes(
    stocks.map((stock: any) => stock.symbol)
  );
  const marketStatus = useMarketStatus();

  const withLiveQuote = useCallback(
    (stock: any) => {
      const tick = liveQuotes[stock.symbol];
      if (!tick) return stock;
      const fields = tickToStockFields(tick);
      return {
        ...stock,
        rawPrice: fields.currentPrice,
        price: `₹ ${fields.currentPrice.toFixed(2)}`,
        percentageChange: `${fields.percentageChange}%`,
        todayChange: fields.todayChange,
      };
    },
    [liveQuotes]
  );

  const filteredStocks = stocks
    .map(withLiveQuote)
    .filter((stock) =>
      stock.shortName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stock.fullName.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .filter((stock) => {
      if (filterMode === "gainers") return parseFloat(stock.todayChange) >= 0;
      if (filterMode === "losers") return parseFloat(stock.todayChange) < 0;
      if (filterMode === "holdings") return Boolean(holdings[stock.symbol]);
      return true;
    });

  const displayedSelectedStock = selectedStock ? withLiveQuote(selectedStock) : null;
  const ownedQuantity = selectedStock ? holdings[selectedStock.symbol] || 0 : 0;

  return (
    <>
    <Helmet>
      <title>Market</title>
    </Helmet>
    <div
      className={`${
        darkMode ? "bg-gray-800 text-white" : "bg-white text-black"
      } min-h-screen transition-colors duration-300 font-pop`}
    >
      <Header darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
      <div className="flex flex-col md:flex-row">
        <Vheader darkMode={darkMode} />
        <div className="p-6 flex-1 mx-0 mb-20 md:mb-0 m-2 lg:m-10">
            <h1 className="text-2xl md:text-3xl font-bold">Market</h1>
          <div className="h-2 w-28 bg-blue-500 rounded-full mb-6 animate-line"></div>
          <MarketClosedBanner darkMode={darkMode} />
          <div className="flex justify-between items-center mt-6">
          <p className="mb-4 text-base md:text-xl tabular-nums flex items-center gap-3">
            <span className="flex items-center gap-2">
              Cash:{" "}
              {isLoadingBalance ? (
                <span className={`inline-block h-5 w-24 rounded animate-pulse ${darkMode ? 'bg-gray-700' : 'bg-gray-300'}`} />
              ) : (
                formatInr(balance)
              )}
            </span>
            <LiveStatusBadge connected={liveConnected} marketOpen={marketStatus.open} />
          </p>
          {selectedStock && (
              <button
                onClick={() => setSelectedStock(null)}
                className="px-4 py-2 text-xs md:text-base bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors duration-200 active:scale-95"
              >
                Back to Stocks
              </button>
            )}
          </div>

          {displayedSelectedStock ? (
            <div className="mb-6">
              <Stock
                shortName={displayedSelectedStock.shortName}
                fullName={displayedSelectedStock.fullName}
                price={displayedSelectedStock.price}
                stockPrices={displayedSelectedStock.stockPrices}
                percentageChange={displayedSelectedStock.percentageChange}
                todayChange={displayedSelectedStock.todayChange}
                labels={displayedSelectedStock.labels}
                darkMode={darkMode}
                ownedQuantity={ownedQuantity}
                onBuy={() => setTradeModal({ side: "BUY" })}
                onSell={() => setTradeModal({ side: "SELL" })}
              />
            </div>
          ) : (
            <div
              className={`${
                darkMode ? "bg-gray-900" : "bg-gray-100"
              } w-full p-5 lg:p-8 rounded-xl transition-colors duration-300`}
            >
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`${
                  darkMode ? "bg-gray-700 text-white" : "bg-white text-black"
                } w-full md:max-w-md mb-4 p-2 border-2 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                placeholder="Search for a stock..."
              />

              <div className="flex flex-wrap gap-2 mb-6">
                {(
                  [
                    { key: "all", label: "All" },
                    { key: "gainers", label: "Gainers" },
                    { key: "losers", label: "Losers" },
                    { key: "holdings", label: "My Holdings" },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setFilterMode(tab.key)}
                    className={`px-4 py-1.5 text-xs md:text-sm rounded-full transition-colors duration-200 active:scale-95 ${
                      filterMode === tab.key
                        ? tab.key === "gainers"
                          ? "bg-green-500 text-white"
                          : tab.key === "losers"
                          ? "bg-red-500 text-white"
                          : "bg-blue-500 text-white"
                        : darkMode
                        ? "bg-gray-700 text-white hover:bg-gray-600"
                        : "bg-gray-200 text-black hover:bg-gray-300"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div
                className="overflow-y-auto scrollable-area"
                style={{ maxHeight: "640px" }} // Set max-height for the scrollable area
              >
                <AllStocks
                  setSelectedStock={setSelectedStock}
                  darkMode={darkMode}
                  filteredStocks={filteredStocks}
                  isLoading={isLoadingStocks}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    {tradeModal && displayedSelectedStock && (
      <TradeModal
        symbol={displayedSelectedStock.symbol}
        fullName={displayedSelectedStock.fullName}
        side={tradeModal.side}
        initialPrice={displayedSelectedStock.rawPrice}
        availableCash={balance}
        availableQty={ownedQuantity}
        darkMode={darkMode}
        onClose={() => setTradeModal(null)}
        onSuccess={refreshAccountState}
      />
    )}
    </>
  );
}

export default Market;
