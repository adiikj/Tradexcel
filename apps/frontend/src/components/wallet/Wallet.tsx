"use client";
import React, { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { PiDownloadSimple, PiMagnifyingGlass, PiReceipt } from "react-icons/pi";
import type { TransactionRecord } from "@tradexcel/shared";
import Header from "../dashboard/Header";
import Vheader from "../dashboard/Vheader";
import { getTransactions, getUserProfile, getWallet } from "../../api/api";
import { formatInr } from "../../utils/format";
import { useAsyncEffect } from "../../hooks/useAsyncEffect";
import { useMinuteClock } from "../../hooks/useMinuteClock";
import { apiErrorMessage } from "../../api/http";
import { STARTING_BALANCE, formatCountdown, nextReset, seasonStart } from "../../utils/season";
import { Card, StatTile } from "../ui/Panel";
import WalletCard from "./WalletCard";
import CashFlowChart, { type DayFlow } from "./CashFlowChart";
import TransactionList from "./TransactionList";

const PAGE_SIZE = 100;
// Transactions shown before "View all".
const PREVIEW_COUNT = 8;
const DAY_MS = 86_400_000;

type SideFilter = "ALL" | "BUY" | "SELL";

function toCsv(rows: TransactionRecord[]) {
  const cell = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const lines = [
    ["Date", "Symbol", "Side", "Quantity", "Price", "Total"].map(cell).join(","),
    ...rows.map((t) => [new Date(t.createdAt).toISOString(), t.symbol, t.side, t.quantity, Number(t.price), Number(t.total)].map(cell).join(",")),
  ];
  return lines.join("\n");
}

function Wallet() {
  const [name, setName] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [currency, setCurrency] = useState("INR");
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<SideFilter>("ALL");
  const [query, setQuery] = useState("");
  const [showAll, setShowAll] = useState(false);
  const now = useMinuteClock();

  // State is only set after the first await, so effects can call this directly.
  const loadWallet = useCallback(async (isActive: () => boolean = () => true) => {
    try {
      const [walletRes, txRes, profileRes] = await Promise.all([
        getWallet(),
        getTransactions(1, PAGE_SIZE),
        getUserProfile().catch(() => null),
      ]);
      if (!isActive()) return;
      setBalance(Number(walletRes?.data?.balance ?? 0));
      setCurrency(walletRes?.data?.currency ?? "INR");
      setTransactions(txRes?.data?.transactions ?? []);
      setPage(1);
      setTotalPages(txRes?.data?.pagination?.totalPages ?? 1);
      setName(profileRes?.data?.name ?? null);
      setError("");
    } catch (err) {
      if (isActive()) setError(apiErrorMessage(err, "We couldn't load your wallet. Please try again."));
    } finally {
      if (isActive()) setIsLoading(false);
    }
  }, []);

  useAsyncEffect((isActive) => loadWallet(isActive), [loadWallet]);

  const retry = () => {
    setIsLoading(true);
    loadWallet();
  };

  const loadMore = async () => {
    setIsLoadingMore(true);
    try {
      const res = await getTransactions(page + 1, PAGE_SIZE);
      setTransactions((prev) => [...prev, ...(res?.data?.transactions ?? [])]);
      setPage((p) => p + 1);
      setTotalPages(res?.data?.pagination?.totalPages ?? totalPages);
    } catch (err) {
      setError(apiErrorMessage(err, "Couldn't load more transactions."));
    } finally {
      setIsLoadingMore(false);
    }
  };

  const exportCsv = () => {
    const blob = new Blob([toCsv(transactions)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "tradexcel-transactions.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  // ---- this season (Monday 00:00 UTC onwards) ----
  const season = useMemo(() => {
    if (now == null) return null;
    const start = seasonStart(new Date(now)).getTime();
    const inSeason = transactions.filter((t) => new Date(t.createdAt).getTime() >= start);
    const spent = inSeason.filter((t) => t.side === "BUY").reduce((s, t) => s + Number(t.total), 0);
    const received = inSeason.filter((t) => t.side === "SELL").reduce((s, t) => s + Number(t.total), 0);
    const days: DayFlow[] = Array.from({ length: 7 }, (_, i) => {
      const dayStart = start + i * DAY_MS;
      const inDay = inSeason.filter((t) => {
        const time = new Date(t.createdAt).getTime();
        return time >= dayStart && time < dayStart + DAY_MS;
      });
      return {
        key: String(dayStart),
        label: new Date(dayStart + DAY_MS / 2).toLocaleDateString("en-IN", { weekday: "short" }),
        inflow: inDay.filter((t) => t.side === "SELL").reduce((s, t) => s + Number(t.total), 0),
        outflow: inDay.filter((t) => t.side === "BUY").reduce((s, t) => s + Number(t.total), 0),
        isToday: now >= dayStart && now < dayStart + DAY_MS,
        isFuture: dayStart > now,
      };
    });
    return { spent, received, trades: inSeason.length, days, resetIn: formatCountdown(nextReset(new Date(now)).getTime() - now) };
  }, [transactions, now]);

  // Newest first, so the preview is the latest activity.
  const visible = [...transactions]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .filter((t) => {
      if (filter !== "ALL" && t.side !== filter) return false;
      return !query.trim() || t.symbol.toLowerCase().includes(query.trim().toLowerCase());
    });

  const shown = showAll ? visible : visible.slice(0, PREVIEW_COUNT);
  const hidden = visible.length - shown.length;

  const cashShare = balance != null ? Math.min(100, (balance / STARTING_BALANCE) * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-50 font-pop text-gray-900 transition-colors duration-300 dark:bg-gray-800 dark:text-white">
      <Header />
      <div className="flex">
        <Vheader />
        <main className="mb-20 min-w-0 flex-1 space-y-4 md:mb-0 px-5 py-6 md:px-8 md:py-8 lg:px-12 lg:py-10">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold md:text-3xl">Wallet</h1>
              <div className="mt-1 h-0.5 w-24 rounded-full bg-blue-600 dark:bg-blue-400 animate-line" />
            </div>
            <button
              type="button"
              onClick={exportCsv}
              disabled={transactions.length === 0}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-medium shadow-sm ring-1 ring-gray-200 hover:bg-gray-50 disabled:opacity-50 dark:bg-gray-900 dark:ring-gray-700 dark:hover:bg-gray-800"
            >
              <PiDownloadSimple aria-hidden="true" className="h-4 w-4" /> Export CSV
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">
              <span className="flex-1">{error}</span>
              <button type="button" onClick={retry} className="font-medium underline">
                Retry
              </button>
            </div>
          )}

          {/* Card + season summary */}
          <div className="grid gap-4 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <WalletCard name={name} balance={isLoading ? null : balance} currency={currency} resetIn={season?.resetIn ?? "—"} />
            </div>
            <Card title="This season" className="lg:col-span-3" action={<span className="text-xs text-gray-500 dark:text-gray-400">Since Monday</span>}>
              <div>
                <div className="flex items-baseline justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Cash available</span>
                  <span className="tabular-nums">
                    <span className="font-semibold">{balance != null ? formatInr(balance) : "—"}</span>
                    <span className="text-gray-500 dark:text-gray-400"> of {formatInr(STARTING_BALANCE)}</span>
                  </span>
                </div>
                {/* Meter: a single ratio against the season's starting cash */}
                <div
                  role="meter"
                  aria-label="Cash available of starting balance"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(cashShare)}
                  className="mt-2 h-2.5 overflow-hidden rounded-full bg-blue-100 dark:bg-blue-500/15"
                >
                  <div className="h-full rounded-full bg-blue-600 transition-[width] duration-500 dark:bg-blue-400" style={{ width: `${cashShare}%` }} />
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{cashShare.toFixed(0)}% of your starting cash is uninvested</p>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                <StatTile label="Spent on buys">{season ? formatInr(season.spent) : "—"}</StatTile>
                <StatTile label="From sells">{season ? formatInr(season.received) : "—"}</StatTile>
                <div className="col-span-2 sm:col-span-1">
                  <StatTile label="Trades">{season ? season.trades : "—"}</StatTile>
                </div>
              </div>
            </Card>
          </div>

          {/* Transactions + cash flow (cards keep their own height) */}
          <div className="grid items-start gap-4 lg:grid-cols-3">
            <Card title="Transactions" className="lg:col-span-2" action={<span className="text-xs text-gray-500 dark:text-gray-400">{showAll ? `${transactions.length} loaded` : "Latest"}</span>}>
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <label className="relative min-w-0 flex-1 basis-full sm:basis-auto">
                  <span className="sr-only">Search transactions by symbol</span>
                  <PiMagnifyingGlass aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search by symbol"
                    className="w-full rounded-xl bg-gray-100 py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
                  />
                </label>
                <div role="group" aria-label="Filter by side" className="inline-flex rounded-xl bg-gray-100 p-0.5 dark:bg-gray-800">
                  {(["ALL", "BUY", "SELL"] as const).map((side) => (
                    <button
                      key={side}
                      type="button"
                      aria-pressed={filter === side}
                      onClick={() => setFilter(side)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                        filter === side
                          ? "bg-white text-gray-900 shadow-sm dark:bg-gray-600 dark:text-white"
                          : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                      }`}
                    >
                      {side === "ALL" ? "All" : side === "BUY" ? "Buys" : "Sells"}
                    </button>
                  ))}
                </div>
              </div>

              {isLoading ? (
                <div className="space-y-3">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="h-14 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
                  ))}
                </div>
              ) : visible.length === 0 ? (
                <div className="flex flex-col items-center py-10 text-center">
                  <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400 dark:bg-gray-800">
                    <PiReceipt aria-hidden="true" className="h-6 w-6" />
                  </span>
                  <p className="font-medium">{transactions.length === 0 ? "No transactions yet" : "Nothing matches"}</p>
                  {transactions.length === 0 && (
                    <Link href="/market" className="mt-4 rounded-xl bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700">
                      Make your first trade
                    </Link>
                  )}
                </div>
              ) : (
                <>
                  <TransactionList transactions={shown} />
                  {hidden > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowAll(true)}
                      className="mt-4 w-full rounded-xl py-2.5 text-sm font-medium text-blue-600 ring-1 ring-gray-200 hover:bg-gray-50 dark:text-blue-400 dark:ring-gray-700 dark:hover:bg-gray-800"
                    >
                      View all ({visible.length})
                    </button>
                  )}
                  {showAll && page < totalPages && (
                    <button
                      type="button"
                      onClick={loadMore}
                      disabled={isLoadingMore}
                      className="mt-4 w-full rounded-xl py-2.5 text-sm font-medium text-blue-600 ring-1 ring-gray-200 hover:bg-gray-50 disabled:opacity-60 dark:text-blue-400 dark:ring-gray-700 dark:hover:bg-gray-800"
                    >
                      {isLoadingMore ? "Loading…" : "Load older transactions"}
                    </button>
                  )}
                </>
              )}
            </Card>

            <Card title="Cash flow" action={<span className="text-xs text-gray-500 dark:text-gray-400">This season</span>}>
              {season ? <CashFlowChart days={season.days} /> : <div className="h-52 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />}
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Wallet;
