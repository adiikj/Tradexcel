"use client";
import React, { useEffect, useState } from 'react';
import Stock from './Stocks'; // Your Stock component that handles chart rendering
import { getStockData } from '../../api/api';
import stockUniverse from "../market/StockData.json";
import { rankMovers } from "./marketMovers";

function TopLosers({ darkMode  }: any) {
  const [losers, setLosers] = useState<any>([]);
  const [loading, setLoading] = useState<any>(true);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      setLoading(true);

      try {
        const topLosers = await rankMovers(stockUniverse, getStockData, "losers");
        if (!cancelled) setLosers(topLosers);
      } catch (error) {
        console.error("Error fetching losers:", error);
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
      <div className="text-lg font-medium mb-4">Today's Losers</div>
      {loading ? (
        <div className="space-y-2 md:space-y-4">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className={`h-14 rounded-lg animate-pulse ${darkMode ? 'bg-gray-800' : 'bg-gray-200'}`} />
          ))}
        </div>
      ) : (
        losers.map((stock, index) => (
          <Stock
            key={index}
            shortName={stock.shortName}
            fullName={stock.fullName}
            price={stock.price}
            stockPrices={stock.stockPrices}
            percentageChange={stock.percentageChange}
            todayChange={stock.todayChange}
            labels={stock.labels} // Pass labels here for chart X-axis
            darkMode={darkMode}
          />
        ))
      )}
    </div>
  );
}

export default TopLosers;
