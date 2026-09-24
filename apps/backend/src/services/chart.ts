import fetch from "node-fetch";
import type { Candle, ChartData, ChartRange } from "@tradexcel/shared";
import { ApiError } from "../utils/ApiError.js";
import { isMarketOpen } from "./marketHours.js";

// Candle interval per range - fine enough to read, few enough bars to send.
export const RANGE_PARAMS: Record<ChartRange, { range: string; interval: string }> = {
  "1D": { range: "1d", interval: "5m" },
  "5D": { range: "5d", interval: "30m" },
  "1M": { range: "1mo", interval: "1d" },
  "6M": { range: "6mo", interval: "1d" },
  "1Y": { range: "1y", interval: "1d" },
  "5Y": { range: "5y", interval: "1wk" },
};

const INTRADAY_TTL_MS = 60_000;
const DAILY_TTL_MS = 15 * 60_000;
const CLOSED_MARKET_TTL_MS = 30 * 60_000;
const cache = new Map<string, { data: ChartData; expiresAt: number }>();

type YahooChartResult = {
  meta?: Record<string, unknown>;
  timestamp?: number[];
  indicators?: {
    quote?: { open?: (number | null)[]; high?: (number | null)[]; low?: (number | null)[]; close?: (number | null)[]; volume?: (number | null)[] }[];
  };
};

const num = (value: unknown): number | null => (typeof value === "number" && Number.isFinite(value) ? value : null);

// Yahoo leaves nulls where trading paused; those bars are dropped rather than
// drawn at zero.
export function toCandles(result: YahooChartResult): Candle[] {
  const timestamps = result.timestamp ?? [];
  const q = result.indicators?.quote?.[0] ?? {};
  const candles: Candle[] = [];
  timestamps.forEach((time, i) => {
    const open = q.open?.[i];
    const high = q.high?.[i];
    const low = q.low?.[i];
    const close = q.close?.[i];
    if (open == null || high == null || low == null || close == null) return;
    candles.push({ time, open, high, low, close, volume: q.volume?.[i] ?? 0 });
  });
  return candles;
}

// On daily+ ranges Yahoo leaves today's bar empty until the session is final,
// so the chart would stop at yesterday. Fill that last bar from the live
// session stats in `meta`.
export function completeLastBar(result: YahooChartResult, candles: Candle[]): Candle[] {
  const timestamps = result.timestamp ?? [];
  const lastTime = timestamps[timestamps.length - 1];
  const meta = result.meta ?? {};
  const price = num(meta.regularMarketPrice);
  if (lastTime == null || price == null || candles[candles.length - 1]?.time === lastTime) return candles;

  const i = timestamps.length - 1;
  const q = result.indicators?.quote?.[0] ?? {};
  const open = q.open?.[i] ?? candles[candles.length - 1]?.close ?? price;
  const high = Math.max(num(meta.regularMarketDayHigh) ?? price, open, price);
  const low = Math.min(num(meta.regularMarketDayLow) ?? price, open, price);
  return [...candles, { time: lastTime, open, high, low, close: price, volume: num(meta.regularMarketVolume) ?? 0 }];
}

export async function getChart(symbol: string, range: ChartRange): Promise<ChartData> {
  const key = `${symbol}:${range}`;
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.data;

  const params = RANGE_PARAMS[range];
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${params.range}&interval=${params.interval}`;
  const response = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!response.ok) {
    throw new ApiError(response.status === 404 ? 404 : 502, `Could not load chart for ${symbol}`);
  }

  const body = (await response.json()) as { chart?: { result?: YahooChartResult[] } };
  const result = body.chart?.result?.[0];
  if (!result) throw new ApiError(404, "Chart data isn't available for this stock right now.");

  const meta = result.meta ?? {};
  const intradayRange = range === "1D" || range === "5D";
  const candles = intradayRange ? toCandles(result) : completeLastBar(result, toCandles(result));
  const data: ChartData = {
    symbol,
    range,
    interval: params.interval,
    currency: typeof meta.currency === "string" ? meta.currency : null,
    exchange: typeof meta.exchangeName === "string" ? meta.exchangeName : null,
    name: typeof meta.longName === "string" ? meta.longName : typeof meta.shortName === "string" ? meta.shortName : null,
    gmtOffset: num(meta.gmtoffset) ?? 0,
    price: num(meta.regularMarketPrice),
    // `previousClose` is only set on intraday ranges; chartPreviousClose is the
    // close before the *chart's* first bar, which is what a daily chart wants.
    previousClose: num(meta.previousClose) ?? num(meta.chartPreviousClose),
    dayHigh: num(meta.regularMarketDayHigh),
    dayLow: num(meta.regularMarketDayLow),
    fiftyTwoWeekHigh: num(meta.fiftyTwoWeekHigh),
    fiftyTwoWeekLow: num(meta.fiftyTwoWeekLow),
    volume: num(meta.regularMarketVolume),
    candles,
  };

  const intraday = range === "1D" || range === "5D";
  const ttl = !isMarketOpen() ? CLOSED_MARKET_TTL_MS : intraday ? INTRADAY_TTL_MS : DAILY_TTL_MS;
  cache.set(key, { data, expiresAt: Date.now() + ttl });
  return data;
}
