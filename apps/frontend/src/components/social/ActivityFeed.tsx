"use client";
import React, { useCallback, useContext, useEffect, useState } from "react";
import Link from "next/link";
import { Helmet } from "react-helmet";
import Header from "../dashboard/Header";
import Vheader from "../dashboard/Vheader";
import ThemeContext from "../../context/ThemeContext";
import { getActivityFeed } from "../../api/api";
import { formatInr, timeAgo } from "../../utils/format";

function ActivityItem({ item, darkMode }: { item: any; darkMode: boolean }) {
  const cardBg = darkMode ? "bg-gray-900" : "bg-gray-50";

  return (
    <div className={`rounded-xl p-4 flex gap-3 ${cardBg}`}>
      <Link href={`/u/${item.user.username}`}>
        <img src={item.user.avatar} alt="" className="w-10 h-10 rounded-full shrink-0" />
      </Link>
      <div className="min-w-0 flex-1">
        <p className="text-sm">
          <Link href={`/u/${item.user.username}`} className="font-semibold hover:underline">
            {item.user.name}
          </Link>{" "}
          {item.type === "trade" ? (
            <>
              {item.side === "BUY" ? "bought" : "sold"} <span className="font-semibold">{item.quantity}</span> share
              {item.quantity === 1 ? "" : "s"} of <span className="font-semibold">{item.symbol}</span> at{" "}
              {formatInr(item.price)}
            </>
          ) : (
            <>
              finished <span className="font-semibold">{item.contestName}</span>{" "}
              {item.finalRank === 1 ? "🏆 in 1st place" : `ranked #${item.finalRank}`}
            </>
          )}
        </p>
        <p className="text-xs text-gray-400 mt-1 tabular-nums">{timeAgo(item.timestamp)}</p>
      </div>
    </div>
  );
}

function ActivityFeed() {
  const { darkMode, toggleDarkMode } = useContext(ThemeContext);

  const [items, setItems] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchActivity = useCallback(async (nextPage: number) => {
    try {
      setIsLoading(true);
      setError("");
      const response = await getActivityFeed(nextPage, 20);
      const newItems = response?.data?.items || [];
      setItems((prev) => (nextPage === 1 ? newItems : [...prev, ...newItems]));
      setTotalPages(response?.data?.pagination?.totalPages || 1);
      setPage(nextPage);
    } catch (err: any) {
      setError(err.message || "Failed to load activity.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActivity(1);
  }, [fetchActivity]);

  return (
    <>
      <Helmet>
        <title>Activity</title>
      </Helmet>
      <div
        className={
          darkMode
            ? "bg-gray-800 text-white min-h-screen transition-colors duration-300 font-pop"
            : "bg-white text-black min-h-screen transition-colors duration-300 font-pop"
        }
      >
        <Header darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
        <div className="flex flex-col md:flex-row">
          <Vheader darkMode={darkMode} />
          <main className="flex-1 p-4 m-4 md:m-10 mb-20 md:mb-10 max-w-2xl mx-auto">
            <h1 className="text-2xl md:text-3xl font-bold">Activity</h1>
            <div className="h-2 w-32 bg-blue-500 rounded-full mb-6 animate-line"></div>

            {error && (
              <div className="mb-4 flex items-center gap-3">
                <p className="text-red-500">{error}</p>
                <button onClick={() => fetchActivity(1)} className="text-sm text-blue-500 underline">
                  Retry
                </button>
              </div>
            )}

            {isLoading && items.length === 0 ? (
              <div className="space-y-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className={`h-16 rounded-xl animate-pulse ${darkMode ? "bg-gray-900" : "bg-gray-50"}`} />
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-gray-400 mb-4">
                  Nothing here yet - follow other traders to see their trades and contest results.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item) => (
                  <ActivityItem key={`${item.type}-${item.id}`} item={item} darkMode={darkMode} />
                ))}
                {page < totalPages && (
                  <button
                    onClick={() => fetchActivity(page + 1)}
                    disabled={isLoading}
                    className="w-full py-2 text-sm text-blue-500 hover:underline disabled:opacity-60"
                  >
                    {isLoading ? "Loading..." : "Load more"}
                  </button>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </>
  );
}

export default ActivityFeed;
