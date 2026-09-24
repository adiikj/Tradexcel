"use client";
import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { PiCrown, PiRanking, PiTrophy } from "react-icons/pi";
import Header from "../dashboard/Header";
import Vheader from "../dashboard/Vheader";
import { getLeaderboard, getFriendsLeaderboard, getHallOfFame } from "../../api/api";
import { formatInr, formatPercent } from "../../utils/format";
import { useAsyncEffect } from "../../hooks/useAsyncEffect";
import { useMinuteClock } from "../../hooks/useMinuteClock";
import { apiErrorMessage } from "../../api/http";
import { formatCountdown, nextReset } from "../../utils/season";
import { changeGlyph, changeTextClass } from "../market/marketColors";
import type { ContestChampion, RankedUser, WeeklyChampion } from "@tradexcel/shared";
import Avatar from "../ui/Avatar";

const SURFACE = "rounded-2xl bg-white shadow-sm ring-1 ring-gray-200 dark:bg-gray-900 dark:shadow-none dark:ring-gray-800";

// Real podium order: 2nd, 1st, 3rd.
const PODIUM_ORDER = [1, 0, 2];
// Rank chips for the top three: gold, silver, bronze.
const MEDAL_CHIP = [
  "bg-amber-400 text-amber-950",
  "bg-gray-300 text-gray-800 dark:bg-gray-400 dark:text-gray-900",
  "bg-orange-300 text-orange-950 dark:bg-orange-400",
];

type Scope = "global" | "friends" | "contestChampions" | "weeklyChampions";

const SCOPES: { key: Scope; label: string }[] = [
  { key: "global", label: "Global" },
  { key: "friends", label: "Following" },
  { key: "contestChampions", label: "Contest champions" },
  { key: "weeklyChampions", label: "Weekly champions" },
];

const formatDate = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

function Return({ value, className = "" }: { value: number; className?: string }) {
  return (
    <span className={`tabular-nums ${changeTextClass(value)} ${className}`}>
      {changeGlyph(value)} {formatPercent(value)}
    </span>
  );
}

function YouTag({ className = "ml-1.5" }: { className?: string }) {
  return <span className={`${className} rounded bg-blue-100 px-1.5 py-px text-[10px] font-semibold text-blue-700 dark:bg-blue-500/15 dark:text-blue-300`}>You</span>;
}

function Podium({ top3, currentUserId }: { top3: RankedUser[]; currentUserId?: string }) {
  return (
    <div className="grid grid-cols-3 items-end gap-2 sm:gap-4">
      {PODIUM_ORDER.map((i) => {
        const entry = top3[i];
        if (!entry) return <div key={i} />;
        const isMe = entry.userId === currentUserId;
        const isFirst = i === 0;
        return (
          <Link
            key={entry.userId}
            href={`/u/${entry.username}`}
            className={`group flex min-w-0 flex-col items-center px-2 text-center transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/60 sm:px-4 ${SURFACE} ${
              isFirst ? "pb-5 pt-6 sm:pt-8" : "pb-4 pt-4"
            } ${isMe ? "!ring-2 !ring-blue-500" : ""}`}
          >
            <span className="relative">
              <Avatar
                src={entry.avatar}
                size={64}
                className={`rounded-full ${isFirst ? "h-14 w-14 sm:h-16 sm:w-16" : "h-11 w-11 sm:h-12 sm:w-12"}`}
              />
              <span
                className={`absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ring-2 ring-white dark:ring-gray-900 ${MEDAL_CHIP[i]}`}
              >
                {i + 1}
              </span>
            </span>
            <span className="mt-3 max-w-full truncate text-sm font-semibold group-hover:underline sm:text-base">{entry.name}</span>
            {isMe && <YouTag className="mt-1" />}
            <span className="mt-1 text-xs font-semibold tabular-nums sm:text-sm">{formatInr(entry.netWorth)}</span>
            <Return value={entry.totalPnlPercent} className="text-xs" />
          </Link>
        );
      })}
    </div>
  );
}

