"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Stock from "./Stocks"; // Your Stock component that handles chart rendering
import { getBatchStockData } from "../../api/api";
import stockUniverse from "../market/StockData.json";
import { rankFromData } from "./marketMovers";
import { useLiveQuotes } from "../../hooks/useLiveQuotes";
import { useMarketStatus } from "../../hooks/useMarketStatus";
import { tickToStockFields } from "../../utils/liveQuote";
import LiveStatusBadge from "../layout/LiveStatusBadge";

const allSymbols = [...new Set(stockUniverse.map((s) => s.symbol))];

function TopGainers({ darkMode }: any) {
  const router = useRouter();
  const [baseData, setBaseData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    getBatchStockData(allSymbols)
      .then((data) => {
        if (!cancelled) setBaseData(data || {});
      })
      .catch(() => {
        // Leave baseData empty; the UI already handles a zero-length list.
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const { quotes: liveQuotes, connected: liveConnected } = useLiveQuotes(allSymbols);
  const marketStatus = useMarketStatus();

  const gainers = useMemo(() => {
    const merged: Record<string, any> = {};
    for (const symbol of Object.keys(baseData)) {
      const base = baseData[symbol];
      const tick = liveQuotes[symbol];
      merged[symbol] = base && tick ? { ...base, ...tickToStockFields(tick) } : base;
    }
    return rankFromData(stockUniverse, merged, "gainers");
  }, [baseData, liveQuotes]);

  return (
    <div>
      <div className="flex justify-end mb-2">
        <LiveStatusBadge connected={liveConnected} marketOpen={marketStatus.open} />
      </div>
      {loading ? (
        <div className="space-y-2 md:space-y-4">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className={`h-14 rounded-lg animate-pulse ${darkMode ? 'bg-gray-800' : 'bg-gray-200'}`} />
          ))}
        </div>
      ) : gainers.length === 0 ? (
        <p className="text-sm text-gray-400 py-6 text-center">No gainers right now - the market's broadly down today.</p>
      ) : (
        gainers.map((stock, index) => (
          <div
            key={index}
            className="cursor-pointer"
            onClick={() => router.push(`/portfolio?symbol=${encodeURIComponent(stock.symbol)}`)}
          >
            <Stock
              shortName={stock.shortName}
              fullName={stock.fullName}
              price={stock.price}
              percentageChange={stock.percentageChange}
              todayChange={stock.todayChange}
              stockPrices={stock.stockPrices}
              labels={stock.labels}
              darkMode={darkMode}
            />
          </div>
        ))
      )}
    </div>
  );
}

export default TopGainers;
