"use client";
import React, { useEffect, useState } from "react";
import ShortStock from "../dashboard/Stocks"; // Your Stock component that handles chart rendering
import { getStockData } from "../../api/api";
import stockList from "./StockData.json";

function AllStocks({ setSelectedStock, darkMode, filteredStocks  }: any) {
  const [allstocks, setAllStocks] = useState<any>([]);
  const [loading, setLoading] = useState<any>(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      const updatedStocks = await Promise.all(
        stockList.map(async (stock) => {
          const data = await getStockData(stock.symbol);

          // Use fallback values if data fetching fails
          const stockData = data || {
            currentPrice: 1000,
            percentageChange: "N/A", 
            todayChange: "N/A", 
            stockPrices: Array(30).fill(1000),
          };

          return {
            ...stock,
            price: ` ${stockData.currentPrice.toFixed(2)}`,
            percentageChange: `${stockData.percentageChange || 0}%`, // Format as percentage
            todayChange: `${stockData.todayChange || 0}`, // Format as ₹ with 2 decimal places
            stockPrices: stockData.stockPrices,
            labels: Array.from({ length: 30 }, (_, i) => `Day ${i + 1}`),
          };
        })
      );

      setAllStocks(updatedStocks); // Set the updated stock data
      setLoading(false);
    };

    fetchData();
  }, []);

  const stocksToDisplay = filteredStocks || allstocks;

  return (
    <div>
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className={`h-24 rounded-lg animate-pulse ${darkMode ? 'bg-gray-800' : 'bg-white'}`} />
          ))}
        </div>
      ) : stocksToDisplay.length === 0 ? (
        <p className={`text-center py-10 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          No stocks match your search.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {stocksToDisplay.map((stock, index) => (
            <div key={index} className="cursor-pointer [&>div]:mb-0 [&>div]:h-full" onClick={() => setSelectedStock(stock)}>
              <ShortStock
                shortName={stock.shortName}
                fullName={stock.fullName}
                price={stock.price}
                stockPrices={stock.stockPrices}
                percentageChange={stock.percentageChange}
                todayChange={stock.todayChange}
                labels={stock.labels}
                darkMode={darkMode}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AllStocks;
