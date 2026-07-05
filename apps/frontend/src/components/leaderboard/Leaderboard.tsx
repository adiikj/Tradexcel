"use client";
import React, { useCallback, useContext, useEffect, useState } from "react";
import { motion } from "framer-motion";
import Header from "../dashboard/Header";
import Vheader from "../dashboard/Vheader";
import ThemeContext from "../../context/ThemeContext";
import { Helmet } from "react-helmet";
import { getLeaderboard } from "../../api/api";
import { formatInr, formatPercent } from "../../utils/format";

const MEDALS = ["🥇", "🥈", "🥉"];

function Leaderboard() {
  const { darkMode, toggleDarkMode } = useContext(ThemeContext);

  const [entries, setEntries] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [totalPlayers, setTotalPlayers] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchLeaderboard = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");
      const response = await getLeaderboard(20);
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
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const isCurrentUserVisible = entries.some((entry) => entry.userId === currentUser?.userId);
  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);

  return (
    <>
      <Helmet>
        <title>Leaderboard</title>
      </Helmet>
      <div
        className={
          darkMode
            ? "bg-gray-800 text-white min-h-screen transition-all duration-300 font-pop"
            : "bg-white text-black min-h-screen transition-all duration-300 font-pop"
        }
      >
        <Header darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
        <div className="flex flex-col md:flex-row">
          <Vheader darkMode={darkMode} className="" />
          <main className="flex-1 p-4 m-4 md:m-10">
            <h1 className="text-3xl md:text-4xl font-bold">Leaderboard</h1>
            <div className="h-2 w-44 bg-blue-500 rounded-full mb-6"></div>

            {error && (
              <div className="mb-4 flex items-center gap-3">
                <p className="text-red-500">{error}</p>
                <button onClick={fetchLeaderboard} className="text-sm text-blue-500 underline">
                  Retry
                </button>
              </div>
            )}

            {isLoading ? (
              <p className="text-gray-400">Loading leaderboard...</p>
            ) : entries.length === 0 ? (
              <p className="text-gray-400">No players yet — be the first to make a trade.</p>
            ) : (
              <>
                <p className="text-sm text-gray-400 mb-6">{totalPlayers} players ranked by net worth</p>

                {/* Top 3 podium */}
                <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-3 space-y-4 md:space-y-0 md:space-x-12 mb-10">
                  {top3.map((entry, index) => {
                    const isMe = entry.userId === currentUser?.userId;
                    return (
                      <motion.div
                        key={entry.userId}
                        className={`w-80 md:w-72 h-auto md:h-48 flex flex-col items-center justify-center rounded-2xl p-4 ${
                          isMe
                            ? "ring-4 ring-blue-500"
                            : ""
                        } ${darkMode ? "bg-slate-900 text-white" : "bg-blue-100 text-blue-700"}`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <div className="flex flex-row md:flex-col items-center justify-center">
                          <div className="flex flex-row mt-4 md:mt-0 mb-4 pb-3 items-center justify-center gap-3 md:border-b-2">
                            <span className="text-2xl md:text-5xl font-bold">{MEDALS[index]}</span>
                            <img src={entry.avatar} alt="" className="w-10 h-10 rounded-full" />
                            <span className="text-lg md:text-2xl font-bold">
                              {entry.name}
                              {isMe && <span className="text-xs ml-1 text-blue-400">(You)</span>}
                            </span>
                          </div>
                          <div className="flex gap-2 flex-row max-w-56 md:flex-col md:gap-1 items-center">
                            <span className="text-xs md:text-lg font-semibold">{formatInr(entry.netWorth)}</span>
                            <span
                              className={`text-xs md:text-md ${
                                entry.totalPnlPercent >= 0 ? "text-green-500" : "text-red-500"
                              }`}
                            >
                              {formatPercent(entry.totalPnlPercent)}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Leaderboard Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-xs md:text-lg text-center border-collapse mb-6">
                    <thead className={darkMode ? "bg-gray-700" : "bg-gray-200"}>
                      <tr>
                        <th className="p-3">Rank</th>
                        <th className="p-3">Player</th>
                        <th className="p-3">Net Worth</th>
                        <th className="p-3">P&amp;L %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rest.map((entry) => {
                        const isMe = entry.userId === currentUser?.userId;
                        return (
                          <tr
                            key={entry.userId}
                            className={`border-b-2 ${
                              isMe
                                ? darkMode
                                  ? "bg-blue-900"
                                  : "bg-blue-50"
                                : darkMode
                                ? "hover:bg-gray-600"
                                : "hover:bg-gray-100"
                            }`}
                          >
                            <td className="p-3">{entry.rank}</td>
                            <td className="p-3 flex items-center justify-center gap-2">
                              <img src={entry.avatar} alt="" className="w-8 h-8 rounded-full" />
                              <span>
                                {entry.name}
                                {isMe && <span className="text-xs ml-1 text-blue-400">(You)</span>}
                              </span>
                            </td>
                            <td className="p-3">{formatInr(entry.netWorth)}</td>
                            <td className={`p-3 ${entry.totalPnlPercent >= 0 ? "text-green-500" : "text-red-500"}`}>
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
                        <span className="font-bold">#{currentUser.rank}</span>
                        <img src={currentUser.avatar} alt="" className="w-8 h-8 rounded-full" />
                        <span>{currentUser.name}</span>
                      </div>
                      <div className="text-right">
                        <div>{formatInr(currentUser.netWorth)}</div>
                        <div className={currentUser.totalPnlPercent >= 0 ? "text-green-500" : "text-red-500"}>
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