function RankRow({ entry, isMe }: { entry: RankedUser; isMe: boolean }) {
  return (
    <li className={isMe ? "bg-blue-50 dark:bg-blue-500/10" : ""}>
      <Link
        href={`/u/${entry.username}`}
        className="grid grid-cols-[2.5rem_1fr_auto] items-center gap-3 px-3 py-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/60 sm:grid-cols-[3rem_1fr_9rem_6rem] sm:px-4"
      >
        <span className="text-sm font-semibold tabular-nums text-gray-500 dark:text-gray-400">#{entry.rank}</span>
        <span className="flex min-w-0 items-center gap-3">
          <Avatar src={entry.avatar} size={36} className="h-9 w-9 shrink-0 rounded-full" />
          <span className="min-w-0">
            <span className="flex items-center text-sm font-medium">
              <span className="truncate">{entry.name}</span>
              {isMe && <YouTag />}
            </span>
            <span className="block truncate text-xs text-gray-500 dark:text-gray-400">@{entry.username}</span>
          </span>
        </span>
        {/* On phones net worth and return stack in one column */}
        <span className="text-right text-sm font-semibold tabular-nums">
          {formatInr(entry.netWorth)}
          <Return value={entry.totalPnlPercent} className="block text-xs font-normal sm:hidden" />
        </span>
        <Return value={entry.totalPnlPercent} className="hidden text-right text-sm sm:block" />
      </Link>
    </li>
  );
}

function EmptyState({ icon, title, children }: { icon: React.ReactNode; title: string; children?: React.ReactNode }) {
  return (
    <div className={`flex flex-col items-center px-6 py-12 text-center ${SURFACE}`}>
      <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400 dark:bg-gray-800">{icon}</span>
      <p className="font-medium">{title}</p>
      {children}
    </div>
  );
}

