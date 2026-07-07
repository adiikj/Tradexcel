import { Prisma } from "@prisma/client";
import prisma from "../db/prisma.js";
import { fetchQuoteOrThrow, getQuotes } from "./pricing.js";
import { resolveSimulatedDate } from "./contestClock.js";
import { ApiError } from "../utils/ApiError.js";

type ContestForPricing = { startAt: Date; historicalDates: Date[] };

// Historical close for a replay contest, otherwise today's live quote.
export async function resolveContestPrice(contest: ContestForPricing, symbol: string): Promise<Prisma.Decimal> {
  const simulatedDate = resolveSimulatedDate(contest);
  if (!simulatedDate) {
    const quote = await fetchQuoteOrThrow(symbol);
    return new Prisma.Decimal(quote.price);
  }

  const row = await prisma.contestHistoricalPrice.findUnique({
    where: { symbol_date: { symbol, date: simulatedDate } },
  });
  if (!row) {
    throw new ApiError(404, `No historical price for ${symbol} on ${simulatedDate.toISOString().slice(0, 10)}`);
  }
  return row.close;
}

// Shape matches tradeMath.ts's calculateHoldingsValue expectations.
export async function resolveContestQuotes(
  contest: ContestForPricing,
  symbols: string[]
): Promise<Record<string, { price: number } | null>> {
  if (symbols.length === 0) return {};

  const simulatedDate = resolveSimulatedDate(contest);
  if (!simulatedDate) {
    return getQuotes(symbols);
  }

  const rows = await prisma.contestHistoricalPrice.findMany({
    where: { symbol: { in: symbols }, date: simulatedDate },
  });
  const closesBySymbol = new Map(rows.map((r) => [r.symbol, r.close.toNumber()]));
  return Object.fromEntries(
    symbols.map((symbol) => [symbol, closesBySymbol.has(symbol) ? { price: closesBySymbol.get(symbol)! } : null])
  );
}
