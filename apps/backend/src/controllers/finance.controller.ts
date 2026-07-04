import fetch from 'node-fetch';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getQuote } from '../services/pricing.js';

import { Request, Response, NextFunction } from 'express';

const getStockData = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { symbol } = req.params;

    // Construct Yahoo Finance API URL for historical data (last 30 days)
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=30d&interval=1d`;

    try {
        const response = await fetch(url);

        if (!response.ok) {
            console.error(`Yahoo API Error: ${response.statusText}`);
            return next(new ApiError(500, `Error fetching data from Yahoo Finance ${symbol}`));
        }

        const data: any = await response.json();

        if (!data?.chart?.result || data.chart.result.length === 0) {
            console.error('No valid stock data received:', data);
            return next(new ApiError(404, 'Stock data not found or invalid symbol'));
        }

        // Extract the stock data from the response
        const stockData = data.chart.result[0];

        const timestamps = stockData.timestamp || [];
        const adjClosePrices = stockData.indicators?.adjclose[0]?.adjclose || [];

        // Check if timestamps or adjusted close prices are missing
        if (!timestamps.length || !adjClosePrices.length) {
            console.error('Timestamps or Adjusted Close prices are missing');
            return next(new ApiError(404, 'Insufficient data for stock chart'));
        }

        // Ensure we're only using the last 30 days of data
        const dataLimit = Math.min(timestamps.length, 30);
        const slicedAdjClosePrices = adjClosePrices.slice(-dataLimit);

        // Live price + change come from the shared pricing service (cached),
        // rather than re-deriving them from this 30-day chart payload.
        let todayChange: number | null = null;
        let percentageChange: number | null = null;
        let currentPrice: number | null = stockData.meta?.regularMarketPrice ?? null;

        try {
            const quote = await getQuote(String(symbol));
            currentPrice = quote.price;
            todayChange = quote.change;
            percentageChange = quote.changePercent !== null ? Number(quote.changePercent.toFixed(2)) : null;
        } catch (quoteError: any) {
            console.error(`Falling back to chart meta for ${symbol}:`, quoteError.message);
        }

       // Format todayChange and percentageChange
       const formattedTodayChange = todayChange !== null ? `${todayChange >= 0 ? '+' : ''}${todayChange.toFixed(2)}` : 'NA';
       const formattedPercentageChange = percentageChange !== null ? Math.abs(percentageChange).toFixed(2) : 'NA';


        // Prepare the result with the required fields
        const result = {
            currentPrice,
            percentageChange: formattedPercentageChange,
            todayChange: formattedTodayChange,
            stockPrices: slicedAdjClosePrices, // Historical adjusted close prices for the last 30 days
        };

        // Send the response data
        const responseData = new ApiResponse(200, 'Stock data fetched successfully', result);
        return res.status(responseData.status as number).json(responseData);

    } catch (error: any) {
        console.log(`Error fetching data from Yahoo Finance ${symbol}:`, error.message);
        return next(new ApiError(500, 'Internal Server Error'));
    }
});

export default { getStockData };
