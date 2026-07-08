import fetch from 'node-fetch';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getQuote } from '../services/pricing.js';

import { Request, Response, NextFunction } from 'express';

// Also reused by the realtime price socket as the per-connection subscription cap.
export const MAX_BATCH_SYMBOLS = 300;

interface StockChartResult {
    currentPrice: number | null;
    percentageChange: string;
    todayChange: string;
    stockPrices: number[];
    dates: string[];
}

// Shared by the single-symbol and batch endpoints: pulls 30 days of chart
// history from Yahoo, then overlays the live price/change from the cached
// pricing service (falling back to chart meta if that fails).
async function fetchStockChartData(symbol: string): Promise<StockChartResult> {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=30d&interval=1d`;
    const response = await fetch(url);
    if (!response.ok) {
        throw new ApiError(500, `Error fetching data from Yahoo Finance ${symbol}`);
    }

    const data: any = await response.json();
    if (!data?.chart?.result || data.chart.result.length === 0) {
        throw new ApiError(404, 'Stock data not found or invalid symbol');
    }

    const stockData = data.chart.result[0];
    const timestamps = stockData.timestamp || [];
    const adjClosePrices = stockData.indicators?.adjclose[0]?.adjclose || [];

    if (!timestamps.length || !adjClosePrices.length) {
        throw new ApiError(404, 'Insufficient data for stock chart');
    }

    const dataLimit = Math.min(timestamps.length, 30);
    const slicedAdjClosePrices = adjClosePrices.slice(-dataLimit);
    const slicedTimestamps = timestamps.slice(-dataLimit);
    const dates = slicedTimestamps.map((ts: number) =>
        new Date(ts * 1000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    );

    let todayChange: number | null = null;
    let percentageChange: number | null = null;
    let currentPrice: number | null = stockData.meta?.regularMarketPrice ?? null;

    try {
        const quote = await getQuote(String(symbol));
        currentPrice = quote.price;
        todayChange = quote.change;
        percentageChange = quote.changePercent !== null ? Number(quote.changePercent.toFixed(2)) : null;
    } catch {
        // Falls back to chart meta above.
    }

    return {
        currentPrice,
        percentageChange: percentageChange !== null ? Math.abs(percentageChange).toFixed(2) : 'NA',
        todayChange: todayChange !== null ? `${todayChange >= 0 ? '+' : ''}${todayChange.toFixed(2)}` : 'NA',
        stockPrices: slicedAdjClosePrices,
        dates,
    };
}

const getStockData = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { symbol } = req.params;

    try {
        const result = await fetchStockChartData(String(symbol));
        const responseData = new ApiResponse(200, 'Stock data fetched successfully', result);
        return res.status(responseData.status as number).json(responseData);
    } catch (error: any) {
        if (error instanceof ApiError) return next(error);
        return next(new ApiError(500, 'Internal Server Error'));
    }
});

// One client request fans out to N Yahoo lookups server-side instead of the
// client making N requests to us - lets the public rate limit on this route
// stay meaningfully tight regardless of how many symbols a page needs.
const getBatchStockData = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const raw = String(req.query.symbols || '');
    const symbols = [...new Set(raw.split(',').map((s) => s.trim()).filter(Boolean))];

    if (symbols.length === 0) {
        return next(new ApiError(400, 'symbols query parameter is required'));
    }
    if (symbols.length > MAX_BATCH_SYMBOLS) {
        return next(new ApiError(400, `Too many symbols requested (max ${MAX_BATCH_SYMBOLS})`));
    }

    const entries = await Promise.all(
        symbols.map(async (symbol) => {
            try {
                return [symbol, await fetchStockChartData(symbol)] as const;
            } catch {
                return [symbol, null] as const;
            }
        })
    );

    const result = Object.fromEntries(entries);
    const responseData = new ApiResponse(200, 'Stock data fetched successfully', result);
    return res.status(responseData.status as number).json(responseData);
});

export default { getStockData, getBatchStockData };
