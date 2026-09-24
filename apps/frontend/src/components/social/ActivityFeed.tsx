"use client";
import React, { useCallback, useState } from "react";
import Link from "next/link";
import { PiTrophy, PiUsersThree } from "react-icons/pi";
import Header from "../dashboard/Header";
import Vheader from "../dashboard/Vheader";
import { getActivityFeed } from "../../api/api";
import { formatInr, timeAgo } from "../../utils/format";
import { useAsyncEffect } from "../../hooks/useAsyncEffect";
import { apiErrorMessage } from "../../api/http";
import type { ActivityItem as ActivityItemData } from "@tradexcel/shared";
import Avatar from "../ui/Avatar";
import stockList from "../market/StockData.json";
import type { StockListing } from "../../types/market";

const NAMES = new Map((stockList as StockListing[]).map((s) => [s.symbol, s]));

type KindFilter = "ALL" | "trade" | "contest_result";

const FILTERS: { value: KindFilter; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "trade", label: "Trades" },
  { value: "contest_result", label: "Contests" },
];

function dayLabel(date: Date, now: Date) {
  const start = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diff = Math.round((start(now) - start(date)) / 86_400_000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return date.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: date.getFullYear() === now.getFullYear() ? undefined : "numeric" });
}

function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`;
}

function ActivityItem({ item }: { item: ActivityItemData }) {
  const profile = `/u/${item.user.username}`;

  return (
    <li className="flex items-start gap-3 px-3 py-3.5 sm:px-4">
      <Link href={profile} className="shrink-0 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
        <Avatar src={item.user.avatar} size={40} className="h-10 w-10 rounded-full" />
      </Link>
      <div className="min-w-0 flex-1">
        <p className="text-sm leading-relaxed">
          <Link href={profile} className="font-semibold hover:underline">
            {item.user.name}
          </Link>{" "}
          {item.type === "trade" ? (
            <span className="text-gray-600 dark:text-gray-300">
              {item.side === "BUY" ? "bought" : "sold"} {item.quantity} share{item.quantity === 1 ? "" : "s"} of{" "}
              <Link href={`/market?symbol=${encodeURIComponent(item.symbol)}`} className="font-semibold text-gray-900 hover:underline dark:text-white">
                {NAMES.get(item.symbol)?.shortName ?? item.symbol.replace(/\.NS$/, "")}
              </Link>
            </span>
          ) : (
            <span className="text-gray-600 dark:text-gray-300">
              finished <span className="font-semibold text-gray-900 dark:text-white">{item.contestName}</span>
              {item.finalRank != null && <> in {ordinal(item.finalRank)} place</>}
            </span>
          )}
        </p>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-gray-500 dark:text-gray-400">
          <span className="tabular-nums">{timeAgo(item.timestamp)}</span>
          {item.type === "trade" && (
            <>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">
                {item.quantity} × {formatInr(item.price)}
              </span>
            </>
          )}
        </p>
      </div>
      {item.type === "trade" ? (
        <div className="shrink-0 text-right">
          <span
            className={`rounded px-1.5 py-px text-[10px] font-bold tracking-wide ${
              item.side === "BUY" ? "bg-green-600/10 text-green-700 dark:text-green-300" : "bg-red-600/10 text-red-600 dark:text-red-400"
            }`}
          >
            {item.side}
          </span>
          <p className="mt-1 text-sm font-semibold tabular-nums">{formatInr(item.total)}</p>
        </div>
      ) : (
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
            item.finalRank === 1 ? "bg-amber-500/15 text-amber-600 dark:text-amber-400" : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
          }`}
        >
          <PiTrophy aria-hidden="true" className="h-5 w-5" />
        </span>
      )}
    </li>
  );
}

