"use client";
import React from "react";
import { motion } from "framer-motion";
import Countdown from "./Countdown";
import RemoteImage from "../ui/RemoteImage";
import { STATUS_STYLES, contestProgress } from "./contestUtils";
import type { Contest } from "@tradexcel/shared";

export type ContestScope = "public" | "private";
export type StatusFilter = "ALL" | "UPCOMING" | "LIVE" | "ENDED";

type ContestListProps = {
  filteredContests: Contest[];
  isLoading: boolean;
  scope: ContestScope;
  onScopeChange: (scope: ContestScope) => void;
  statusFilter: StatusFilter;
  onStatusFilterChange: (filter: StatusFilter) => void;
  isJoining: boolean;
  onJoin: (contestId: string) => void;
  onSelect: (contestId: string) => void;
  onCopyInviteCode: (code: string) => void;
  onOpenJoin: () => void;
  onOpenCreate: () => void;
};

// The contest browser: public/private tabs, status filter and contest cards.
function ContestList({
  filteredContests,
  isLoading,
  scope,
  onScopeChange,
  statusFilter,
  onStatusFilterChange,
  isJoining,
  onJoin,
  onSelect,
  onCopyInviteCode,
  onOpenJoin,
  onOpenCreate,
}: ContestListProps) {
  const cardBg = "bg-gray-50 dark:bg-gray-900";

  return (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
            <div className="flex flex-wrap gap-2">
              {([
                { key: "public", label: "Public contests" },
                { key: "private", label: "Private contests" },
              ] as const).map((tab) => (
                <button
                  key={tab.key}
                  className={`px-4 py-1.5 text-xs md:text-sm rounded-full transition-colors duration-200 active:scale-95 ${
                    scope === tab.key
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                  }`}
                  onClick={() => onScopeChange(tab.key)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {scope === "private" && (
              <div className="flex gap-2">
                <button
                  onClick={() => onOpenJoin()}
                  className={`px-4 py-1.5 text-xs md:text-sm rounded-md transition-colors duration-150 active:scale-95 ${
                    "bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white"
                  }`}
                >
                  Join with code
                </button>
                <button
                  onClick={() => onOpenCreate()}
                  className="px-4 py-1.5 text-xs md:text-sm rounded-md bg-green-600 text-white hover:bg-green-500 transition-colors duration-150 active:scale-95"
                >
                  + Create
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2 mb-8">
            {(["ALL", "UPCOMING", "LIVE", "ENDED"] as const).map((tab) => (
              <button
                key={tab}
                className={`px-4 py-1.5 text-xs md:text-sm rounded-full transition-colors duration-200 active:scale-95 ${
                  statusFilter === tab
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                }`}
                onClick={() => onStatusFilterChange(tab)}
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
              <p className="text-gray-400 mb-1">
                {scope === "private" ? "No private leagues yet." : "No contests in this category yet."}
              </p>
              <p className="text-sm text-gray-500">
                {scope === "private"
                  ? "Create one above or join with an invite code."
                  : "Check back soon, or try a different filter."}
              </p>
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
                        ? "bg-gradient-to-b from-green-50 to-gray-50 border border-green-300 dark:from-green-900/30 dark:to-gray-900 dark:border-green-500/30"
                        : `${cardBg} border border-gray-200 dark:border-gray-800`
                    }`}
                  >
                    {contest.imageUrl && <RemoteImage src={contest.imageUrl} alt="" className="w-full h-28 object-cover" width={1200} height={112} />}
                    <div className="flex flex-col flex-1 p-5">
                      <div className="flex justify-between items-start mb-2 gap-2">
                        <h2 className="text-base font-bold truncate">{contest.name}</h2>
                        <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full text-white ${STATUS_STYLES[contest.status]}`}>
                          {contest.status}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-2 text-xs">
                        <span className={`px-2 py-0.5 rounded-full bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300`}>
                          {contest.visibility === "PRIVATE" ? "Private league" : "Public contest"}
                        </span>
                        {contest.isOwner && <span className="px-2 py-0.5 rounded-full bg-blue-500 text-white">Host</span>}
                      </div>

                      {contest.prize && <p className="text-sm text-blue-400 mb-2 truncate">🏆 {contest.prize}</p>}
                      {contest.visibility === "PRIVATE" && contest.inviteCode && (
                        <div className="flex items-center gap-2 mb-2">
                          <p className="text-xs text-gray-400">Invite code: {contest.inviteCode}</p>
                          <button
                            onClick={() => contest.inviteCode && onCopyInviteCode(contest.inviteCode)}
                            className="text-xs text-blue-500 hover:underline"
                          >
                            Copy
                          </button>
                        </div>
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
                        <div className={`h-1.5 rounded-full mb-4 bg-gray-200 dark:bg-gray-700`}>
                          <div
                            className={`h-1.5 rounded-full ${isLive ? "bg-green-500" : "bg-gray-400"}`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      )}

                      <div className="flex gap-2 mt-auto">
                        <button
                          className={`flex-1 px-4 py-2 text-sm rounded-md transition-colors duration-150 active:scale-95 ${
                            "bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white"
                          }`}
                          onClick={() => onSelect(contest.id)}
                        >
                          View
                        </button>
                        {scope === "public" && contest.status !== "ENDED" && !contest.isJoined && (
                          <button
                            className="flex-1 px-4 py-2 text-sm rounded-md bg-green-600 text-white hover:bg-green-500 transition-colors duration-150 active:scale-95 disabled:opacity-50"
                            disabled={isJoining}
                            onClick={() => onJoin(contest.id)}
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
  );
}

export default ContestList;
