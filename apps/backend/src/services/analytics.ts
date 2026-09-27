import { Prisma, type Side } from "@prisma/client";
import { sectorOf, type PortfolioAnalytics, type ClosedTrade } from "@tradexcel/shared";
import prisma from "../db/prisma.js";
import logger from "../utils/logger.js";
import { getQuotes } from "./pricing.js";
import { computeNetWorths } from "./netWorth.js";
import { getChart } from "./chart.js";
import { STARTING_BALANCE } from "./tradeMath.js";
import { getMostRecentMonday } from "./weeklyReset.js";

// The Portfolio page's analytics for the current season (Monday 00:00 UTC
// onwards): equity curve vs NIFTY 50, sector allocation, and realized P&L
// replayed from the season's trades. Every season starts from cash only (the
// weekly reset liquidates holdings), so the replay needs no earlier history.

export const BENCHMARK_SYMBOL = "^NSEI";

type TradeRow = {
  id: string;
  symbol: string;
  side: Side;
  quantity: number;
  price: Prisma.Decimal;
  total: Prisma.Decimal;
  charges: Prisma.Decimal;
  note: string | null;
  createdAt: Date;
};

type Position = { quantity: number; cost: Prisma.Decimal; buyCharges: Prisma.Decimal };

// Replays trades oldest-first with weighted-average cost, like the Holding
// table does. A sale's P&L is net of its own charges and of the buy charges
// on the shares it closed (allocated pro rata), so charges count against you.
export function replayTrades(trades: TradeRow[]): { closed: ClosedTrade[]; chargesPaid: number } {
  const positions = new Map<string, Position>();
  const closed: ClosedTrade[] = [];
  let chargesPaid = new Prisma.Decimal(0);

  for (const t of [...trades].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())) {
    chargesPaid = chargesPaid.add(t.charges);
    const pos = positions.get(t.symbol) ?? { quantity: 0, cost: new Prisma.Decimal(0), buyCharges: new Prisma.Decimal(0) };

    if (t.side === "BUY") {
      positions.set(t.symbol, { quantity: pos.quantity + t.quantity, cost: pos.cost.add(t.total), buyCharges: pos.buyCharges.add(t.charges) });
      continue;
    }

    // A sale with no position in this replay (e.g. bought before the season
    // boundary) has no cost basis to measure against; skip it.
    if (pos.quantity < t.quantity || pos.quantity === 0) continue;

    const share = new Prisma.Decimal(t.quantity).div(pos.quantity);
    const costOut = pos.cost.mul(share);
    const buyChargesOut = pos.buyCharges.mul(share);
    const basis = costOut.add(buyChargesOut);
    const pnl = t.total.sub(t.charges).sub(basis);

    closed.push({
      transactionId: t.id,
      symbol: t.symbol,
      quantity: t.quantity,
      avgBuyPrice: costOut.div(t.quantity).toDecimalPlaces(2).toNumber(),
      sellPrice: t.price.toDecimalPlaces(2).toNumber(),
      pnl: pnl.toDecimalPlaces(2).toNumber(),
      pnlPercent: basis.gt(0) ? pnl.div(basis).mul(100).toDecimalPlaces(2).toNumber() : 0,
      closedAt: t.createdAt.toISOString(),
      note: t.note,
    });

    const remaining = pos.quantity - t.quantity;
    if (remaining === 0) positions.delete(t.symbol);
    else positions.set(t.symbol, { quantity: remaining, cost: pos.cost.sub(costOut), buyCharges: pos.buyCharges.sub(buyChargesOut) });
  }

  return { closed, chargesPaid: chargesPaid.toDecimalPlaces(2).toNumber() };
}

export function summarizeClosed(closed: ClosedTrade[]) {
  const wins = closed.filter((c) => c.pnl > 0).length;
  const byPnl = [...closed].sort((a, b) => b.pnl - a.pnl);
  return {
    realizedPnl: Math.round(closed.reduce((s, c) => s + c.pnl, 0) * 100) / 100,
    closedTrades: closed.length,
    wins,
    winRate: closed.length ? Math.round((wins / closed.length) * 1000) / 10 : null,
    best: byPnl[0] ?? null,
    worst: byPnl.length > 1 ? byPnl[byPnl.length - 1] : null,
  };
}

