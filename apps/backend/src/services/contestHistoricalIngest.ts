import prisma from "../db/prisma.js";
import { fetchHistoricalCloses, type HistoricalClose } from "./historicalPricing.js";

const MS_PER_DAY = 86_400_000;

// Resolves the N historical trading dates for a replay contest and caches
// every symbol's close for those dates. symbols[0] sets the reference calendar.
export async function ingestContestHistory(
  symbols: string[],
  historicalStartDate: Date,
  numDays: number
): Promise<Date[]> {
  const bufferDays = Math.ceil(numDays * 2.5) + 5;
  const period1 = historicalStartDate;
  const period2 = new Date(historicalStartDate.getTime() + bufferDays * MS_PER_DAY);

  const referenceBars = await fetchHistoricalCloses(symbols[0], period1, period2).catch(() => []);
  const resolvedDates = referenceBars
    .map((bar) => bar.date)
    .sort((a, b) => a.getTime() - b.getTime())
    .slice(0, numDays);

  if (resolvedDates.length === 0) {
    return [];
  }

  const dateKeys = new Set(resolvedDates.map((d) => d.getTime()));

  const allBars = await Promise.all(
    symbols.map(async (symbol, index) => {
      if (index === 0) return { symbol, bars: referenceBars };
      try {
        return { symbol, bars: await fetchHistoricalCloses(symbol, period1, period2) };
      } catch (error: any) {
        console.error(`Historical fetch failed for ${symbol}:`, error.message);
        return { symbol, bars: [] as HistoricalClose[] };
      }
    })
  );

  const rows = allBars.flatMap(({ symbol, bars }) =>
    bars.filter((bar) => dateKeys.has(bar.date.getTime())).map((bar) => ({ symbol, date: bar.date, close: bar.close }))
  );

  if (rows.length > 0) {
    await prisma.$transaction(
      rows.map((row) =>
        prisma.contestHistoricalPrice.upsert({
          where: { symbol_date: { symbol: row.symbol, date: row.date } },
          update: { close: row.close },
          create: row,
        })
      )
    );
  }

  return resolvedDates;
}
