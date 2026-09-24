"use client";
import React, { useCallback, useState } from "react";
import Image from "next/image";
import { PiLockSimple, PiMedal } from "react-icons/pi";
import Header from "../dashboard/Header";
import Vheader from "../dashboard/Vheader";
import { getAchievements } from "../../api/api";
import { getBadgeIconSrc } from "./badgeIcons";
import { useAsyncEffect } from "../../hooks/useAsyncEffect";
import { apiErrorMessage } from "../../api/http";
import type { Badge } from "@tradexcel/shared";

const SURFACE = "rounded-2xl bg-white shadow-sm ring-1 ring-gray-200 dark:bg-gray-900 dark:shadow-none dark:ring-gray-800";

// Page sections, keyed by the backend catalog's badge ids
// (apps/backend/src/services/achievements.ts). Anything new lands in "More".
const CATEGORIES: { title: string; ids: string[] }[] = [
  { title: "Trading", ids: ["first_trade", "diversified", "big_winner"] },
  { title: "Growth", ids: ["in_the_green", "green_shoots", "steady_grower", "century_club"] },
  { title: "Streaks", ids: ["streak_3", "streak_7", "streak_30"] },
  { title: "Competition", ids: ["team_player", "podium_finish", "contest_champion", "weekly_champion", "top_of_leaderboard"] },
  { title: "Community", ids: ["networker", "social_butterfly", "league_host"] },
];

type Filter = "ALL" | "EARNED" | "LOCKED";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "EARNED", label: "Unlocked" },
  { value: "LOCKED", label: "Locked" },
];

const formatDate = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

function BadgeArt({ badge, size }: { badge: Badge; size: number }) {
  const iconSrc = getBadgeIconSrc(badge.id);
  return (
    <span
      className="relative flex shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gray-100 dark:bg-gray-800"
      style={{ width: size, height: size }}
    >
      {iconSrc ? (
        <Image src={iconSrc} alt="" className={`h-full w-full object-cover ${badge.earned ? "" : "opacity-40 grayscale"}`} />
      ) : (
        <span aria-hidden="true" className={`text-2xl font-semibold text-gray-500 dark:text-gray-400 ${badge.earned ? "" : "opacity-40"}`}>
          {badge.name.charAt(0)}
        </span>
      )}
      {!badge.earned && (
        <span className="absolute bottom-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-gray-500 shadow-sm dark:bg-gray-900 dark:text-gray-400">
          <PiLockSimple aria-hidden="true" className="h-3 w-3" />
        </span>
      )}
    </span>
  );
}

function BadgeCard({ badge }: { badge: Badge }) {
  return (
    <li className={`flex items-start gap-4 p-4 ${SURFACE}`}>
      <BadgeArt badge={badge} size={64} />
      <div className="min-w-0 flex-1">
        <p className={`font-semibold ${badge.earned ? "" : "text-gray-600 dark:text-gray-300"}`}>{badge.name}</p>
        <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{badge.description}</p>
        {badge.earned ? (
          <p className="mt-2 inline-flex items-center gap-1 rounded-md bg-teal-600/10 px-1.5 py-0.5 text-[11px] font-medium text-teal-700 dark:text-teal-300">
            Unlocked{badge.earnedAt ? ` · ${formatDate(badge.earnedAt)}` : ""}
          </p>
        ) : (
          <p className="mt-2 inline-flex rounded-md bg-gray-100 px-1.5 py-0.5 text-[11px] font-medium text-gray-500 dark:bg-gray-800 dark:text-gray-400">
            Locked
          </p>
        )}
      </div>
    </li>
  );
}