// IST calendar date (YYYY-MM-DD) of an instant.
export function istDate(date: Date): string {
  return new Date(date.getTime() + 5.5 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

// NIFTY 50's % change since the season started, overall and at each curve
// date. Base is the last daily close before the season began (Friday's).
async function benchmarkSince(seasonStart: Date, dates: string[]): Promise<{ returnPct: number; series: (number | null)[] } | null> {
  try {
    const chart = await getChart(BENCHMARK_SYMBOL, "1M");
    const closes = chart.candles.map((c) => ({ date: istDate(new Date(c.time * 1000)), close: c.close }));
    const startDate = istDate(seasonStart);
    const base = [...closes].reverse().find((c) => c.date < startDate)?.close;
    const latest = chart.price ?? closes[closes.length - 1]?.close;
    if (!base || !latest) return null;
    const pct = (v: number) => Math.round(((v - base) / base) * 10000) / 100;
    const series = dates.map((d) => {
      const onOrBefore = [...closes].reverse().find((c) => c.date <= d);
      return onOrBefore ? pct(onOrBefore.close) : null;
    });
    return { returnPct: pct(latest), series };
  } catch (error) {
    logger.warn({ err: error }, "Benchmark chart unavailable");
    return null;
  }
}

export async function getPortfolioAnalytics(userId: string, now: Date = new Date()): Promise<PortfolioAnalytics> {
  const seasonStart = getMostRecentMonday(now);

  const [wallet, holdings, trades, dailies] = await Promise.all([
    prisma.wallet.findUnique({ where: { userId }, select: { balance: true } }),
    prisma.holding.findMany({ where: { userId }, select: { symbol: true, quantity: true, avgBuyPrice: true } }),
    prisma.transaction.findMany({
      where: { userId, createdAt: { gte: seasonStart } },
      select: { id: true, symbol: true, side: true, quantity: true, price: true, total: true, charges: true, note: true, createdAt: true },
    }),
    prisma.dailySnapshot.findMany({ where: { userId, date: { gte: seasonStart } }, orderBy: { date: "asc" } }),
  ]);

  const cash = wallet?.balance.toNumber() ?? 0;
  const quotes = holdings.length ? await getQuotes(holdings.map((h) => h.symbol)) : {};

  const sectorValues = new Map<string, number>();
  let holdingsValue = 0;
  for (const h of holdings) {
    const price = quotes[h.symbol]?.price ?? h.avgBuyPrice.toNumber();
    const value = price * h.quantity;
    holdingsValue += value;
    const sector = sectorOf(h.symbol);
    sectorValues.set(sector, (sectorValues.get(sector) ?? 0) + value);
  }
  const netWorth = Math.round((cash + holdingsValue) * 100) / 100;

  const today = istDate(now);
  const curve = [
    { date: istDate(seasonStart), netWorth: STARTING_BALANCE },
    ...dailies.map((d) => ({ date: istDate(d.date), netWorth: d.netWorth.toNumber() })).filter((d) => d.date !== today),
    { date: today, netWorth },
  ];
  // Snapshot dates are stored as UTC midnight of the IST date; istDate() of
  // that shifts forward 5:30 but stays on the same day.
  const benchmark = await benchmarkSince(seasonStart, curve.map((p) => p.date));

  const { closed, chargesPaid } = replayTrades(trades);

  return {
    seasonStart: seasonStart.toISOString(),
    startBalance: STARTING_BALANCE,
    netWorth,
    returnPct: Math.round(((netWorth - STARTING_BALANCE) / STARTING_BALANCE) * 10000) / 100,
    benchmark: benchmark ? { name: "NIFTY 50", returnPct: benchmark.returnPct } : null,
    equityCurve: curve.map((p, i) => ({
      date: p.date,
      netWorth: p.netWorth,
      returnPct: Math.round(((p.netWorth - STARTING_BALANCE) / STARTING_BALANCE) * 10000) / 100,
      benchmarkPct: benchmark?.series[i] ?? null,
    })),
    allocation: [
      ...[...sectorValues.entries()].map(([sector, value]) => ({ sector, value: Math.round(value * 100) / 100 })).sort((a, b) => b.value - a.value),
      ...(cash > 0 ? [{ sector: "Cash", value: cash }] : []),
    ],
    trades: { ...summarizeClosed(closed), chargesPaid, recent: [...closed].reverse().slice(0, 10) },
  };
}

// Records every player's net worth at today's close (jobs/dailySnapshot.ts).
// Idempotent per day, so a re-run just skips players already recorded.
export async function recordDailySnapshots(now: Date = new Date()): Promise<number> {
  const worths = await computeNetWorths();
  const date = new Date(`${istDate(now)}T00:00:00Z`);
  const { count } = await prisma.dailySnapshot.createMany({
    data: [...worths.entries()].map(([userId, netWorth]) => ({ userId, date, netWorth: netWorth.toDecimalPlaces(2) })),
    skipDuplicates: true,
  });
  return count;
}
