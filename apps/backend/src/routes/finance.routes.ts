// routes/financeRoutes.js
import express from 'express';
import financeController from '../controllers/finance.controller.js';
import { publicApiLimiter } from '../middlewares/rateLimit.middleware.js';

const router = express.Router();

// Define route to fetch stock data by symbol
router.get('/stock/:symbol', publicApiLimiter, financeController.getStockData);
// Batched lookup - one request for many symbols (see Market.tsx / dashboard movers).
router.get('/quotes', publicApiLimiter, financeController.getBatchStockData);
// OHLCV candles for one symbol over a preset range (1D, 5D, 1M, 6M, 1Y, 5Y).
router.get('/chart/:symbol', publicApiLimiter, financeController.getChartData);

export default router;
