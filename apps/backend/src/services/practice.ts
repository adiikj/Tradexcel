import { Prisma, type Side } from "@prisma/client";
import type { PracticeScenario, PracticeState } from "@tradexcel/shared";
import prisma from "../db/prisma.js";
import { ApiError } from "../utils/ApiError.js";
import { ingestContestHistory } from "./contestHistoricalIngest.js";
import { computeCharges } from "./charges.js";
import { canAfford, canSell, computeWeightedAvgPrice, STARTING_BALANCE } from "./tradeMath.js";

// Practice runs: replay a real market episode one trading day at a time, at
// your own pace. Trades fill at the day's close (with the same simulated
// charges as the main wallet). Separate from the wallet, contests and every
// leaderboard - nothing here counts, which is the point.

type ScenarioDef = PracticeScenario & { startDate: string };

export const SCENARIOS: ScenarioDef[] = [
  {
    id: "covid_crash_2020",
    title: "The COVID crash",
    period: "Feb – Mar 2020",
    blurb: "Markets fell about 38% in five weeks as lockdowns spread. Can you protect your capital, or even find bargains?",
    lesson: "Crashes are when position sizing and stop-losses matter most. Cash is a position too.",
    startDate: "2020-02-17",
    days: 25,
    symbols: [
      "RELIANCE.NS", "TCS.NS", "INFY.NS", "HDFCBANK.NS", "ICICIBANK.NS", "SBIN.NS", "ITC.NS", "HINDUNILVR.NS",
      "BHARTIARTL.NS", "MARUTI.NS", "SUNPHARMA.NS", "DRREDDY.NS", "CIPLA.NS", "BAJFINANCE.NS", "TATASTEEL.NS",
      "INDIGO.NS", "TITAN.NS", "ASIANPAINT.NS", "LT.NS", "AXISBANK.NS",
    ],
  },
  {
    id: "rebound_2020",
    title: "The 2020 rebound",
    period: "Mar – May 2020",
    blurb: "From the bottom on 24 March, the market climbed back fast. Which sectors led, and did you have the nerve to buy?",
    lesson: "Recoveries often start when the news still looks bad. Pharma and IT led this one.",
    startDate: "2020-03-24",
    days: 30,
    symbols: [
      "RELIANCE.NS", "TCS.NS", "INFY.NS", "HCLTECH.NS", "WIPRO.NS", "HDFCBANK.NS", "ICICIBANK.NS", "BAJFINANCE.NS",
      "SUNPHARMA.NS", "DRREDDY.NS", "CIPLA.NS", "DIVISLAB.NS", "HINDUNILVR.NS", "NESTLEIND.NS", "ITC.NS", "BHARTIARTL.NS",
      "MARUTI.NS", "TATASTEEL.NS", "INDIGO.NS", "DMART.NS",
    ],
  },
  {
    id: "adani_2023",
    title: "The Adani short report",
    period: "Jan – Feb 2023",
    blurb: "A short-seller's report hit the Adani group on 24 January. Some stocks lost more than half their value within weeks.",
    lesson: "Concentration risk: one piece of news can hit a whole group of related stocks at once.",
    startDate: "2023-01-20",
    days: 20,
    symbols: [
      "ADANIENT.NS", "ADANIPORTS.NS", "ADANIGREEN.NS", "ADANIPOWER.NS", "ATGL.NS", "AMBUJACEM.NS", "ACC.NS",
      "SBIN.NS", "LT.NS", "RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "ITC.NS", "ULTRACEMCO.NS",
    ],
  },
  {
    id: "election_2024",
    title: "Election results day",
    period: "May – Jun 2024",
    blurb: "Exit polls sent stocks to record highs, then results day on 4 June brought one of the sharpest one-day falls in years, and a quick recovery.",
    lesson: "Big scheduled events cut both ways. Betting everything on one outcome is a gamble, not a plan.",
    startDate: "2024-05-27",
    days: 15,
    symbols: [
      "SBIN.NS", "NTPC.NS", "POWERGRID.NS", "COALINDIA.NS", "ONGC.NS", "BEL.NS", "HAL.NS", "LT.NS", "ADANIPORTS.NS",
      "ADANIENT.NS", "RELIANCE.NS", "TCS.NS", "INFY.NS", "HDFCBANK.NS", "ICICIBANK.NS", "ITC.NS", "HINDUNILVR.NS", "RECLTD.NS",
    ],
  },
];

const SCENARIO_MAP = new Map(SCENARIOS.map((s) => [s.id, s]));

export function listScenarios(): PracticeScenario[] {
  return SCENARIOS.map(({ startDate: _startDate, ...rest }) => rest);
}

