"use client";
import React, { useCallback, useContext, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import Header from "../dashboard/Header";
import Vheader from "../dashboard/Vheader";
import ThemeContext from "../../context/ThemeContext";
import { Helmet } from "react-helmet";
import { getLeaderboard, getFriendsLeaderboard } from "../../api/api";
import { formatInr, formatPercent } from "../../utils/format";

const MEDALS = ["🥇", "🥈", "🥉"];
// Real podium order: 2nd, 1st, 3rd, with the #1 slot tallest.
const PODIUM_ORDER = [1, 0, 2];

function Leaderboard() {
  const { darkMode, toggleDarkMode } = useContext(ThemeContext);

  const [scope, setScope] = useState<"global" | "friends">("global");
  const [entries, setEntries] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [totalPlayers, setTotalPlayers] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchLeaderboard = useCallback(async (nextScope: "global" | "friends") => {
    try {
      setIsLoading(true);
      setError("");
      const response = nextScope === "global" ? await getLeaderboard(20) : await getFriendsLeaderboard(20);
      setEntries(response?.data?.leaderboard || []);
      setCurrentUser(response?.data?.currentUser || null);
      setTotalPlayers(response?.data?.totalPlayers || 0);
    } catch (err: any) {
      setError(err.message || "Failed to load leaderboard.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaderboard(scope);
  }, [fetchLeaderboard, scope]);

  const isCurrentUserVisible = entries.some((entry) => entry.userId === currentUser?.userId);
  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);
  const leaderNetWorth = entries[0]?.netWorth || 1;
  const cardBg = darkMode ? "bg-gray-900" : "bg-gray-50";

  return (
    <>
      <Helmet>
        <title>Leaderboard</title>
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
          <Vheader darkMode={darkMode} className="" />
          <main className="flex-1 p-4 m-4 md:m-10">
            <h1 className="text-2xl md:text-3xl font-bold">Leaderboard</h1>
            <div className="h-2 w-44 bg-blue-500 rounded-full mb-6 animate-line"></div>

            <div className="flex gap-2 mb-6">
              {(["global", "friends"] as const).map((option) => (
                <button
                  key={option}
                  onClick={() => setScope(option)}
                  className={`px-4 py-1.5 text-sm font-semibold rounded-full capitalize transition-colors ${
                    scope === option
                      ? "bg-blue-500 text-white"
                      : darkMode
                      ? "bg-gray-700 text-gray-300"
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  {option === "friends" ? "Following" : "Global"}
                </button>
              ))}
            </div>

            {error && (
              <div className="mb-4 flex items-center gap-3">
                <p className="text-red-500">{error}</p>
                <button onClick={() => fetchLeaderboard(scope)} className="text-sm text-blue-500 underline">
                  Retry
                </button>
              </div>
            )}

            {isLoading ? (
              <div className="space-y-6">
                <div className="flex justify-center gap-3">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className={`w-56 md:w-64 h-40 rounded-2xl animate-pulse ${cardBg}`} />
                  ))}
                </div>
                <div className={`h-64 rounded-2xl animate-pulse ${cardBg}`} />
              </div>
            ) : entries.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-gray-400 mb-4">
                  {scope === "friends"
                    ? "You're not following anyone yet - follow other traders to see them here."
                    : "No players yet - be the first to make a trade."}
                </p>
                <Link
                  href={scope === "friends" ? "/activity" : "/market"}
                  className="inline-block px-6 py-2 rounded-md bg-blue-500 text-white hover:bg-blue-600 transition-colors duration-200"
                >
                  {scope === "friends" ? "Go to Activity" : "Go to Market"}
                </Link>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-400 mb-6 tabular-nums">{totalPlayers} players ranked by net worth</p>

                {/* Top 3 podium - real podium order (2nd, 1st, 3rd), #1 tallest */}
                <div className="flex items-end justify-center gap-3 mb-10">
                  {PODIUM_ORDER.filter((i) => top3[i]).map((i) => {
                    const entry = top3[i];
                    const isMe = entry.userId === currentUser?.userId;
                    const isFirst = i === 0;
                    return (
                      <motion.div
                        key={entry.userId}
                        className={`w-28 sm:w-48 md:w-56 flex flex-col items-center rounded-2xl p-3 sm:p-4 ${
                          isFirst ? "pt-6 sm:pt-8" : "pt-3 sm:pt-4"
                        } ${isMe ? "ring-4 ring-blue-500" : ""} ${
                          isFirst
                            ? darkMode
                              ? "bg-gradient-to-b from-amber-900/40 to-gray-900 border border-amber-500/40"
                              : "bg-gradient-to-b from-amber-100 to-blue-50 border border-amber-300"
                            : darkMode
                            ? "bg-slate-900 text-white"
                            : "bg-blue-100 text-blue-700"
                        }`}
                        whileHover={{ scale: 1.03 }}
                      >
                        <span className={isFirst ? "text-3xl sm:text-4xl" : "text-xl sm:text-2xl"}>{MEDALS[i]}</span>
                        <Link href={`/u/${entry.username}`}>
                          <img
                            src={entry.avatar}
                            alt=""
                            className={`rounded-full my-2 ${isFirst ? "w-12 h-12 sm:w-14 sm:h-14" : "w-9 h-9 sm:w-10 sm:h-10"}`}
                          />
                        </Link>
                        <Link
                          href={`/u/${entry.username}`}
                          className="font-bold text-center text-xs sm:text-base truncate max-w-full hover:underline"
                        >
                          {entry.name}
                          {isMe && <span className="text-xs ml-1 text-blue-400">(You)</span>}
                        </Link>
                        <span className="tabular-nums font-semibold text-xs sm:text-sm mt-1">{formatInr(entry.netWorth)}</span>
                        <span className={`tabular-nums text-xs ${entry.totalPnlPercent >= 0 ? "text-green-500" : "text-red-500"}`}>
                          {formatPercent(entry.totalPnlPercent)}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Leaderboard Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse mb-6">
                    <thead className={darkMode ? "bg-gray-700" : "bg-gray-200"}>
                      <tr>
                        <th className="p-3 text-sm">Rank</th>
                        <th className="p-3 text-sm">Player</th>
                        <th className="p-3 text-sm">Net Worth</th>
                        <th className="p-3 text-sm">P&amp;L %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rest.map((entry) => {
                        const isMe = entry.userId === currentUser?.userId;
                        const relativeShare = Math.max(0, Math.min(100, (entry.netWorth / leaderNetWorth) * 100));
                        return (
                          <tr
                            key={entry.userId}
                            className={`border-b transition-colors duration-150 ${
                              isMe
                                ? darkMode
                                  ? "bg-blue-900"
                                  : "bg-blue-50"
                                : darkMode
                                ? "border-gray-700 hover:bg-gray-700"
                                : "border-gray-200 hover:bg-gray-100"
                            }`}
                          >
                            <td className="p-3 text-sm tabular-nums">{entry.rank}</td>
                            <td className="p-3">
                              <Link href={`/u/${entry.username}`} className="flex items-center gap-2 hover:underline">
                                <img src={entry.avatar} alt="" className="w-8 h-8 rounded-full shrink-0" />
                                <div className="min-w-0">
                                  <div className="text-sm truncate">
                                    {entry.name}
                                    {isMe && <span className="text-xs ml-1 text-blue-400">(You)</span>}
                                  </div>
                                  <div className={`h-1 rounded-full mt-1 w-24 ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}>
                                    <div
                                      className="h-1 rounded-full bg-blue-500"
                                      style={{ width: `${relativeShare}%` }}
                                    />
                                  </div>
                                </div>
                              </Link>
                            </td>
                            <td className="p-3 text-sm tabular-nums">{formatInr(entry.netWorth)}</td>
                            <td className={`p-3 text-sm tabular-nums ${entry.totalPnlPercent >= 0 ? "text-green-500" : "text-red-500"}`}>
                              {formatPercent(entry.totalPnlPercent)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* If the current user isn't in the visible list, show their rank separately */}
                {currentUser && !isCurrentUserVisible && (
                  <div
                    className={`mt-4 mb-16 md:mb-0 p-4 rounded-lg border-2 border-blue-500 ${
                      darkMode ? "bg-gray-900" : "bg-blue-50"
                    }`}
                  >
                    <p className="text-sm text-gray-400 mb-2">Your rank</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold tabular-nums">#{currentUser.rank}</span>
                        <img src={currentUser.avatar} alt="" className="w-8 h-8 rounded-full" />
                        <span className="text-sm">{currentUser.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm tabular-nums">{formatInr(currentUser.netWorth)}</div>
                        <div className={`text-sm tabular-nums ${currentUser.totalPnlPercent >= 0 ? "text-green-500" : "text-red-500"}`}>
                          {formatPercent(currentUser.totalPnlPercent)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </>
  );
}

export default Leaderboard;
