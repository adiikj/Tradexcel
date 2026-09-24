"use client";
import React from "react";
import { PiCheckCircleFill, PiClockCountdown, PiTrophy, PiUsers } from "react-icons/pi";
import Countdown from "./Countdown";
import RemoteImage from "../ui/RemoteImage";
import { STATUS_META, SURFACE, contestProgress } from "./contestUtils";
import type { Contest } from "@tradexcel/shared";

export type ContestScope = "public" | "private";

type ContestListProps = {
  contests: Contest[];
  isLoading: boolean;
  scope: ContestScope;
  isJoining: boolean;
  onJoin: (contestId: string) => void;
  onSelect: (contestId: string) => void;
  onOpenJoin: () => void;
  onOpenCreate: () => void;
};

// Live first (that's where the action is), then upcoming, then results.
const SECTIONS = [
  { status: "LIVE", title: "Live now" },
  { status: "UPCOMING", title: "Upcoming" },
  { status: "ENDED", title: "Ended" },
] as const;

export function StatusChip({ status }: { status: string }) {
  const meta = STATUS_META[status] ?? STATUS_META.ENDED;
  return (
    <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ${meta.chip}`}>
      <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
}

function ContestCard({ contest, canJoin, isJoining, onJoin, onSelect }: { contest: Contest; canJoin: boolean; isJoining: boolean; onJoin: () => void; onSelect: () => void }) {
  const isLive = contest.status === "LIVE";
  const participants = contest._count.entries;

  return (
    <li className={`flex flex-col overflow-hidden ${SURFACE}`}>
      {contest.imageUrl && <RemoteImage src={contest.imageUrl} alt="" className="h-28 w-full object-cover" width={1200} height={112} />}
      <div className="flex flex-1 flex-col p-4 md:p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="min-w-0 font-semibold leading-snug">
            {/* The title is the card's link; the whole card isn't, so the Join button stays a separate target. */}
            <button type="button" onClick={onSelect} className="text-left hover:underline focus:outline-none focus-visible:underline">
              {contest.name}
            </button>
          </h3>
          <StatusChip status={contest.status} />
        </div>

        {contest.prize && (
          <p className="mt-1.5 flex items-center gap-1.5 truncate text-sm text-gray-600 dark:text-gray-300">
            <PiTrophy aria-hidden="true" className="h-4 w-4 shrink-0 text-amber-500" />
            <span className="truncate">{contest.prize}</span>
          </p>
        )}

        <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1 tabular-nums">
            <PiUsers aria-hidden="true" className="h-3.5 w-3.5" />
            {participants} {participants === 1 ? "player" : "players"}
          </span>
          {contest.status !== "ENDED" && (
            <span className="flex items-center gap-1 tabular-nums">
              <PiClockCountdown aria-hidden="true" className="h-3.5 w-3.5" />
              <Countdown target={contest.status === "UPCOMING" ? contest.startAt : contest.endAt} label={contest.status === "UPCOMING" ? "Starts in" : "Ends in"} />
            </span>
          )}
          {contest.historicalStartDate && <span>Replay</span>}
          {contest.isOwner && <span className="font-medium text-blue-600 dark:text-blue-400">You host</span>}
        </p>

        {isLive && (
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800" aria-hidden="true">
            <div className="h-full rounded-full bg-teal-500" style={{ width: `${contestProgress(contest)}%` }} />
          </div>
        )}

        <div className="mt-auto flex items-center gap-2 pt-4">
          {contest.isJoined && (
            <span className="mr-auto flex items-center gap-1 text-xs font-medium text-teal-700 dark:text-teal-300">
              <PiCheckCircleFill aria-hidden="true" className="h-4 w-4" /> Joined
            </span>
          )}
          {canJoin ? (
            <>
              <button
                type="button"
                onClick={onSelect}
                className="flex-1 rounded-xl py-2 text-sm font-medium ring-1 ring-gray-200 hover:bg-gray-50 dark:ring-gray-700 dark:hover:bg-gray-800"
              >
                Details
              </button>
              <button
                type="button"
                onClick={onJoin}
                disabled={isJoining}
                className="flex-1 rounded-xl bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                Join
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onSelect}
              className={`rounded-xl px-4 py-2 text-sm font-medium ring-1 ring-gray-200 hover:bg-gray-50 dark:ring-gray-700 dark:hover:bg-gray-800 ${contest.isJoined ? "" : "flex-1"}`}
            >
              {contest.status === "ENDED" ? "View results" : contest.isJoined && isLive ? "Trade" : "Open"}
            </button>
          )}
        </div>
      </div>
    </li>
  );
}

// The contest browser: contests grouped by status, one clear action per card.
function ContestList({ contests, isLoading, scope, isJoining, onJoin, onSelect, onOpenJoin, onOpenCreate }: ContestListProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className={`h-48 animate-pulse ${SURFACE}`} />
        ))}
      </div>
    );
  }

  if (contests.length === 0) {
    return (
      <div className={`flex flex-col items-center px-6 py-12 text-center ${SURFACE}`}>
        <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400 dark:bg-gray-800">
          <PiTrophy aria-hidden="true" className="h-6 w-6" />
        </span>
        {scope === "private" ? (
          <>
            <p className="font-medium">No private leagues yet</p>
            <p className="mt-1 max-w-sm text-sm text-gray-500 dark:text-gray-400">Create a league and invite friends, or join one with a code.</p>
            <div className="mt-4 flex gap-2">
              <button type="button" onClick={onOpenJoin} className="rounded-xl px-4 py-2 text-sm font-medium ring-1 ring-gray-200 hover:bg-gray-50 dark:ring-gray-700 dark:hover:bg-gray-800">
                Join with code
              </button>
              <button type="button" onClick={onOpenCreate} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                Create league
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="font-medium">No contests right now</p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">New public contests show up here. Check back soon.</p>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {SECTIONS.map(({ status, title }) => {
        const inSection = contests.filter((c) => c.status === status);
        if (inSection.length === 0) return null;
        return (
          <section key={status} aria-label={title}>
            <h2 className="mb-2 flex items-center gap-2 px-1 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              {title}
              <span className="rounded-full bg-gray-200 px-1.5 text-[10px] tabular-nums text-gray-600 dark:bg-gray-700 dark:text-gray-300">{inSection.length}</span>
            </h2>
            <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {inSection.map((contest) => (
                <ContestCard
                  key={contest.id}
                  contest={contest}
                  canJoin={contest.visibility === "PUBLIC" && contest.status !== "ENDED" && !contest.isJoined}
                  isJoining={isJoining}
                  onJoin={() => onJoin(contest.id)}
                  onSelect={() => onSelect(contest.id)}
                />
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

export default ContestList;