// Trading dates for a scenario. Reuses the shared historical cache when the
// reference stock's closes are already there; otherwise fetches and caches.
async function scenarioDates(scenario: ScenarioDef): Promise<Date[]> {
  const start = new Date(`${scenario.startDate}T00:00:00Z`);
  const cached = await prisma.contestHistoricalPrice.findMany({
    where: { symbol: scenario.symbols[0], date: { gte: start } },
    orderBy: { date: "asc" },
    take: scenario.days,
    select: { date: true },
  });
  const cachedAll =
    cached.length === scenario.days &&
    (await prisma.contestHistoricalPrice.count({ where: { symbol: { in: scenario.symbols }, date: cached[cached.length - 1].date } })) ===
      scenario.symbols.length;
  if (cachedAll) return cached.map((c) => c.date);

  const dates = await ingestContestHistory(scenario.symbols, start, scenario.days);
  if (dates.length === 0) throw new ApiError(502, "Couldn't load the price history for this scenario. Please try again later.");
  return dates;
}

// Closes for every scenario symbol on one date, as numbers.
async function closesOn(symbols: string[], date: Date): Promise<Map<string, number>> {
  const rows = await prisma.contestHistoricalPrice.findMany({ where: { symbol: { in: symbols }, date } });
  return new Map(rows.map((r) => [r.symbol, r.close.toNumber()]));
}

// Equal-weight buy-and-hold of the whole basket from day one: the "did you
// beat doing nothing clever?" yardstick.
export function basketReturnPct(first: Map<string, number>, current: Map<string, number>): number | null {
  const changes = [...first.entries()].flatMap(([symbol, start]) => {
    const now = current.get(symbol);
    return now != null && start > 0 ? [(now - start) / start] : [];
  });
  if (changes.length === 0) return null;
  return Math.round((changes.reduce((a, b) => a + b, 0) / changes.length) * 10000) / 100;
}

async function lockSession(tx: Prisma.TransactionClient, sessionId: string) {
  await tx.$queryRaw`SELECT "id" FROM "PracticeSession" WHERE "id" = ${sessionId} FOR UPDATE`;
}

async function ownSession(userId: string, sessionId: string) {
  const session = await prisma.practiceSession.findUnique({ where: { id: sessionId } });
  if (!session || session.userId !== userId) throw new ApiError(404, "Practice run not found");
  return session;
}

export async function getPracticeState(userId: string, sessionId: string): Promise<PracticeState> {
  const session = await prisma.practiceSession.findUnique({
    where: { id: sessionId },
    include: { holdings: true, trades: { orderBy: { createdAt: "desc" }, take: 20 } },
  });
  if (!session || session.userId !== userId) throw new ApiError(404, "Practice run not found");
  const scenario = SCENARIO_MAP.get(session.scenarioId);
  if (!scenario) throw new ApiError(404, "That scenario no longer exists");

  const date = session.dates[session.dayIndex];
  const [today, previous, first] = await Promise.all([
    closesOn(scenario.symbols, date),
    session.dayIndex > 0 ? closesOn(scenario.symbols, session.dates[session.dayIndex - 1]) : Promise.resolve(new Map<string, number>()),
    closesOn(scenario.symbols, session.dates[0]),
  ]);

  const holdings = session.holdings.map((h) => {
    const price = today.get(h.symbol) ?? h.avgBuyPrice.toNumber();
    const avg = h.avgBuyPrice.toNumber();
    return { symbol: h.symbol, quantity: h.quantity, avgBuyPrice: avg, price, value: price * h.quantity, pnl: (price - avg) * h.quantity };
  });
  const cash = session.balance.toNumber();
  const netWorth = Math.round((cash + holdings.reduce((s, h) => s + h.value, 0)) * 100) / 100;

  return {
    id: session.id,
    scenario: listScenarios().find((s) => s.id === scenario.id)!,
    status: session.status,
    day: session.dayIndex + 1,
    totalDays: session.dates.length,
    date: date.toISOString().slice(0, 10),
    cash,
    netWorth,
    returnPct: Math.round(((netWorth - STARTING_BALANCE) / STARTING_BALANCE) * 10000) / 100,
    basketReturnPct: basketReturnPct(first, today),
    stocks: scenario.symbols.map((symbol) => {
      const price = today.get(symbol) ?? null;
      const prev = previous.get(symbol);
      return { symbol, price, changePct: price != null && prev ? Math.round(((price - prev) / prev) * 10000) / 100 : null };
    }),
    holdings,
    trades: session.trades.map((t) => ({
      id: t.id,
      symbol: t.symbol,
      side: t.side,
      quantity: t.quantity,
      price: t.price.toNumber(),
      charges: t.charges.toNumber(),
      day: t.dayIndex + 1,
    })),
  };
}

