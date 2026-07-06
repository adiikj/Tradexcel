"use client";
import React, { useEffect, useState } from "react";
import Stock from "./Stocks"; // Your Stock component that handles chart rendering
import { getStockData } from "../../api/api";
import stockUniverse from "../market/StockData.json";
import { rankMovers } from "./marketMovers";

function TopGainers({ darkMode  }: any) {
  const [gainers, setGainers] = useState<any>([]);
  const [loading, setLoading] = useState<any>(true);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      setLoading(true);

      try {
        const topGainers = await rankMovers(stockUniverse, getStockData, "gainers");
        if (!cancelled) setGainers(topGainers);
      } catch (error) {
        console.error("Error fetching gainers:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <div className="text-lg font-medium mb-4">Today's Gainers</div>
      {loading ? (
        <div className="space-y-2 md:space-y-4">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className={`h-14 rounded-lg animate-pulse ${darkMode ? 'bg-gray-800' : 'bg-gray-200'}`} />
          ))}
        </div>
      ) : (
        gainers.map((stock, index) => (
          <Stock
            key={index}
            shortName={stock.shortName}
            fullName={stock.fullName}
            price={stock.price}
            percentageChange={stock.percentageChange}
            todayChange={stock.todayChange}
            stockPrices={stock.stockPrices}
            labels={stock.labels}
            darkMode={darkMode}
          />
        ))
      )}
    </div>
  );
}

export default TopGainers;
