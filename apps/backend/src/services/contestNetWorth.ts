import { Prisma } from "@prisma/client";
import prisma from "../db/prisma.js";
import { resolveContestQuotes } from "./contestPricing.js";
import { calculateHoldingsValue } from "./tradeMath.js";

export async function computeContestNetWorths(contestId: string): Promise<Map<string, Prisma.Decimal>> {
  const [contest, entries] = await Promise.all([
    prisma.contest.findUnique({ where: { id: contestId }, select: { startAt: true, historicalDates: true } }),
    prisma.contestEntry.findMany({
      where: { contestId },
      select: {
        id: true,
        balance: true,
        holdings: { select: { symbol: true, quantity: true, avgBuyPrice: true } },
      },
    }),
  ]);

  if (!contest) {
    return new Map();
  }

  const allSymbols = [...new Set(entries.flatMap((e) => e.holdings.map((h) => h.symbol)))];
  const quotes = await resolveContestQuotes(contest, allSymbols);

  const result = new Map<string, Prisma.Decimal>();
  for (const entry of entries) {
    const holdingsValue = calculateHoldingsValue(entry.holdings, quotes);
    result.set(entry.id, entry.balance.add(holdingsValue));
  }

  return result;
}