// Starts a run of a scenario. Any run already in progress is finished as-is,
// so a player has at most one active run.
export async function startPractice(userId: string, scenarioId: string): Promise<string> {
  const scenario = SCENARIO_MAP.get(scenarioId);
  if (!scenario) throw new ApiError(404, "Unknown scenario");
  const dates = await scenarioDates(scenario);

  const session = await prisma.$transaction(async (tx) => {
    const active = await tx.practiceSession.findMany({ where: { userId, status: "ACTIVE" }, select: { id: true } });
    for (const s of active) {
      await tx.practiceSession.update({ where: { id: s.id }, data: { status: "FINISHED" } });
    }
    return tx.practiceSession.create({ data: { userId, scenarioId, dates, balance: STARTING_BALANCE } });
  });
  return session.id;
}

export async function currentPracticeId(userId: string): Promise<string | null> {
  const session = await prisma.practiceSession.findFirst({ where: { userId, status: "ACTIVE" }, orderBy: { createdAt: "desc" }, select: { id: true } });
  return session?.id ?? null;
}

export async function practiceTrade(userId: string, sessionId: string, side: Side, symbol: string, quantity: number) {
  const session = await ownSession(userId, sessionId);
  const scenario = SCENARIO_MAP.get(session.scenarioId);
  if (!scenario?.symbols.includes(symbol)) throw new ApiError(400, "That stock isn't part of this scenario");

  await prisma.$transaction(async (tx) => {
    await lockSession(tx, sessionId);
    const fresh = await tx.practiceSession.findUniqueOrThrow({ where: { id: sessionId } });
    if (fresh.status !== "ACTIVE") throw new ApiError(400, "This practice run has finished");

    const row = await tx.contestHistoricalPrice.findUnique({ where: { symbol_date: { symbol, date: fresh.dates[fresh.dayIndex] } } });
    if (!row) throw new ApiError(400, "There's no price for that stock on this day");
    const price = row.close;
    const total = price.mul(quantity);
    const charges = computeCharges(side, total).total;
    const holding = await tx.practiceHolding.findUnique({ where: { sessionId_symbol: { sessionId, symbol } } });

    if (side === "BUY") {
      if (!canAfford(total.add(charges), fresh.balance)) throw new ApiError(400, "Not enough cash for this trade and its charges");
      await tx.practiceSession.update({ where: { id: sessionId }, data: { balance: { decrement: total.add(charges) } } });
      if (holding) {
        await tx.practiceHolding.update({
          where: { id: holding.id },
          data: { quantity: holding.quantity + quantity, avgBuyPrice: computeWeightedAvgPrice(holding.quantity, holding.avgBuyPrice, quantity, total) },
        });
      } else {
        await tx.practiceHolding.create({ data: { sessionId, symbol, quantity, avgBuyPrice: price } });
      }
    } else {
      if (!holding || !canSell(quantity, holding.quantity)) throw new ApiError(400, "You don't hold that many shares");
      await tx.practiceSession.update({ where: { id: sessionId }, data: { balance: { increment: total.sub(charges) } } });
      if (holding.quantity === quantity) await tx.practiceHolding.delete({ where: { id: holding.id } });
      else await tx.practiceHolding.update({ where: { id: holding.id }, data: { quantity: holding.quantity - quantity } });
    }

    await tx.practiceTrade.create({ data: { sessionId, symbol, side, quantity, price, total, charges, dayIndex: fresh.dayIndex } });
  });
}

// Moves to the next trading day; past the last day the run finishes and its
// final net worth is recorded.
export async function advancePractice(userId: string, sessionId: string) {
  await ownSession(userId, sessionId);
  const finished = await prisma.$transaction(async (tx) => {
    await lockSession(tx, sessionId);
    const fresh = await tx.practiceSession.findUniqueOrThrow({ where: { id: sessionId } });
    if (fresh.status !== "ACTIVE") throw new ApiError(400, "This practice run has finished");
    if (fresh.dayIndex < fresh.dates.length - 1) {
      await tx.practiceSession.update({ where: { id: sessionId }, data: { dayIndex: fresh.dayIndex + 1 } });
      return false;
    }
    return true;
  });

  if (finished) {
    const state = await getPracticeState(userId, sessionId);
    await prisma.practiceSession.updateMany({
      where: { id: sessionId, status: "ACTIVE" },
      data: { status: "FINISHED", finalNetWorth: new Prisma.Decimal(state.netWorth) },
    });
  }
}

// Finished runs, newest first, for the Learn page.
export async function practiceHistory(userId: string) {
  const sessions = await prisma.practiceSession.findMany({
    where: { userId, status: "FINISHED", finalNetWorth: { not: null } },
    orderBy: { updatedAt: "desc" },
    take: 10,
    select: { id: true, scenarioId: true, finalNetWorth: true, updatedAt: true },
  });
  return sessions.map((s) => ({
    id: s.id,
    scenarioId: s.scenarioId,
    title: SCENARIO_MAP.get(s.scenarioId)?.title ?? s.scenarioId,
    returnPct: Math.round(((s.finalNetWorth!.toNumber() - STARTING_BALANCE) / STARTING_BALANCE) * 10000) / 100,
    finishedAt: s.updatedAt.toISOString(),
  }));
}
