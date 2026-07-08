import fetch from "node-fetch";
import type { Quote } from "@tradexcel/shared";
import { ApiError } from "../utils/ApiError.js";
import { isMarketOpen } from "./marketHours.js";

const CACHE_TTL_MS = 12_000;
// Once the market's closed the price can't have moved, so there's no reason
// to re-hit Yahoo every 12s - hold the last-fetched (closing) quote much longer.
const CLOSED_MARKET_CACHE_TTL_MS = 30 * 60 * 1000;
const cache = new Map<string, { quote: Quote; expiresAt: number }>();

async function fetchQuote(symbol: string): Promise<Quote> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=1d&interval=1m`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Yahoo Finance error for ${symbol}: ${response.statusText}`);
  }

  const data: any = await response.json();
  const result = data?.chart?.result?.[0];
  const meta = result?.meta;
  const price = meta?.regularMarketPrice;

  if (typeof price !== "number") {
    throw new Error(`No live price available for ${symbol}`);
  }

  const previousClose: number | null = meta.previousClose ?? meta.chartPreviousClose ?? null;
  const change = previousClose != null ? price - previousClose : null;
  const changePercent = change != null && previousClose ? (change / previousClose) * 100 : null;

  return {
    symbol: meta.symbol ?? symbol.toUpperCase(),
    price,
    previousClose,
    change,
    changePercent,
    currency: meta.currency ?? null,
    timestamp: Date.now(),
  };
}

// Serves from an in-memory cache when possible; Yahoo rate-limits aggressively.
export async function getQuote(symbol: string): Promise<Quote> {
  const key = symbol.toUpperCase();
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.quote;
  }

  const quote = await fetchQuote(key);
  const ttl = isMarketOpen() ? CACHE_TTL_MS : CLOSED_MARKET_CACHE_TTL_MS;
  cache.set(key, { quote, expiresAt: Date.now() + ttl });
  return quote;
}

// Fetches quotes for multiple symbols in parallel. Symbols that fail to
// resolve map to null rather than failing the whole batch.
export async function getQuotes(symbols: string[]): Promise<Record<string, Quote | null>> {
  const uniqueSymbols = [...new Set(symbols.map((s) => s.toUpperCase()))];

  const results = await Promise.all(
    uniqueSymbols.map(async (symbol) => {
      try {
        return [symbol, await getQuote(symbol)] as const;
      } catch (error: any) {
        console.error(`Failed to fetch quote for ${symbol}:`, error.message);
        return [symbol, null] as const;
      }
    })
  );

  return Object.fromEntries(results);
}

// Shared 404-on-no-price wrapper used by both trade controllers.
export async function fetchQuoteOrThrow(symbol: string): Promise<Quote> {
  try {
    return await getQuote(symbol);
  } catch (error: any) {
    throw new ApiError(404, `No live price available for ${symbol}`);
  }
}
