"use client";
import React, { useCallback, useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";
import Header from "../dashboard/Header";
import Vheader from "../dashboard/Vheader";
import ThemeContext from "../../context/ThemeContext";
import { Helmet } from "react-helmet";
import { getContests, getContest, joinContest, getContestStandings, getUserProfile } from "../../api/api";
import { formatInr, formatSignedInr } from "../../utils/format";
import Countdown from "./Countdown";

const STATUS_STYLES: Record<string, string> = {
  UPCOMING: "bg-yellow-500",
  LIVE: "bg-green-500",
  ENDED: "bg-gray-500",
};

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
      setSelectedContest(contestRes?.data || null);
      setStandings(standingsRes?.data?.standings || []);
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

  const cardBg = darkMode ? "bg-gray-900" : "bg-gray-100";

  return (
    <>
      <Helmet>
        <title>Contests</title>
      </Helmet>
      <div
        className={
          darkMode
            ? "bg-gray-800 text-white min-h-screen transition-all duration-300 font-pop"
            : "bg-white text-black min-h-screen transition-all duration-300 font-pop"
        }
      >
        <Header darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
        <div className="flex flex-col lg:flex-row">
          <Vheader darkMode={darkMode} />
          <main className="flex-1 pb-24 md:pb-0 p-6 m-2 md:m-12">
            <h1 className="text-3xl md:text-4xl font-bold">Contests</h1>
            <div className="h-2 w-32 md:w-36 bg-blue-500 rounded-full mb-6"></div>

            {error && (
              <div className="mb-4 flex items-center gap-3">
                <p className="text-red-500">{error}</p>
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
                      className={`px-4 md:px-6 py-2 text-sm md:text-lg rounded-md ${
                        statusFilter === tab
                          ? "bg-blue-500 text-white"
                          : darkMode
                          ? "bg-gray-700 text-white"
                          : "bg-gray-200 text-gray-800"
                      } hover:opacity-90`}
                      onClick={() => setStatusFilter(tab)}
                    >
                      {tab.charAt(0) + tab.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>

                {isLoading ? (
                  <p className="text-gray-400">Loading contests...</p>
                ) : filteredContests.length === 0 ? (
                  <p className="text-gray-400">No contests in this category yet.</p>
                ) : (
                  <div className="flex flex-col md:flex-row flex-wrap gap-6">
                    {filteredContests.map((contest) => (
                      <div key={contest.id} className={`p-6 md:w-96 rounded-2xl shadow-lg ${cardBg}`}>
                        <div className="flex justify-between items-start mb-2">
                          <h2 className="text-xl font-bold">{contest.name}</h2>
                          <span
                            className={`text-xs px-2 py-1 rounded-full text-white ${STATUS_STYLES[contest.status]}`}
                          >
                            {contest.status}
                          </span>
                        </div>
                        {contest.prize && <p className="text-sm text-blue-400 mb-2">{contest.prize}</p>}
                        <p className="text-sm text-gray-400 mb-2">{contest._count.entries} participants</p>
                        <p className="text-xs text-gray-400 mb-4">
                          {contest.status === "UPCOMING" && <Countdown target={contest.startAt} label="Starts in" />}
                          {contest.status === "LIVE" && <Countdown target={contest.endAt} label="Ends in" />}
                          {contest.status === "ENDED" && "Contest has ended"}
                        </p>
                        <div className="flex gap-2">
                          <button
                            className="px-4 py-2 rounded-md bg-blue-500 text-white hover:bg-blue-600"
                            onClick={() => setSelectedContestId(contest.id)}
                          >
                            View
                          </button>
                          {contest.status !== "ENDED" && (
                            <button
                              className="px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-500 disabled:opacity-50"
                              disabled={isJoining}
                              onClick={() => handleJoin(contest.id)}
                            >
                              Join
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className={`p-6 rounded-xl shadow-lg ${cardBg}`}>
                <button
                  onClick={() => {
                    setSelectedContestId(null);
                    setSelectedContest(null);
                    setStandings([]);
                  }}
                  className="text-sm text-blue-500 underline mb-4"
                >
                  &larr; Back to Contests
                </button>

                {isDetailLoading || !selectedContest ? (
                  <p className="text-gray-400">Loading contest...</p>
                ) : (
                  <>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h2 className="text-2xl font-bold">{selectedContest.name}</h2>
                        {selectedContest.prize && (
                          <p className="text-sm text-blue-400">{selectedContest.prize}</p>
                        )}
                      </div>
                      <span
                        className={`text-xs px-2 py-1 rounded-full text-white ${STATUS_STYLES[selectedContest.status]}`}
                      >
                        {selectedContest.status}
                      </span>
                    </div>

                    <p className="text-sm text-gray-400 mb-2">
                      {selectedContest.status === "UPCOMING" && (
                        <Countdown target={selectedContest.startAt} label="Starts in" />
                      )}
                      {selectedContest.status === "LIVE" && (
                        <Countdown target={selectedContest.endAt} label="Ends in" />
                      )}
                      {selectedContest.status === "ENDED" && "This contest has ended — final results below."}
                    </p>

                    <div className="flex items-center justify-between mb-6">
                      <p className="text-sm text-gray-400">{selectedContest._count.entries} participants</p>
                      {selectedContest.status !== "ENDED" &&
                        (hasJoined ? (
                          <span className="text-sm text-green-500 font-semibold">You're in ✓</span>
                        ) : (
                          <button
                            className="px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-500 disabled:opacity-50"
                            disabled={isJoining}
                            onClick={() => handleJoin(selectedContest.id)}
                          >
                            Join Contest
                          </button>
                        ))}
                    </div>

                    <h3 className="text-lg font-semibold mb-3">Standings</h3>
                    {standings.length === 0 ? (
                      <p className="text-gray-400">No one has joined yet — be the first.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead className={darkMode ? "bg-gray-700" : "bg-gray-200"}>
                            <tr>
                              <th className="p-3">Rank</th>
                              <th className="p-3">Player</th>
                              <th className="p-3">Net Worth</th>
                              <th className="p-3">Change since joining</th>
                            </tr>
                          </thead>
                          <tbody>
                            {standings.map((entry) => {
                              const isMe = entry.userId === currentUserId;
                              return (
                                <tr
                                  key={entry.userId}
                                  className={`border-b ${
                                    isMe
                                      ? darkMode
                                        ? "bg-blue-900"
                                        : "bg-blue-50"
                                      : darkMode
                                      ? "border-gray-700"
                                      : "border-gray-200"
                                  }`}
                                >
                                  <td className="p-3">{entry.rank}</td>
                                  <td className="p-3 flex items-center gap-2">
                                    <img src={entry.avatar} alt="" className="w-8 h-8 rounded-full" />
                                    <span>
                                      {entry.name}
                                      {isMe && <span className="text-xs ml-1 text-blue-400">(You)</span>}
                                    </span>
                                  </td>
                                  <td className="p-3">{formatInr(entry.netWorth)}</td>
                                  <td className={`p-3 ${entry.delta >= 0 ? "text-green-500" : "text-red-500"}`}>
                                    {formatSignedInr(entry.delta)}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </>
  );
}

export default Contest;
