import { Prisma } from "@prisma/client";
import { Response } from "express";
import { validationError } from "../utils/validation.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import prisma from "../db/prisma.js";
import { fetchQuoteOrThrow } from "../services/pricing.js";
import { tradeSchema } from "../services/tradeMath.js";
import { executeBuy, executeSell } from "../services/tradeExecution.js";
import { isMarketOpen } from "../services/marketHours.js";
import { queueOrder, cancelQueuedOrder, listQueuedOrders } from "../services/queuedOrders.js";
import { checkAndAwardAchievements } from "../services/achievements.js";
import logger from "../utils/logger.js";

interface AuthRequest {
  user?: { id: string };
  params: any;
  body: any;
}

// Outside market hours the order is queued (202) instead of filling at the
// stale closing price; jobs/queuedOrders.ts places it after the open.
const buyStock = asyncHandler(async (req: AuthRequest, res: Response) => {
  const parsed = tradeSchema.safeParse(req.body);
  if (!parsed.success) {
    throw validationError(parsed.error);
  }
  const { symbol, quantity } = parsed.data;
  const userId = req.user!.id;

  const quote = await fetchQuoteOrThrow(symbol);
  const price = new Prisma.Decimal(quote.price);

  if (!isMarketOpen()) {
    const { order, message } = await queueOrder(userId, "BUY", symbol, quantity, price);
    return res.status(202).json(new ApiResponse(202, message, { queued: true, order }));
  }

  const result = await prisma.$transaction((tx) => executeBuy(tx, userId, symbol, quantity, price));

  checkAndAwardAchievements(userId).catch((error) => logger.error({ err: error }, "Error checking achievements"));

  return res
    .status(200)
    .json(new ApiResponse(200, "Stock purchased successfully", result));
});

const sellStock = asyncHandler(async (req: AuthRequest, res: Response) => {
  const parsed = tradeSchema.safeParse(req.body);
  if (!parsed.success) {
    throw validationError(parsed.error);
  }
  const { symbol, quantity } = parsed.data;
  const userId = req.user!.id;

  const quote = await fetchQuoteOrThrow(symbol);
  const price = new Prisma.Decimal(quote.price);

  if (!isMarketOpen()) {
    const { order, message } = await queueOrder(userId, "SELL", symbol, quantity, price);
    return res.status(202).json(new ApiResponse(202, message, { queued: true, order }));
  }

  const result = await prisma.$transaction((tx) => executeSell(tx, userId, symbol, quantity, price));

  checkAndAwardAchievements(userId).catch((error) => logger.error({ err: error }, "Error checking achievements"));

  return res
    .status(200)
    .json(new ApiResponse(200, "Stock sold successfully", result));
});

const getQueuedOrders = asyncHandler(async (req: AuthRequest, res: Response) => {
  const orders = await listQueuedOrders(req.user!.id);
  return res.status(200).json(new ApiResponse(200, "Orders fetched successfully", orders));
});

const cancelOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
  await cancelQueuedOrder(req.user!.id, String(req.params.id));
  return res.status(200).json(new ApiResponse(200, "Order cancelled", null));
});

export { buyStock, sellStock, getQueuedOrders, cancelOrder };