function ActivityFeed() {
  const [items, setItems] = useState<ActivityItemData[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<KindFilter>("ALL");

  // State is only set after the first await, so effects can call this directly.
  const loadActivity = useCallback(async (nextPage: number, isActive: () => boolean = () => true) => {
    try {
      const response = await getActivityFeed(nextPage, 20);
      if (!isActive()) return;
      const newItems = response?.data?.items || [];
      setItems((prev) => (nextPage === 1 ? newItems : [...prev, ...newItems]));
      setTotalPages(response?.data?.pagination?.totalPages || 1);
      setPage(nextPage);
    } catch (err) {
      if (!isActive()) return;
      setError(apiErrorMessage(err, "We couldn't load recent activity. Please try again."));
    } finally {
      if (isActive()) setIsLoading(false);
    }
  }, []);

  // For buttons/handlers: show the loading state, then load.
  const fetchActivity = useCallback(
    (nextPage: number) => {
      setIsLoading(true);
      setError("");
      return loadActivity(nextPage);
    },
    [loadActivity]
  );

  useAsyncEffect((isActive) => loadActivity(1, isActive), [loadActivity]);

  // Grouped by day, newest first; grouping relies on same-day items being adjacent.
  const now = new Date();
  const groups: { label: string; items: ActivityItemData[] }[] = [];
  const ordered = [...items]
    .filter((item) => filter === "ALL" || item.type === filter)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  for (const item of ordered) {
    const label = dayLabel(new Date(item.timestamp), now);
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.items.push(item);
    else groups.push({ label, items: [item] });
  }

  return (
    <div className="min-h-screen bg-gray-50 font-pop text-gray-900 transition-colors duration-300 dark:bg-gray-800 dark:text-white">
      <Header />
      <div className="flex">
        <Vheader />
        <main className="mb-20 min-w-0 flex-1 md:mb-0 px-5 py-6 md:px-8 md:py-8 lg:px-12 lg:py-10">
          <div className="mx-auto max-w-3xl space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold md:text-3xl">Activity</h1>
                <div className="mt-1 h-0.5 w-24 rounded-full bg-blue-600 dark:bg-blue-400 animate-line" />
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Trades and contest results from traders you follow.</p>
              </div>
              <div role="group" aria-label="Filter activity" className="inline-flex rounded-xl bg-white p-0.5 shadow-sm ring-1 ring-gray-200 dark:bg-gray-900 dark:shadow-none dark:ring-gray-800">
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
                <button type="button" onClick={() => fetchActivity(1)} className="font-medium underline">
                  Retry
                </button>
              </div>
            )}

            {isLoading && items.length === 0 ? (
              <div className="divide-y divide-gray-100 rounded-2xl bg-white shadow-sm ring-1 ring-gray-200 dark:divide-gray-800 dark:bg-gray-900 dark:shadow-none dark:ring-gray-800">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-4">
                    <span className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-gray-100 dark:bg-gray-800" />
                    <span className="flex-1 space-y-2">
                      <span className="block h-3 w-3/4 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
                      <span className="block h-3 w-1/4 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
                    </span>
                  </div>
                ))}
              </div>
            ) : groups.length === 0 ? (
              <div className="flex flex-col items-center rounded-2xl bg-white px-6 py-12 text-center shadow-sm ring-1 ring-gray-200 dark:bg-gray-900 dark:shadow-none dark:ring-gray-800">
                <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400 dark:bg-gray-800">
                  <PiUsersThree aria-hidden="true" className="h-6 w-6" />
                </span>
                {items.length === 0 ? (
                  <>
                    <p className="font-medium">Nothing here yet</p>
                    <p className="mt-1 max-w-sm text-sm text-gray-500 dark:text-gray-400">
                      Follow other traders to see their trades and contest results here.
                    </p>
                    <Link href="/leaderboard" className="mt-4 rounded-xl bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700">
                      Find traders on the leaderboard
                    </Link>
                  </>
                ) : (
                  <p className="font-medium">No {filter === "trade" ? "trades" : "contest results"} yet</p>
                )}
              </div>
            ) : (
              <div className="space-y-5">
                {groups.map((group) => (
                  <section key={group.label} aria-label={group.label}>
                    <h2 className="mb-1.5 px-1 text-xs font-medium text-gray-500 dark:text-gray-400">{group.label}</h2>
                    <ul className="divide-y divide-gray-100 rounded-2xl bg-white shadow-sm ring-1 ring-gray-200 dark:divide-gray-800 dark:bg-gray-900 dark:shadow-none dark:ring-gray-800">
                      {group.items.map((item) => (
                        <ActivityItem key={`${item.type}-${item.id}`} item={item} />
                      ))}
                    </ul>
                  </section>
                ))}
                {page < totalPages && (
                  <button
                    type="button"
                    onClick={() => fetchActivity(page + 1)}
                    disabled={isLoading}
                    className="w-full rounded-xl bg-white py-2.5 text-sm font-medium text-blue-600 shadow-sm ring-1 ring-gray-200 hover:bg-gray-50 disabled:opacity-60 dark:bg-gray-900 dark:text-blue-400 dark:shadow-none dark:ring-gray-800 dark:hover:bg-gray-800"
                  >
                    {isLoading ? "Loading…" : "Load more"}
                  </button>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default ActivityFeed;
