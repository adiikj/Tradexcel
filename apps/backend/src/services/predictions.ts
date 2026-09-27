import { Prisma, type PredictionDirection } from "@prisma/client";
import type { PredictionData } from "@tradexcel/shared";
import prisma from "../db/prisma.js";
import { ApiError } from "../utils/ApiError.js";
import logger from "../utils/logger.js";
import { getChart } from "./chart.js";
import { getNextMarketOpen, isMarketOpen, MARKET_OPEN_MINUTES } from "./marketHours.js";
import { BENCHMARK_SYMBOL, istDate } from "./analytics.js";

// The daily call: guess whether NIFTY 50 closes up or down on the next
// trading day. Calls lock when that session opens and are marked right or
// wrong after it closes (jobs/predictions.ts). Just for fun and streaks;
// nothing here touches money.

// The IST trading day a call placed now is about: today if the market
// hasn't opened yet, otherwise the next session.
export function targetDate(now: Date = new Date()): string {
  const ist = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
  const minutes = ist.getUTCHours() * 60 + ist.getUTCMinutes();
  const weekday = ist.getUTCDay() >= 1 && ist.getUTCDay() <= 5;
  if (weekday && minutes < MARKET_OPEN_MINUTES) return istDate(now);
  return istDate(getNextMarketOpen(now));
}

const asDate = (iso: string) => new Date(`${iso}T00:00:00Z`);

// Current streak of correct calls (most recent first), and the best ever.
// Flat days (correct = null) neither extend nor break a streak.
export function streaks(resolved: { correct: boolean | null }[]): { current: number; best: number } {
  const decided = resolved.filter((r) => r.correct !== null);
  let current = 0;
  for (const r of decided) {
    if (!r.correct) break;
    current += 1;
  }
  let best = 0;
  let run = 0;
  for (const r of [...decided].reverse()) {
    run = r.correct ? run + 1 : 0;
    best = Math.max(best, run);
  }
  return { current, best };
}

export async function getPredictions(userId: string, now: Date = new Date()): Promise<PredictionData> {
  const date = targetDate(now);
  const [mine, history, crowd] = await Promise.all([
    prisma.prediction.findUnique({ where: { userId_date: { userId, date: asDate(date) } } }),
    prisma.prediction.findMany({ where: { userId, resolved: true }, orderBy: { date: "desc" }, take: 60 }),
    prisma.prediction.groupBy({ by: ["direction"], where: { date: asDate(date) }, _count: true }),
  ]);
  const decided = history.filter((h) => h.correct !== null);
  const { current, best } = streaks(history);
  const up = crowd.find((c) => c.direction === "UP")?._count ?? 0;
  const down = crowd.find((c) => c.direction === "DOWN")?._count ?? 0;

  return {
    date,
    pick: mine?.direction ?? null,
    crowd: { up, down },
    stats: {
      calls: decided.length,
      correct: decided.filter((h) => h.correct).length,
      currentStreak: current,
      bestStreak: best,
    },
    recent: history.slice(0, 7).map((h) => ({ date: h.date.toISOString().slice(0, 10), direction: h.direction, correct: h.correct })),
  };
}

// Makes or changes the call for the next session. Once that session has
// opened, the call is locked.
export async function makePrediction(userId: string, direction: PredictionDirection, now: Date = new Date()) {
  const date = targetDate(now);
  if (isMarketOpen(now) && date === istDate(now)) {
    throw new ApiError(400, "Today's session has started, so today's call is locked.");
  }
  await prisma.prediction.upsert({
    where: { userId_date: { userId, date: asDate(date) } },
    create: { userId, date: asDate(date), direction },
    update: { direction },
  });
  return getPredictions(userId, now);
}

// Marks every unresolved call whose day has closed. Uses NIFTY's daily
// closes, so a day missed while the server was down is still settled later.
export async function resolvePredictions(now: Date = new Date()): Promise<number> {
  const today = istDate(now);
  const closedToday = !isMarketOpen(now) && new Date(now.getTime() + 5.5 * 3600_000).getUTCHours() >= 15;
  const pending = await prisma.prediction.findMany({
    where: { resolved: false, date: { lte: asDate(today) } },
    select: { id: true, date: true, direction: true },
  });
  const due = pending.filter((p) => p.date.toISOString().slice(0, 10) < today || closedToday);
  if (due.length === 0) return 0;

  let closes: { date: string; close: number }[];
  try {
    const chart = await getChart(BENCHMARK_SYMBOL, "1M");
    closes = chart.candles.map((c) => ({ date: istDate(new Date(c.time * 1000)), close: c.close }));
  } catch (error) {
    logger.warn({ err: error }, "Couldn't load NIFTY closes to resolve predictions");
    return 0;
  }

  let resolved = 0;
  const byDate = new Map<string, typeof due>();
  for (const p of due) {
    const key = p.date.toISOString().slice(0, 10);
    byDate.set(key, [...(byDate.get(key) ?? []), p]);
  }
  for (const [date, calls] of byDate) {
    const i = closes.findIndex((c) => c.date === date);
    // No bar for that date: a market holiday. Void the calls.
    if (i === -1) {
      if (date < today) {
        await prisma.prediction.updateMany({ where: { id: { in: calls.map((c) => c.id) } }, data: { resolved: true, correct: null } });
        resolved += calls.length;
      }
      continue;
    }
    if (i === 0) continue; // no previous close in the window
    const close = closes[i].close;
    const change = close - closes[i - 1].close;
    const outcome: PredictionDirection | null = change > 0 ? "UP" : change < 0 ? "DOWN" : null;
    for (const direction of ["UP", "DOWN"] as const) {
      const ids = calls.filter((c) => c.direction === direction).map((c) => c.id);
      if (ids.length === 0) continue;
      await prisma.prediction.updateMany({
        where: { id: { in: ids } },
        data: { resolved: true, correct: outcome === null ? null : outcome === direction, indexClose: new Prisma.Decimal(close).toDecimalPlaces(2) },
      });
      resolved += ids.length;
    }
  }
  return resolved;
}
