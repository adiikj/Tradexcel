"use client";
import React from "react";
import ShortStock from "../dashboard/Stocks";

// Purely presentational - Market.tsx owns the single data fetch and passes the result down as filteredStocks.
function AllStocks({ onSelectStock, darkMode, filteredStocks, isLoading }: any) {
  const stocksToDisplay = filteredStocks || [];

  return (
    <div>
      {isLoading ? (
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
            <div key={index} className="cursor-pointer [&>div]:mb-0 [&>div]:h-full" onClick={() => onSelectStock(stock)}>
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
