import fetch from "node-fetch";

export interface HistoricalClose {
  date: Date;
  close: number;
}

// Yahoo timestamps are exchange-local; convert using the exchange's own
// timezone, not the server's, to avoid shifting the calendar date.
function toExchangeCalendarDate(unixSeconds: number, timeZone: string): Date {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const isoDate = formatter.format(new Date(unixSeconds * 1000));
  return new Date(`${isoDate}T00:00:00.000Z`);
}

// Uses raw `close`, not `adjclose`, to match the live quote endpoint's regularMarketPrice.
export async function fetchHistoricalCloses(
  symbol: string,
  period1: Date,
  period2: Date
): Promise<HistoricalClose[]> {
  const url =
    `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}` +
    `?period1=${Math.floor(period1.getTime() / 1000)}` +
    `&period2=${Math.floor(period2.getTime() / 1000)}` +
    `&interval=1d`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Yahoo Finance historical error for ${symbol}: ${response.statusText}`);
  }

  const data: any = await response.json();
  const result = data?.chart?.result?.[0];
  const timestamps: number[] = result?.timestamp ?? [];
  const closes: (number | null)[] = result?.indicators?.quote?.[0]?.close ?? [];
  const timeZone: string = result?.meta?.exchangeTimezoneName || "Asia/Kolkata";

  const bars: HistoricalClose[] = [];
  for (let i = 0; i < timestamps.length; i++) {
    const close = closes[i];
    if (typeof close !== "number") continue;
    bars.push({ date: toExchangeCalendarDate(timestamps[i], timeZone), close });
  }

  return bars;
}
