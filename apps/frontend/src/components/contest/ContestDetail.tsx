"use client";
import React from "react";
import Link from "next/link";
import { PiArrowLeft, PiCheckCircleFill, PiCopySimple, PiFilmStrip, PiTrophy } from "react-icons/pi";
import Countdown from "./Countdown";
import { StatusChip } from "./ContestList";
import RemoteImage from "../ui/RemoteImage";
import Avatar from "../ui/Avatar";
import { formatInr, formatSignedInr } from "../../utils/format";
import { changeGlyph, changeTextClass } from "../market/marketColors";
import { SURFACE, contestProgress, formatDateTime, stockName } from "./contestUtils";
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

const MEDAL_CHIP = ["bg-amber-400 text-amber-950", "bg-gray-300 text-gray-800 dark:bg-gray-400 dark:text-gray-900", "bg-orange-300 text-orange-950 dark:bg-orange-400"];

function Signed({ value, className = "" }: { value: number; className?: string }) {
  return (
    <span className={`tabular-nums ${changeTextClass(value)} ${className}`}>
      {changeGlyph(value)} {formatSignedInr(value)}
    </span>
  );
}

function Section({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className={`overflow-hidden ${SURFACE}`}>
      <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-3 dark:border-gray-800 md:px-5">
        <h2 className="text-sm font-semibold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function Standings({ standings, currentUserId }: { standings: ContestStanding[]; currentUserId: string | null }) {
  if (standings.length === 0) {
    return <p className="px-5 py-8 text-center text-sm text-gray-500 dark:text-gray-400">No one has joined yet. Be the first.</p>;
  }
  return (
    <ol className="divide-y divide-gray-100 dark:divide-gray-800">
      {standings.map((entry) => {
        const isMe = entry.userId === currentUserId;
        return (
          <li key={entry.userId} className={`flex items-center gap-3 px-4 py-3 md:px-5 ${isMe ? "bg-blue-50 dark:bg-blue-500/10" : ""}`}>
            {entry.rank <= 3 ? (
              <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${MEDAL_CHIP[entry.rank - 1]}`}>{entry.rank}</span>
            ) : (
              <span className="w-6 shrink-0 text-center text-sm font-semibold tabular-nums text-gray-500 dark:text-gray-400">{entry.rank}</span>
            )}
            <Link href={`/u/${entry.username}`} className="flex min-w-0 flex-1 items-center gap-2.5 hover:underline">
              <Avatar src={entry.avatar} size={32} className="h-8 w-8 shrink-0 rounded-full" />
              <span className="truncate text-sm font-medium">{entry.name}</span>
              {isMe && (
                <span className="shrink-0 rounded bg-blue-100 px-1.5 py-px text-[10px] font-semibold text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">You</span>
              )}
            </Link>
            <span className="shrink-0 text-right">
              <span className="block text-sm font-semibold tabular-nums">{formatInr(entry.netWorth)}</span>
              <Signed value={entry.delta} className="block text-xs" />
            </span>
          </li>
        );
      })}
    </ol>
  );
}

// One contest: a summary up top, then your contest portfolio and the stocks
// you can trade on one side, standings on the other.
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
  const back = (
    <button type="button" onClick={onBack} className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
      <PiArrowLeft aria-hidden="true" className="h-4 w-4" /> All contests
    </button>
  );

  if (isLoading || !contest) {
    return (
      <div className="space-y-4">
        {back}
        <div className={`h-40 animate-pulse ${SURFACE}`} />
        <div className="grid gap-4 lg:grid-cols-5">
          <div className={`h-72 animate-pulse lg:col-span-3 ${SURFACE}`} />
          <div className={`h-72 animate-pulse lg:col-span-2 ${SURFACE}`} />
        </div>
      </div>
    );
  }

  const isLive = contest.status === "LIVE";
  const canJoin = contest.visibility === "PUBLIC" && contest.status !== "ENDED" && !hasJoined;
  const me = standings.find((s) => s.userId === currentUserId);
  const holdingsValue = portfolio?.holdings.reduce((sum, h) => sum + Number(h.currentValue ?? h.investedValue), 0) ?? 0;
  const cash = Number(portfolio?.summary?.balance ?? 0);

  return (
    <div className="space-y-4">
      {back}

      {/* Summary */}
      <div className={`overflow-hidden ${SURFACE}`}>
        {contest.imageUrl && <RemoteImage src={contest.imageUrl} alt="" className="h-32 w-full object-cover md:h-44" width={1200} height={176} />}
        <div className="p-4 md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <StatusChip status={contest.status} />
                <span className="text-xs text-gray-500 dark:text-gray-400">{contest.visibility === "PRIVATE" ? "Private league" : "Public contest"}</span>
                {contest.isOwner && <span className="text-xs font-medium text-blue-600 dark:text-blue-400">· You host</span>}
              </div>
              <h1 className="mt-2 text-xl font-bold md:text-2xl">{contest.name}</h1>
              {contest.prize && (
                <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300">
                  <PiTrophy aria-hidden="true" className="h-4 w-4 text-amber-500" /> {contest.prize}
                </p>
              )}
            </div>
            {canJoin ? (
              <button
                type="button"
                onClick={() => onJoin(contest.id)}
                disabled={isJoining}
                className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {isJoining ? "Joining…" : "Join contest"}
              </button>
            ) : (
              hasJoined && (
                <span className="flex items-center gap-1.5 text-sm font-medium text-teal-700 dark:text-teal-300">
                  <PiCheckCircleFill aria-hidden="true" className="h-5 w-5" /> You&apos;re in
                </span>
              )
            )}
          </div>

          <dl className="mt-5 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
            <div>
              <dt className="text-xs text-gray-500 dark:text-gray-400">{contest.status === "UPCOMING" ? "Starts in" : isLive ? "Ends in" : "Ended"}</dt>
              <dd className="mt-0.5 font-semibold tabular-nums">
                {contest.status === "ENDED" ? formatDateTime(contest.endAt) : <Countdown target={contest.status === "UPCOMING" ? contest.startAt : contest.endAt} label="" />}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500 dark:text-gray-400">Players</dt>
              <dd className="mt-0.5 font-semibold tabular-nums">{contest._count.entries}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500 dark:text-gray-400">Starting cash</dt>
              <dd className="mt-0.5 font-semibold tabular-nums">{formatInr(contest.startingBalance)}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500 dark:text-gray-400">Schedule</dt>
              <dd className="mt-0.5 text-xs font-medium leading-5">
                {formatDateTime(contest.startAt)} – {formatDateTime(contest.endAt)}
              </dd>
            </div>
          </dl>

          {isLive && (
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800" aria-hidden="true">
              <div className="h-full rounded-full bg-teal-500" style={{ width: `${contestProgress(contest)}%` }} />
            </div>
          )}

          {contest.historicalStartDate && (
            <p className="mt-4 flex items-start gap-2 rounded-xl bg-gray-50 px-3 py-2.5 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300">
              <PiFilmStrip aria-hidden="true" className="mt-px h-4 w-4 shrink-0" />
              <span>
                Replays the market from {new Date(contest.historicalStartDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                {contest.simulatedDate && (
                  <>
                    {" "}
                    · now trading{" "}
                    <span className="font-semibold">{new Date(contest.simulatedDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                  </>
                )}
              </span>
            </p>
          )}

          {contest.visibility === "PRIVATE" && contest.inviteCode && (
            <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-gray-50 px-4 py-3 dark:bg-gray-800">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Invite code, share it with friends</p>
                <p className="font-mono text-lg font-semibold tracking-widest">{contest.inviteCode}</p>
              </div>
              <button
                type="button"
                onClick={() => contest.inviteCode && onCopyInviteCode(contest.inviteCode)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-medium ring-1 ring-gray-200 hover:bg-gray-50 dark:bg-gray-900 dark:ring-gray-700 dark:hover:bg-gray-700"
              >
                <PiCopySimple aria-hidden="true" className="h-4 w-4" /> Copy
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-3">
          {/* Your contest portfolio (separate from your weekly wallet) */}
          {hasJoined && portfolio && (
            <Section title="Your contest portfolio" action={me && <span className="text-xs text-gray-500 dark:text-gray-400">Rank #{me.rank}</span>}>
              <dl className="grid grid-cols-3 gap-3 border-b border-gray-100 px-4 py-4 dark:border-gray-800 md:px-5">
                <div>
                  <dt className="text-xs text-gray-500 dark:text-gray-400">Net worth</dt>
                  <dd className="mt-0.5 font-semibold tabular-nums">{formatInr(me?.netWorth ?? cash + holdingsValue)}</dd>
                  {me && <Signed value={me.delta} className="text-xs" />}
                </div>
                <div>
                  <dt className="text-xs text-gray-500 dark:text-gray-400">Cash</dt>
                  <dd className="mt-0.5 font-semibold tabular-nums">{formatInr(cash)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500 dark:text-gray-400">Holdings</dt>
                  <dd className="mt-0.5 font-semibold tabular-nums">{formatInr(holdingsValue)}</dd>
                </div>
              </dl>
              {portfolio.holdings.length === 0 ? (
                <p className="px-5 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                  {isLive ? "No holdings yet. Buy from the stocks below." : "No holdings."}
                </p>
              ) : (
                <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                  {portfolio.holdings.map((holding) => {
                    const pnl = holding.unrealizedPnl !== null ? Number(holding.unrealizedPnl) : null;
                    return (
                      <li key={holding.id} className="flex items-center gap-3 px-4 py-3 md:px-5">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">{stockName(holding.symbol)}</p>
                          <p className="text-xs tabular-nums text-gray-500 dark:text-gray-400">
                            {holding.quantity} × {formatInr(holding.avgBuyPrice)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold tabular-nums">{holding.currentPrice !== null ? formatInr(holding.currentValue) : "—"}</p>
                          {pnl !== null && <Signed value={pnl} className="text-xs" />}
                        </div>
                        {isLive && (
                          <button
                            type="button"
                            onClick={() => onSell(holding)}
                            className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-600 ring-1 ring-red-200 hover:bg-red-50 dark:text-red-400 dark:ring-red-500/30 dark:hover:bg-red-500/10"
                          >
                            Sell
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </Section>
          )}

          <Section
            title="Stocks in this contest"
            action={<span className="text-xs text-gray-500 dark:text-gray-400">{contest.symbols?.length ?? 0} stocks</span>}
          >
            {!hasJoined && contest.status !== "ENDED" && (
              <p className="border-b border-gray-100 px-4 py-2.5 text-xs text-gray-500 dark:border-gray-800 dark:text-gray-400 md:px-5">
                {contest.visibility === "PUBLIC" ? "Join the contest to trade these." : "Only league members can trade here."}
              </p>
            )}
            <ul className="grid max-h-96 overflow-y-auto sm:grid-cols-2">
              {(contest.symbols || []).map((symbol) => {
                const price = contest.todaysPrices?.[symbol];
                const canBuy = hasJoined && isLive;
                return (
                  <li key={symbol} className="flex items-center gap-3 border-b border-gray-100 px-4 py-2.5 dark:border-gray-800 md:px-5 sm:odd:border-r">
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">{stockName(symbol)}</span>
                    <span className="text-sm tabular-nums text-gray-600 dark:text-gray-300">{price ? formatInr(price) : "—"}</span>
                    {canBuy && (
                      <button
                        type="button"
                        onClick={() => onBuy({ symbol, price: price ?? 0 })}
                        aria-label={`Buy ${stockName(symbol)}`}
                        className="rounded-lg bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700"
                      >
                        Buy
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </Section>
        </div>

        <div className="lg:col-span-2">
          <Section title={contest.status === "ENDED" ? "Final standings" : "Standings"}>
            <Standings standings={standings} currentUserId={currentUserId} />
          </Section>
        </div>
      </div>
    </div>
  );
}

export default ContestDetail;
