// routes/financeRoutes.js
import express from 'express';
import financeController from '../controllers/finance.controller.js';
import { publicApiLimiter } from '../middlewares/rateLimit.middleware.js';

const router = express.Router();

// Define route to fetch stock data by symbol
router.get('/stock/:symbol', publicApiLimiter, financeController.getStockData);
// Batched lookup - one request for many symbols (see Market.tsx / dashboard movers).
router.get('/quotes', publicApiLimiter, financeController.getBatchStockData);

export default router;
