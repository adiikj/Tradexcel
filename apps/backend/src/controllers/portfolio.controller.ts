import { Prisma } from "@prisma/client";
import { z } from "zod";
import { Response } from "express";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import prisma from "../db/prisma.js";
import { getQuotes } from "../services/pricing.js";

interface AuthRequest {
  user?: { id: string };
  query: any;
}

const getWallet = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;

  const wallet = await prisma.wallet.findUnique({ where: { userId } });
  if (!wallet) {
    throw new ApiError(404, "Wallet not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Wallet fetched successfully", wallet));
});

// A quote failure for one symbol falls back to invested value, not the whole response.
const getPortfolio = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;

  const [wallet, holdings] = await Promise.all([
    prisma.wallet.findUnique({ where: { userId } }),
    prisma.holding.findMany({ where: { userId }, orderBy: { symbol: "asc" } }),
  ]);

  if (!wallet) {
    throw new ApiError(404, "Wallet not found");
  }

  const quotes = await getQuotes(holdings.map((h) => h.symbol));

  let totalInvested = new Prisma.Decimal(0);
  let totalCurrentValue = new Prisma.Decimal(0);

  const enrichedHoldings = holdings.map((holding) => {
    const quote = quotes[holding.symbol] ?? null;
    const investedValue = holding.avgBuyPrice.mul(holding.quantity);
    const currentPrice = quote?.price ?? null;
    const currentValue =
      currentPrice !== null
        ? new Prisma.Decimal(currentPrice).mul(holding.quantity)
        : investedValue;
    const unrealizedPnl = currentPrice !== null ? currentValue.sub(investedValue) : null;
    const unrealizedPnlPercent =
      unrealizedPnl !== null && investedValue.gt(0)
        ? unrealizedPnl.div(investedValue).mul(100)
        : null;

    totalInvested = totalInvested.add(investedValue);
    totalCurrentValue = totalCurrentValue.add(currentValue);

    return {
      ...holding,
      currentPrice,
      currentValue: currentPrice !== null ? currentValue : null,
      investedValue,
      unrealizedPnl,
      unrealizedPnlPercent,
      priceStale: currentPrice === null,
    };
  });

  const totalPnl = totalCurrentValue.sub(totalInvested);
  const netWorth = wallet.balance.add(totalCurrentValue);

  const summary = {
    totalInvested,
    totalCurrentValue,
    totalPnl,
    walletBalance: wallet.balance,
    netWorth,
  };

  return res.status(200).json(
    new ApiResponse(200, "Portfolio fetched successfully", {
      holdings: enrichedHoldings,
      summary,
    })
  );
});

const transactionsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

const getTransactions = asyncHandler(async (req: AuthRequest, res: Response) => {
  const parsed = transactionsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    throw new ApiError(400, "Invalid query parameters", parsed.error.issues);
  }
  const { page, limit } = parsed.data;
  const userId = req.user!.id;

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.transaction.count({ where: { userId } }),
  ]);

  return res.status(200).json(
    new ApiResponse(200, "Transactions fetched successfully", {
      transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  );
});

export { getWallet, getPortfolio, getTransactions };