function Leaderboard() {
  const [scope, setScope] = useState<Scope>("global");
  const [entries, setEntries] = useState<RankedUser[]>([]);
  const [currentUser, setCurrentUser] = useState<RankedUser | null>(null);
  const [totalPlayers, setTotalPlayers] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [contestChampions, setContestChampions] = useState<ContestChampion[]>([]);
  const [weeklyChampions, setWeeklyChampions] = useState<WeeklyChampion[]>([]);
  const [isLoadingHallOfFame, setIsLoadingHallOfFame] = useState(true);
  const now = useMinuteClock();

  // State is only set after the first await, so effects can call this directly.
  const loadLeaderboard = useCallback(async (nextScope: "global" | "friends", isActive: () => boolean = () => true) => {
    try {
      const response = nextScope === "global" ? await getLeaderboard(20) : await getFriendsLeaderboard(20);
      if (!isActive()) return;
      setEntries(response?.data?.leaderboard || []);
      setCurrentUser(response?.data?.currentUser || null);
      setTotalPlayers(response?.data?.totalPlayers || 0);
    } catch (err) {
      if (!isActive()) return;
      setError(apiErrorMessage(err, "We couldn't load the leaderboard. Please try again."));
    } finally {
      if (isActive()) setIsLoading(false);
    }
  }, []);

  // For buttons/handlers: show the loading state, then load.
  const fetchLeaderboard = useCallback(
    (nextScope: "global" | "friends") => {
      setIsLoading(true);
      setError("");
      return loadLeaderboard(nextScope);
    },
    [loadLeaderboard]
  );

  // Loading flips in the tab click, not synchronously inside the refetch effect.
  const changeScope = (next: Scope) => {
    if (next !== scope && (next === "global" || next === "friends")) {
      setIsLoading(true);
      setError("");
    }
    setScope(next);
  };

  useAsyncEffect(
    (isActive) => (scope === "global" || scope === "friends" ? loadLeaderboard(scope, isActive) : Promise.resolve()),
    [loadLeaderboard, scope]
  );

  // Contest/weekly champions come from one combined endpoint - fetch once,
  // independent of which tab is active, rather than refetching per switch.
  useEffect(() => {
    getHallOfFame()
      .then((response) => {
        setContestChampions(response?.data?.contestChampions || []);
        setWeeklyChampions(response?.data?.weeklyChampions || []);
      })
      .catch(() => {})
      .finally(() => setIsLoadingHallOfFame(false));
  }, []);

  const isRanking = scope === "global" || scope === "friends";
  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);
  const topShare = currentUser && totalPlayers > 0 ? Math.max(1, Math.ceil((currentUser.rank / totalPlayers) * 100)) : null;

  return (
    <div className="min-h-screen bg-gray-50 font-pop text-gray-900 transition-colors duration-300 dark:bg-gray-800 dark:text-white">
      <Header />
      <div className="flex">
        <Vheader />
        <main className="mb-20 min-w-0 flex-1 md:mb-0 px-5 py-6 md:px-8 md:py-8 lg:px-12 lg:py-10">
          <div className="mx-auto max-w-4xl space-y-5">
            <div>
              <h1 className="text-2xl font-bold md:text-3xl">Leaderboard</h1>
              <div className="mt-1 h-0.5 w-24 rounded-full bg-blue-600 dark:bg-blue-400 animate-line" />
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Ranked by net worth this season
                {now != null && <> · resets in {formatCountdown(nextReset(new Date(now)).getTime() - now)}</>}
              </p>
            </div>

            <div
              role="group"
              aria-label="Leaderboard view"
              className="flex max-w-full overflow-x-auto rounded-xl bg-white p-0.5 shadow-sm ring-1 ring-gray-200 dark:bg-gray-900 dark:shadow-none dark:ring-gray-800 sm:inline-flex"
            >
              {SCOPES.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  aria-pressed={scope === option.key}
                  onClick={() => changeScope(option.key)}
                  className={`shrink-0 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-colors sm:text-sm ${
                    scope === option.key
                      ? "bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white"
                      : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {isRanking && (
              <>
                {error && (
                  <div className="flex items-center gap-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">
                    <span className="flex-1">{error}</span>
                    <button type="button" onClick={() => fetchLeaderboard(scope)} className="font-medium underline">
                      Retry
                    </button>
                  </div>
                )}

                {isLoading ? (
                  <div className="space-y-5">
                    <div className={`h-24 animate-pulse ${SURFACE}`} />
                    <div className="grid grid-cols-3 items-end gap-2 sm:gap-4">
                      <div className={`h-40 animate-pulse ${SURFACE}`} />
                      <div className={`h-48 animate-pulse ${SURFACE}`} />
                      <div className={`h-40 animate-pulse ${SURFACE}`} />
                    </div>
                    <div className={`h-72 animate-pulse ${SURFACE}`} />
                  </div>
                ) : entries.length === 0 ? (
                  !error && (
                    <EmptyState icon={<PiRanking aria-hidden="true" className="h-6 w-6" />} title={scope === "friends" ? "You're not following anyone yet" : "No players yet"}>
                      <p className="mt-1 max-w-sm text-sm text-gray-500 dark:text-gray-400">
                        {scope === "friends"
                          ? "Follow other traders from their profile to see how you stack up."
                          : "Be the first to make a trade and claim the top spot."}
                      </p>
                      {scope === "global" && (
                        <Link href="/market" className="mt-4 rounded-xl bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700">
                          Go to Market
                        </Link>
                      )}
                    </EmptyState>
                  )
                ) : (
                  <>
                    {/* Where you stand */}
                    {currentUser && (
                      <div className={`flex flex-wrap items-center gap-4 p-4 md:p-5 ${SURFACE}`}>
                        <Avatar src={currentUser.avatar} size={48} className="h-12 w-12 shrink-0 rounded-full" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-gray-500 dark:text-gray-400">Your position</p>
                          <p className="text-2xl font-semibold tabular-nums">
                            #{currentUser.rank}
                            <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                              {" "}
                              of {totalPlayers}
                              {scope === "global" && topShare != null && topShare <= 50 && <> · top {topShare}%</>}
                            </span>
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold tabular-nums">{formatInr(currentUser.netWorth)}</p>
                          <Return value={currentUser.totalPnlPercent} className="text-xs" />
                        </div>
                      </div>
                    )}

                    <Podium top3={top3} currentUserId={currentUser?.userId} />

                    {rest.length > 0 && (
                      <div className={`overflow-hidden ${SURFACE}`}>
                        <div className="hidden grid-cols-[3rem_1fr_9rem_6rem] gap-3 border-b border-gray-100 px-4 py-2.5 text-xs font-medium text-gray-500 dark:border-gray-800 dark:text-gray-400 sm:grid">
                          <span>Rank</span>
                          <span>Player</span>
                          <span className="text-right">Net worth</span>
                          <span className="text-right">Return</span>
                        </div>
                        <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                          {rest.map((entry) => (
                            <RankRow key={entry.userId} entry={entry} isMe={entry.userId === currentUser?.userId} />
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                )}
              </>
            )}

            {scope === "contestChampions" &&
              (isLoadingHallOfFame ? (
                <div className={`h-64 animate-pulse ${SURFACE}`} />
              ) : contestChampions.length === 0 ? (
                <EmptyState icon={<PiTrophy aria-hidden="true" className="h-6 w-6" />} title="No contests have finished yet" />
              ) : (
                <ul className={`divide-y divide-gray-100 overflow-hidden dark:divide-gray-800 ${SURFACE}`}>
                  {contestChampions.map((champion) => (
                    <li key={champion.contestId} className="flex items-center gap-3 px-4 py-3.5">
                      <Link href={`/u/${champion.user.username}`} className="shrink-0">
                        <Avatar src={champion.user.avatar} size={40} className="h-10 w-10 rounded-full" />
                      </Link>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm">
                          <Link href={`/u/${champion.user.username}`} className="font-semibold hover:underline">
                            {champion.user.name}
                          </Link>
                          <span className="text-gray-500 dark:text-gray-400"> won </span>
                          <span className="font-medium">{champion.contestName}</span>
                        </p>
                        <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                          {formatDate(champion.endAt)}
                          {champion.prize ? ` · Prize: ${champion.prize}` : ""}
                        </p>
                      </div>
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400">
                        <PiTrophy aria-hidden="true" className="h-5 w-5" />
                      </span>
                    </li>
                  ))}
                </ul>
              ))}

            {scope === "weeklyChampions" &&
              (isLoadingHallOfFame ? (
                <div className={`h-64 animate-pulse ${SURFACE}`} />
              ) : weeklyChampions.length === 0 ? (
                <EmptyState icon={<PiCrown aria-hidden="true" className="h-6 w-6" />} title="No weeks have finished yet" />
              ) : (
                <ul className={`divide-y divide-gray-100 overflow-hidden dark:divide-gray-800 ${SURFACE}`}>
                  {weeklyChampions.map((champion) => (
                    <li key={`${champion.user.id}-${champion.weekStart}`} className="flex items-center gap-3 px-4 py-3.5">
                      <Link href={`/u/${champion.user.username}`} className="shrink-0">
                        <Avatar src={champion.user.avatar} size={40} className="h-10 w-10 rounded-full" />
                      </Link>
                      <div className="min-w-0 flex-1">
                        <Link href={`/u/${champion.user.username}`} className="block truncate text-sm font-semibold hover:underline">
                          {champion.user.name}
                        </Link>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Week of {formatDate(champion.weekStart)}</p>
                      </div>
                      <Return value={champion.pnlPercent} className="shrink-0 text-sm font-semibold" />
                    </li>
                  ))}
                </ul>
              ))}
          </div>
        </main>
      </div>
    </div>
  );
}

export default Leaderboard;
