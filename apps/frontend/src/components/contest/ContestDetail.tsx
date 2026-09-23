"use client";
import React from "react";
import Countdown from "./Countdown";
import RemoteImage from "../ui/RemoteImage";
import Avatar from "../ui/Avatar";
import { formatInr, formatSignedInr } from "../../utils/format";
import { MEDALS, STATUS_STYLES, contestProgress } from "./contestUtils";
import type { Contest, ContestPortfolioData, ContestStanding } from "@tradexcel/shared";

type ContestHolding = ContestPortfolioData["holdings"][number];

type ContestDetailProps = {
  contest: Contest | null;
  isLoading: boolean;
  standings: ContestStanding[];
  portfolio: ContestPortfolioData | null;
  currentUserId: string | null;
  hasJoined: boolean;
  isJoining: boolean;
  onBack: () => void;
  onJoin: (contestId: string) => void;
  onCopyInviteCode: (code: string) => void;
  onBuy: (target: { symbol: string; price: number }) => void;
  onSell: (holding: ContestHolding) => void;
};

// One contest: header and countdown, standings, and (once joined) its
// isolated portfolio with buy/sell actions.
function ContestDetail({
  contest,
  isLoading,
  standings,
  portfolio,
  currentUserId,
  hasJoined,
  isJoining,
  onBack,
  onJoin,
  onCopyInviteCode,
  onBuy,
  onSell,
}: ContestDetailProps) {
  const cardBg = "bg-gray-50 dark:bg-gray-900";
  const topStandingNetWorth = standings[0]?.netWorth || 1;

  return (
        <div className={`p-6 rounded-2xl shadow-lg ${cardBg}`}>
          <button
            onClick={onBack}
            className="text-sm text-blue-500 hover:underline mb-4"
          >
            &larr; Back to Contests
          </button>

          {isLoading || !contest ? (
            <div className="space-y-4">
              <div className={`h-8 w-2/3 rounded animate-pulse bg-gray-200 dark:bg-gray-800`} />
              <div className={`h-4 w-1/3 rounded animate-pulse bg-gray-200 dark:bg-gray-800`} />
              <div className={`h-48 rounded-xl animate-pulse bg-gray-200 dark:bg-gray-800`} />
            </div>
          ) : (
            <>
              {contest.imageUrl && (
                <RemoteImage src={contest.imageUrl} alt="" className="w-full h-40 md:h-52 object-cover rounded-xl mb-4" width={1200} height={208} />
              )}

              <div className="flex justify-between items-start mb-2 gap-2">
                <div className="min-w-0">
                  <h2 className="text-lg font-bold truncate">{contest.name}</h2>
                  {contest.prize && <p className="text-sm text-blue-400 mt-0.5">🏆 {contest.prize}</p>}
                </div>
                <span className={`shrink-0 text-xs px-2 py-1 rounded-full text-white ${STATUS_STYLES[contest.status]}`}>
                  {contest.status}
                </span>
              </div>

              <div className="flex flex-wrap gap-2 mb-2 text-xs">
                <span className={`px-2 py-0.5 rounded-full bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300`}>
                  {contest.visibility === "PRIVATE" ? "Private league" : "Public contest"}
                </span>
                {contest.isOwner && <span className="px-2 py-0.5 rounded-full bg-blue-500 text-white">Host</span>}
              </div>

              {contest.visibility === "PRIVATE" && contest.inviteCode && (
                <div className={`mb-4 rounded-xl px-4 py-3 border flex items-center justify-between gap-3 border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800`}>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-400">Invite code</p>
                    <p className="font-semibold tracking-widest">{contest.inviteCode}</p>
                  </div>
                  <button
                    onClick={() => contest.inviteCode && onCopyInviteCode(contest.inviteCode)}
                    className={`shrink-0 px-3 py-1.5 text-xs rounded-md transition-colors duration-150 active:scale-95 ${
                      "bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white"
                    }`}
                  >
                    Copy
                  </button>
                </div>
              )}

              <p className="text-sm text-gray-400 mb-1">
                {contest.status === "UPCOMING" && <Countdown target={contest.startAt} label="Starts in" />}
                {contest.status === "LIVE" && <Countdown target={contest.endAt} label="Ends in" />}
                {contest.status === "ENDED" && "This contest has ended - final results below."}
              </p>

              {contest.historicalStartDate && contest.simulatedDate && (
                <p className="text-xs text-purple-400 mb-2">
                  📼 Replaying {new Date(contest.historicalStartDate).toLocaleDateString()} -
                  simulated date: {new Date(contest.simulatedDate).toLocaleDateString()}
                </p>
              )}

              {contest.status !== "UPCOMING" && (
                <div className={`h-1.5 rounded-full mb-4 max-w-xs bg-gray-200 dark:bg-gray-700`}>
                  <div
                    className={`h-1.5 rounded-full ${contest.status === "LIVE" ? "bg-green-500" : "bg-gray-400"}`}
                    style={{ width: `${contestProgress(contest)}%` }}
                  />
                </div>
              )}

              <div className="flex items-center justify-between mb-6 gap-3">
                <p className="text-sm text-gray-400 tabular-nums">
                  {contest._count.entries} participant{contest._count.entries === 1 ? "" : "s"}
                </p>
                {contest.visibility === "PUBLIC" && contest.status !== "ENDED" &&
                  (hasJoined ? (
                    <span className="text-sm text-green-500 font-semibold">You&apos;re in ✓</span>
                  ) : (
                    <button
                      className="px-4 py-2 text-sm rounded-md bg-green-600 text-white hover:bg-green-500 transition-colors duration-150 active:scale-95 disabled:opacity-50"
                      disabled={isJoining}
                      onClick={() => onJoin(contest.id)}
                    >
                      Join Contest
                    </button>
                  ))}
              </div>

              <h3 className="text-sm font-semibold mb-3">League leaderboard</h3>
              {standings.length === 0 ? (
                <p className="text-gray-400 text-sm">No one has joined yet - be the first.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-200 dark:bg-gray-800">
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
                                ? "bg-blue-50 dark:bg-blue-900"
                                : "border-gray-200 hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-gray-800"
                            }`}
                          >
                            <td className="p-3 text-sm tabular-nums">{entry.rank <= 3 ? MEDALS[entry.rank - 1] : entry.rank}</td>
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <Avatar src={entry.avatar} size={32} className="w-8 h-8 rounded-full shrink-0" />
                                <div className="min-w-0">
                                  <div className="text-sm truncate">
                                    {entry.name}
                                    {isMe && <span className="text-xs ml-1 text-blue-400">(You)</span>}
                                  </div>
                                  <div className={`h-1 rounded-full mt-1 w-20 bg-gray-200 dark:bg-gray-700`}>
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

              {hasJoined && portfolio && (
                <div className="mt-8 pt-6 border-t border-gray-500/20">
                  <div className="flex items-center justify-between mb-4 gap-3">
                    <h3 className="text-sm font-semibold">My Contest Portfolio</h3>
                    <div className="text-sm tabular-nums">
                      <span className="text-gray-400">Cash: </span>
                      <span className="font-semibold">{formatInr(portfolio.summary?.balance)}</span>
                    </div>
                  </div>

                  {portfolio.holdings.length === 0 ? (
                    <p className="text-gray-400 text-sm mb-4">No holdings yet - buy from the stock universe below.</p>
                  ) : (
                    <div className="overflow-x-auto mb-4">
                      <table className="w-full text-left border-collapse text-sm">
                        <thead>
                          <tr className="border-b border-gray-200 dark:border-gray-700">
                            <th className="py-2 px-3">Symbol</th>
                            <th className="py-2 px-3">Qty</th>
                            <th className="py-2 px-3">Avg Cost</th>
                            <th className="py-2 px-3">Current</th>
                            <th className="py-2 px-3">P&amp;L</th>
                            <th className="py-2 px-3"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {portfolio.holdings.map((holding) => {
                            const pnl = holding.unrealizedPnl !== null ? Number(holding.unrealizedPnl) : null;
                            const pnlPositive = pnl !== null && pnl >= 0;
                            return (
                              <tr key={holding.id} className="border-b border-gray-200 dark:border-gray-800">
                                <td className="py-2 px-3 font-medium">{holding.symbol}</td>
                                <td className="py-2 px-3 tabular-nums">{holding.quantity}</td>
                                <td className="py-2 px-3 tabular-nums">{formatInr(holding.avgBuyPrice)}</td>
                                <td className="py-2 px-3 tabular-nums">{holding.currentPrice !== null ? formatInr(holding.currentPrice) : "-"}</td>
                                <td className={`py-2 px-3 tabular-nums font-semibold ${pnl === null ? "" : pnlPositive ? "text-green-500" : "text-red-500"}`}>
                                  {pnl === null ? "-" : formatSignedInr(pnl)}
                                </td>
                                <td className="py-2 px-3">
                                  {contest.status === "LIVE" && (
                                    <button
                                      onClick={() => onSell(holding)}
                                      className={`px-3 py-1 rounded text-white text-xs transition-colors duration-150 active:scale-95 ${
                                        "bg-red-500 hover:bg-red-400 dark:bg-red-600 dark:hover:bg-red-500"
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

                  {contest.status === "LIVE" && (
                    <>
                      <h4 className="text-xs uppercase tracking-wide text-gray-400 mb-2">Stock universe</h4>
                      <div className="flex flex-wrap gap-2">
                        {(contest.symbols || []).map((symbol: string) => {
                          const price = contest.todaysPrices?.[symbol];
                          return (
                            <button
                              key={symbol}
                              onClick={() => onBuy({ symbol, price: price ?? 0 })}
                              className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors duration-150 active:scale-95 ${
                                "border-gray-300 hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
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
  );
}

export default ContestDetail;
