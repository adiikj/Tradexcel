import fetch from 'node-fetch';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getQuote } from '../services/pricing.js';

import { Request, Response, NextFunction } from 'express';

const getStockData = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { symbol } = req.params;
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=30d&interval=1d`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            return next(new ApiError(500, `Error fetching data from Yahoo Finance ${symbol}`));
        }

        const data: any = await response.json();
        if (!data?.chart?.result || data.chart.result.length === 0) {
            return next(new ApiError(404, 'Stock data not found or invalid symbol'));
        }

        const stockData = data.chart.result[0];
        const timestamps = stockData.timestamp || [];
        const adjClosePrices = stockData.indicators?.adjclose[0]?.adjclose || [];

        if (!timestamps.length || !adjClosePrices.length) {
            return next(new ApiError(404, 'Insufficient data for stock chart'));
        }

        const dataLimit = Math.min(timestamps.length, 30);
        const slicedAdjClosePrices = adjClosePrices.slice(-dataLimit);
        const slicedTimestamps = timestamps.slice(-dataLimit);
        const dates = slicedTimestamps.map((ts: number) =>
            new Date(ts * 1000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
        );

        // Live price/change come from the cached pricing service, not this chart payload.
        let todayChange: number | null = null;
        let percentageChange: number | null = null;
        let currentPrice: number | null = stockData.meta?.regularMarketPrice ?? null;

        try {
            const quote = await getQuote(String(symbol));
            currentPrice = quote.price;
            todayChange = quote.change;
            percentageChange = quote.changePercent !== null ? Number(quote.changePercent.toFixed(2)) : null;
        } catch (quoteError: any) {
            // Falls back to chart meta above.
        }

       const formattedTodayChange = todayChange !== null ? `${todayChange >= 0 ? '+' : ''}${todayChange.toFixed(2)}` : 'NA';
       const formattedPercentageChange = percentageChange !== null ? Math.abs(percentageChange).toFixed(2) : 'NA';

        const result = {
            currentPrice,
            percentageChange: formattedPercentageChange,
            todayChange: formattedTodayChange,
            stockPrices: slicedAdjClosePrices,
            dates,
        };

        const responseData = new ApiResponse(200, 'Stock data fetched successfully', result);
        return res.status(responseData.status as number).json(responseData);

    } catch (error: any) {
        return next(new ApiError(500, 'Internal Server Error'));
    }
});

export default { getStockData };
