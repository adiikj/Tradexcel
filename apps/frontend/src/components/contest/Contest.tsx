"use client";
import React, { useCallback, useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import Header from "../dashboard/Header";
import Vheader from "../dashboard/Vheader";
import ThemeContext from "../../context/ThemeContext";
import { Helmet } from "react-helmet";
import {
  getContests,
  getContest,
  joinContest,
  getContestStandings,
  getContestPortfolio,
  getUserProfile,
} from "../../api/api";
import { formatInr, formatSignedInr } from "../../utils/format";
import Countdown from "./Countdown";
import TradeModal from "../trade/TradeModal";

const STATUS_STYLES: Record<string, string> = {
  UPCOMING: "bg-yellow-500",
  LIVE: "bg-green-500",
  ENDED: "bg-gray-500",
};

const MEDALS = ["🥇", "🥈", "🥉"];

// % of the contest window elapsed, so a LIVE card shows how close it is to ending.
function contestProgress(contest: { startAt: string; endAt: string; status: string }) {
  if (contest.status === "ENDED") return 100;
  if (contest.status === "UPCOMING") return 0;
  const start = new Date(contest.startAt).getTime();
  const end = new Date(contest.endAt).getTime();
  const now = Date.now();
  return Math.max(0, Math.min(100, ((now - start) / (end - start)) * 100));
}

function Contest() {
  const { darkMode, toggleDarkMode } = useContext(ThemeContext);

  const [statusFilter, setStatusFilter] = useState<"ALL" | "UPCOMING" | "LIVE" | "ENDED">("ALL");
  const [contests, setContests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [selectedContestId, setSelectedContestId] = useState<string | null>(null);
  const [selectedContest, setSelectedContest] = useState<any>(null);
  const [standings, setStandings] = useState<any[]>([]);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  const [contestPortfolio, setContestPortfolio] = useState<{ holdings: any[]; summary: any } | null>(null);
  const [buyTarget, setBuyTarget] = useState<{ symbol: string; price: number } | null>(null);
  const [sellTarget, setSellTarget] = useState<any>(null);

  const fetchContests = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");
      const response = await getContests();
      setContests(response?.data || []);
    } catch (err: any) {
      setError(err.message || "Failed to load contests.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContests();
    getUserProfile()
      .then((res) => setCurrentUserId(res?.data?.id ?? null))
      .catch(() => {});
  }, [fetchContests]);

  const fetchContestDetail = useCallback(async (contestId: string) => {
    try {
      setIsDetailLoading(true);
      const [contestRes, standingsRes] = await Promise.all([
        getContest(contestId),
        getContestStandings(contestId),
      ]);
      const contest = contestRes?.data || null;
      setSelectedContest(contest);
      setStandings(standingsRes?.data?.standings || []);

      // Not having joined yet is expected (404) - just means no panel to show.
      const portfolioRes = await getContestPortfolio(contestId).catch(() => null);
      setContestPortfolio(portfolioRes?.data || null);
    } catch (err: any) {
      toast.error(err.message || "Failed to load contest details.");
    } finally {
      setIsDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedContestId) {
      fetchContestDetail(selectedContestId);
    }
  }, [selectedContestId, fetchContestDetail]);

  const handleJoin = async (contestId: string) => {
    if (isJoining) return;
    try {
      setIsJoining(true);
      await joinContest(contestId);
      toast.success("Joined contest!");
      await fetchContests();
      if (selectedContestId === contestId) {
        await fetchContestDetail(contestId);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to join contest.");
    } finally {
      setIsJoining(false);
    }
  };

  const hasJoined = currentUserId && standings.some((s) => s.userId === currentUserId);

  const filteredContests =
    statusFilter === "ALL" ? contests : contests.filter((c) => c.status === statusFilter);

  const cardBg = darkMode ? "bg-gray-900" : "bg-gray-50";
  const topStandingNetWorth = standings[0]?.netWorth || 1;

  return (
    <>
      <Helmet>
        <title>Contests</title>
      </Helmet>
      <div
        className={
          darkMode
            ? "bg-gray-800 text-white min-h-screen transition-colors duration-300 font-pop"
            : "bg-white text-black min-h-screen transition-colors duration-300 font-pop"
        }
      >
        <Header darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
        <div className="flex flex-col lg:flex-row">
          <Vheader darkMode={darkMode} />
          <main className="flex-1 pb-24 md:pb-0 p-6 m-2 md:m-12">
            <h1 className="text-xl md:text-2xl font-bold">Contests</h1>
            <div className="h-2 w-32 md:w-36 bg-blue-500 rounded-full mb-6 animate-line"></div>

            {error && (
              <div className="mb-4 flex items-center gap-3">
                <p className="text-red-500 text-sm">{error}</p>
                <button onClick={fetchContests} className="text-sm text-blue-500 underline">
                  Retry
                </button>
              </div>
            )}

            {!selectedContestId ? (
              <>
                {/* Status filter tabs */}
                <div className="flex flex-wrap gap-2 mb-8">
                  {(["ALL", "UPCOMING", "LIVE", "ENDED"] as const).map((tab) => (
                    <button
                      key={tab}
                      className={`px-4 py-1.5 text-xs md:text-sm rounded-full transition-colors duration-200 active:scale-95 ${
                        statusFilter === tab
                          ? "bg-blue-500 text-white"
                          : darkMode
                          ? "bg-gray-700 text-white hover:bg-gray-600"
                          : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                      }`}
                      onClick={() => setStatusFilter(tab)}
                    >
                      {tab.charAt(0) + tab.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>

                {isLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className={`h-48 rounded-2xl animate-pulse ${cardBg}`} />
                    ))}
                  </div>
                ) : filteredContests.length === 0 ? (
                  <div className="text-center py-16">
                    <p className="text-gray-400 mb-1">No contests in this category yet.</p>
                    <p className="text-sm text-gray-500">Check back soon, or try a different filter.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredContests.map((contest) => {
                      const progress = contestProgress(contest);
                      const isLive = contest.status === "LIVE";
                      return (
                        <motion.div
                          key={contest.id}
                          whileHover={{ scale: 1.02 }}
                          className={`flex flex-col rounded-2xl shadow-lg transition-shadow duration-200 hover:shadow-xl overflow-hidden ${
                            isLive
                              ? darkMode
                                ? "bg-gradient-to-b from-green-900/30 to-gray-900 border border-green-500/30"
                                : "bg-gradient-to-b from-green-50 to-gray-50 border border-green-300"
                              : `${cardBg} border ${darkMode ? "border-gray-800" : "border-gray-200"}`
                          }`}
                        >
                          {contest.imageUrl && (
                            <img src={contest.imageUrl} alt="" className="w-full h-28 object-cover" />
                          )}
                          <div className="flex flex-col flex-1 p-5">
                            <div className="flex justify-between items-start mb-2 gap-2">
                              <h2 className="text-base font-bold truncate">{contest.name}</h2>
                              <span
                                className={`shrink-0 text-xs px-2 py-0.5 rounded-full text-white ${STATUS_STYLES[contest.status]}`}
                              >
                                {contest.status}
                              </span>
                            </div>

                            {contest.prize && (
                              <p className="text-sm text-blue-400 mb-2 truncate">🏆 {contest.prize}</p>
                            )}

                            <div className="flex items-center gap-1 text-sm text-gray-400 mb-3 tabular-nums">
                              <span>👥</span>
                              <span>{contest._count.entries} participant{contest._count.entries === 1 ? "" : "s"}</span>
                            </div>

                            <p className="text-xs text-gray-400 mb-3">
                              {contest.status === "UPCOMING" && <Countdown target={contest.startAt} label="Starts in" />}
                              {contest.status === "LIVE" && <Countdown target={contest.endAt} label="Ends in" />}
                              {contest.status === "ENDED" && "Contest has ended"}
                            </p>

                            {contest.status !== "UPCOMING" && (
                              <div className={`h-1.5 rounded-full mb-4 ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}>
                                <div
                                  className={`h-1.5 rounded-full ${isLive ? "bg-green-500" : "bg-gray-400"}`}
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                            )}

                            <div className="flex gap-2 mt-auto">
                              <button
                                className={`flex-1 px-4 py-2 text-sm rounded-md transition-colors duration-150 active:scale-95 ${
                                  darkMode ? "bg-gray-700 hover:bg-gray-600 text-white" : "bg-gray-200 hover:bg-gray-300 text-gray-800"
                                }`}
                                onClick={() => setSelectedContestId(contest.id)}
                              >
                                View
                              </button>
                              {contest.status !== "ENDED" && (
                                <button
                                  className="flex-1 px-4 py-2 text-sm rounded-md bg-green-600 text-white hover:bg-green-500 transition-colors duration-150 active:scale-95 disabled:opacity-50"
                                  disabled={isJoining}
                                  onClick={() => handleJoin(contest.id)}
                                >
                                  Join
                                </button>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              <div className={`p-6 rounded-2xl shadow-lg ${cardBg}`}>
                <button
                  onClick={() => {
                    setSelectedContestId(null);
                    setSelectedContest(null);
                    setStandings([]);
                    setContestPortfolio(null);
                  }}
                  className="text-sm text-blue-500 hover:underline mb-4"
                >
                  &larr; Back to Contests
                </button>

                {isDetailLoading || !selectedContest ? (
                  <div className="space-y-4">
                    <div className={`h-8 w-2/3 rounded animate-pulse ${darkMode ? "bg-gray-800" : "bg-gray-200"}`} />
                    <div className={`h-4 w-1/3 rounded animate-pulse ${darkMode ? "bg-gray-800" : "bg-gray-200"}`} />
                    <div className={`h-48 rounded-xl animate-pulse ${darkMode ? "bg-gray-800" : "bg-gray-200"}`} />
                  </div>
                ) : (
                  <>
                    {selectedContest.imageUrl && (
                      <img
                        src={selectedContest.imageUrl}
                        alt=""
                        className="w-full h-40 md:h-52 object-cover rounded-xl mb-4"
                      />
                    )}

                    <div className="flex justify-between items-start mb-2 gap-2">
                      <div className="min-w-0">
                        <h2 className="text-lg font-bold truncate">{selectedContest.name}</h2>
                        {selectedContest.prize && (
                          <p className="text-sm text-blue-400 mt-0.5">🏆 {selectedContest.prize}</p>
                        )}
                      </div>
                      <span
                        className={`shrink-0 text-xs px-2 py-1 rounded-full text-white ${STATUS_STYLES[selectedContest.status]}`}
                      >
                        {selectedContest.status}
                      </span>
                    </div>

                    <p className="text-sm text-gray-400 mb-1">
                      {selectedContest.status === "UPCOMING" && (
                        <Countdown target={selectedContest.startAt} label="Starts in" />
                      )}
                      {selectedContest.status === "LIVE" && (
                        <Countdown target={selectedContest.endAt} label="Ends in" />
                      )}
                      {selectedContest.status === "ENDED" && "This contest has ended - final results below."}
                    </p>

                    {selectedContest.historicalStartDate && selectedContest.simulatedDate && (
                      <p className="text-xs text-purple-400 mb-2">
                        📼 Replaying {new Date(selectedContest.historicalStartDate).toLocaleDateString()} -
                        simulated date: {new Date(selectedContest.simulatedDate).toLocaleDateString()}
                      </p>
                    )}

                    {selectedContest.status !== "UPCOMING" && (
                      <div className={`h-1.5 rounded-full mb-4 max-w-xs ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}>
                        <div
                          className={`h-1.5 rounded-full ${selectedContest.status === "LIVE" ? "bg-green-500" : "bg-gray-400"}`}
                          style={{ width: `${contestProgress(selectedContest)}%` }}
                        />
                      </div>
                    )}

                    <div className="flex items-center justify-between mb-6">
                      <p className="text-sm text-gray-400 tabular-nums">
                        {selectedContest._count.entries} participant{selectedContest._count.entries === 1 ? "" : "s"}
                      </p>
                      {selectedContest.status !== "ENDED" &&
                        (hasJoined ? (
                          <span className="text-sm text-green-500 font-semibold">You're in ✓</span>
                        ) : (
                          <button
                            className="px-4 py-2 text-sm rounded-md bg-green-600 text-white hover:bg-green-500 transition-colors duration-150 active:scale-95 disabled:opacity-50"
                            disabled={isJoining}
                            onClick={() => handleJoin(selectedContest.id)}
                          >
                            Join Contest
                          </button>
                        ))}
                    </div>

                    <h3 className="text-sm font-semibold mb-3">Standings</h3>
                    {standings.length === 0 ? (
                      <p className="text-gray-400 text-sm">No one has joined yet - be the first.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead className={darkMode ? "bg-gray-800" : "bg-gray-200"}>
                            <tr>
                              <th className="p-3 text-sm">Rank</th>
                              <th className="p-3 text-sm">Player</th>
                              <th className="p-3 text-sm">Net Worth</th>
                              <th className="p-3 text-sm">Change since joining</th>
                            </tr>
                          </thead>
                          <tbody>
                            {standings.map((entry) => {
                              const isMe = entry.userId === currentUserId;
                              const relativeShare = Math.max(0, Math.min(100, (entry.netWorth / topStandingNetWorth) * 100));
                              return (
                                <tr
                                  key={entry.userId}
                                  className={`border-b transition-colors duration-150 ${
                                    isMe
                                      ? darkMode
                                        ? "bg-blue-900"
                                        : "bg-blue-50"
                                      : darkMode
                                      ? "border-gray-800 hover:bg-gray-800"
                                      : "border-gray-200 hover:bg-gray-100"
                                  }`}
                                >
                                  <td className="p-3 text-sm tabular-nums">
                                    {entry.rank <= 3 ? MEDALS[entry.rank - 1] : entry.rank}
                                  </td>
                                  <td className="p-3">
                                    <div className="flex items-center gap-2">
                                      <img src={entry.avatar} alt="" className="w-8 h-8 rounded-full shrink-0" />
                                      <div className="min-w-0">
                                        <div className="text-sm truncate">
                                          {entry.name}
                                          {isMe && <span className="text-xs ml-1 text-blue-400">(You)</span>}
                                        </div>
                                        <div className={`h-1 rounded-full mt-1 w-20 ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}>
                                          <div className="h-1 rounded-full bg-blue-500" style={{ width: `${relativeShare}%` }} />
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="p-3 text-sm tabular-nums">{formatInr(entry.netWorth)}</td>
                                  <td className={`p-3 text-sm tabular-nums ${entry.delta >= 0 ? "text-green-500" : "text-red-500"}`}>
                                    {formatSignedInr(entry.delta)}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {hasJoined && contestPortfolio && (
                      <div className="mt-8 pt-6 border-t border-gray-500/20">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-sm font-semibold">My Contest Portfolio</h3>
                          <div className="text-sm tabular-nums">
                            <span className="text-gray-400">Cash: </span>
                            <span className="font-semibold">{formatInr(contestPortfolio.summary?.balance)}</span>
                          </div>
                        </div>

                        {contestPortfolio.holdings.length === 0 ? (
                          <p className="text-gray-400 text-sm mb-4">
                            No holdings yet - buy from the stock universe below.
                          </p>
                        ) : (
                          <div className="overflow-x-auto mb-4">
                            <table className="w-full text-left border-collapse text-sm">
                              <thead>
                                <tr className={darkMode ? "border-b border-gray-700" : "border-b border-gray-200"}>
                                  <th className="py-2 px-3">Symbol</th>
                                  <th className="py-2 px-3">Qty</th>
                                  <th className="py-2 px-3">Avg Cost</th>
                                  <th className="py-2 px-3">Current</th>
                                  <th className="py-2 px-3">P&amp;L</th>
                                  <th className="py-2 px-3"></th>
                                </tr>
                              </thead>
                              <tbody>
                                {contestPortfolio.holdings.map((holding: any) => {
                                  const pnl = holding.unrealizedPnl !== null ? Number(holding.unrealizedPnl) : null;
                                  const pnlPositive = pnl !== null && pnl >= 0;
                                  return (
                                    <tr
                                      key={holding.id}
                                      className={darkMode ? "border-b border-gray-800" : "border-b border-gray-200"}
                                    >
                                      <td className="py-2 px-3 font-medium">{holding.symbol}</td>
                                      <td className="py-2 px-3 tabular-nums">{holding.quantity}</td>
                                      <td className="py-2 px-3 tabular-nums">{formatInr(holding.avgBuyPrice)}</td>
                                      <td className="py-2 px-3 tabular-nums">
                                        {holding.currentPrice !== null ? formatInr(holding.currentPrice) : "-"}
                                      </td>
                                      <td
                                        className={`py-2 px-3 tabular-nums font-semibold ${
                                          pnl === null ? "" : pnlPositive ? "text-green-500" : "text-red-500"
                                        }`}
                                      >
                                        {pnl === null ? "-" : formatSignedInr(pnl)}
                                      </td>
                                      <td className="py-2 px-3">
                                        {selectedContest.status === "LIVE" && (
                                          <button
                                            onClick={() => setSellTarget(holding)}
                                            className={`px-3 py-1 rounded text-white text-xs transition-colors duration-150 active:scale-95 ${
                                              darkMode ? "bg-red-600 hover:bg-red-500" : "bg-red-500 hover:bg-red-400"
                                            }`}
                                          >
                                            Sell
                                          </button>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {selectedContest.status === "LIVE" && (
                          <>
                            <h4 className="text-xs uppercase tracking-wide text-gray-400 mb-2">Stock universe</h4>
                            <div className="flex flex-wrap gap-2">
                              {(selectedContest.symbols || []).map((symbol: string) => {
                                const price = selectedContest.todaysPrices?.[symbol];
                                return (
                                  <button
                                    key={symbol}
                                    onClick={() => setBuyTarget({ symbol, price: price ?? 0 })}
                                    className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors duration-150 active:scale-95 ${
                                      darkMode ? "border-gray-700 hover:bg-gray-800" : "border-gray-300 hover:bg-gray-100"
                                    }`}
                                  >
                                    {symbol}
                                    {price ? ` · ${formatInr(price)}` : ""}
                                  </button>
                                );
                              })}
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </main>
        </div>
      </div>

      {buyTarget && selectedContestId && (
        <TradeModal
          symbol={buyTarget.symbol}
          side="BUY"
          initialPrice={buyTarget.price}
          availableCash={Number(contestPortfolio?.summary?.balance ?? 0)}
          darkMode={darkMode}
          contestId={selectedContestId}
          onClose={() => setBuyTarget(null)}
          onSuccess={() => fetchContestDetail(selectedContestId)}
        />
      )}
      {sellTarget && selectedContestId && (
        <TradeModal
          symbol={sellTarget.symbol}
          side="SELL"
          initialPrice={Number(sellTarget.currentPrice ?? sellTarget.avgBuyPrice)}
          availableQty={sellTarget.quantity}
          darkMode={darkMode}
          contestId={selectedContestId}
          onClose={() => setSellTarget(null)}
          onSuccess={() => fetchContestDetail(selectedContestId)}
        />
      )}
    </>
  );
}

export default Contest;