function Achievements() {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [earnedCount, setEarnedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<Filter>("ALL");

  // State is only set after the first await, so effects can call this directly.
  const loadAchievements = useCallback(async (isActive: () => boolean = () => true) => {
    try {
      const response = await getAchievements();
      if (!isActive()) return;
      setBadges(response?.data?.badges || []);
      setEarnedCount(response?.data?.earnedCount || 0);
      setTotalCount(response?.data?.totalCount || 0);
    } catch (err) {
      if (!isActive()) return;
      setError(apiErrorMessage(err, "We couldn't load your achievements. Please try again."));
    } finally {
      if (isActive()) setIsLoading(false);
    }
  }, []);

  // For buttons/handlers: show the loading state, then load.
  const fetchAchievements = useCallback(() => {
    setIsLoading(true);
    setError("");
    return loadAchievements();
  }, [loadAchievements]);

  useAsyncEffect((isActive) => loadAchievements(isActive), [loadAchievements]);

  const share = totalCount > 0 ? (earnedCount / totalCount) * 100 : 0;
  const latest = badges
    .filter((b) => b.earned && b.earnedAt)
    .sort((a, b) => new Date(b.earnedAt!).getTime() - new Date(a.earnedAt!).getTime())[0];

  const byId = new Map(badges.map((b) => [b.id, b]));
  const known = new Set(CATEGORIES.flatMap((c) => c.ids));
  const sections = [
    ...CATEGORIES.map((c) => ({ title: c.title, badges: c.ids.flatMap((id) => byId.get(id) ?? []) })),
    { title: "More", badges: badges.filter((b) => !known.has(b.id)) },
  ]
    .map((s) => ({
      ...s,
      earned: s.badges.filter((b) => b.earned).length,
      total: s.badges.length,
      badges: s.badges.filter((b) => filter === "ALL" || (filter === "EARNED" ? b.earned : !b.earned)),
    }))
    .filter((s) => s.badges.length > 0);

  return (
    <div className="min-h-screen bg-gray-50 font-pop text-gray-900 transition-colors duration-300 dark:bg-gray-800 dark:text-white">
      <Header />
      <div className="flex">
        <Vheader />
        <main className="mb-20 min-w-0 flex-1 space-y-6 md:mb-0 px-5 py-6 md:px-8 md:py-8 lg:px-12 lg:py-10">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold md:text-3xl">Achievements</h1>
              <div className="mt-1 h-0.5 w-24 rounded-full bg-blue-600 dark:bg-blue-400 animate-line" />
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Badges you earn by trading, growing your money and competing.</p>
            </div>
            <div role="group" aria-label="Filter badges" className="inline-flex rounded-xl bg-white p-0.5 shadow-sm ring-1 ring-gray-200 dark:bg-gray-900 dark:shadow-none dark:ring-gray-800">
              {FILTERS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={filter === value}
                  onClick={() => setFilter(value)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    filter === value
                      ? "bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white"
                      : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">
              <span className="flex-1">{error}</span>
              <button type="button" onClick={fetchAchievements} className="font-medium underline">
                Retry
              </button>
            </div>
          )}

          {isLoading ? (
            <div className="space-y-6">
              <div className={`h-32 animate-pulse ${SURFACE}`} />
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className={`h-24 animate-pulse ${SURFACE}`} />
                ))}
              </div>
            </div>
          ) : (
            totalCount > 0 && (
              <>
                {/* Summary: overall progress + the most recent unlock */}
                <div className="grid gap-4 lg:grid-cols-3">
                  <div className={`p-5 md:p-6 lg:col-span-2 ${SURFACE}`}>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Badges unlocked</p>
                    <p className="mt-1 text-3xl font-semibold tabular-nums">
                      {earnedCount}
                      <span className="text-lg font-normal text-gray-400"> / {totalCount}</span>
                    </p>
                    <div
                      role="meter"
                      aria-label="Badges unlocked"
                      aria-valuemin={0}
                      aria-valuemax={totalCount}
                      aria-valuenow={earnedCount}
                      className="mt-3 h-2.5 overflow-hidden rounded-full bg-blue-100 dark:bg-blue-500/15"
                    >
                      <div className="h-full rounded-full bg-blue-600 transition-[width] duration-500 dark:bg-blue-400" style={{ width: `${share}%` }} />
                    </div>
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      {earnedCount === totalCount
                        ? "You've unlocked every badge."
                        : `${totalCount - earnedCount} more to unlock.`}
                    </p>
                  </div>
                  <div className={`flex items-center gap-4 p-5 md:p-6 ${SURFACE}`}>
                    {latest ? (
                      <>
                        <BadgeArt badge={latest} size={56} />
                        <div className="min-w-0">
                          <p className="text-xs text-gray-500 dark:text-gray-400">Latest unlock</p>
                          <p className="truncate font-semibold">{latest.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(latest.earnedAt!)}</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gray-100 text-gray-400 dark:bg-gray-800">
                          <PiMedal aria-hidden="true" className="h-7 w-7" />
                        </span>
                        <div>
                          <p className="font-semibold">No badges yet</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Place your first trade to unlock one.</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {sections.length === 0 ? (
                  <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                    {filter === "EARNED" ? "You haven't unlocked any badges yet." : "You've unlocked every badge."}
                  </p>
                ) : (
                  sections.map((section) => (
                    <section key={section.title} aria-label={section.title}>
                      <div className="mb-2 flex items-baseline justify-between px-1">
                        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">{section.title}</h2>
                        <span className="text-xs tabular-nums text-gray-500 dark:text-gray-400">
                          {section.earned}/{section.total}
                        </span>
                      </div>
                      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        {section.badges.map((badge) => (
                          <BadgeCard key={badge.id} badge={badge} />
                        ))}
                      </ul>
                    </section>
                  ))
                )}
              </>
            )
          )}
        </main>
      </div>
    </div>
  );
}

export default Achievements;
