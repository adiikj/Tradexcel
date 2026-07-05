import { Prisma } from "@prisma/client";
import { z } from "zod";
import { Response } from "express";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import prisma from "../db/prisma.js";
import { getQuote } from "../services/pricing.js";
import { computeWeightedAvgPrice, computeRemainingQuantity, canAfford, canSell } from "../services/tradeMath.js";

interface AuthRequest {
  user?: { id: string };
  body: any;
}

const tradeSchema = z.object({
  symbol: z
    .string()
    .trim()
    .min(1, "symbol is required")
    .max(15, "symbol is too long")
    .transform((s) => s.toUpperCase()),
  quantity: z.coerce.number().int().positive("quantity must be a positive integer"),
});

async function fetchQuoteOrThrow(symbol: string) {
  try {
    return await getQuote(symbol);
  } catch (error: any) {
    throw new ApiError(404, `No live price available for ${symbol}`);
  }
}

const buyStock = asyncHandler(async (req: AuthRequest, res: Response) => {
  const parsed = tradeSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ApiError(400, "Invalid input", parsed.error.issues);
  }
  const { symbol, quantity } = parsed.data;
  const userId = req.user!.id;

  const quote = await fetchQuoteOrThrow(symbol);
  const price = new Prisma.Decimal(quote.price);
  const total = price.mul(quantity);

  const result = await prisma.$transaction(async (tx) => {
    const wallet = await tx.wallet.findUnique({ where: { userId } });
    if (!wallet) {
      throw new ApiError(404, "Wallet not found");
    }
    if (!canAfford(total, wallet.balance)) {
      throw new ApiError(400, "Insufficient funds for this trade");
    }

    const updatedWallet = await tx.wallet.update({
      where: { userId },
      data: { balance: { decrement: total } },
    });

    const existingHolding = await tx.holding.findUnique({
      where: { userId_symbol: { userId, symbol } },
    });

    const holding = existingHolding
      ? await tx.holding.update({
          where: { userId_symbol: { userId, symbol } },
          data: {
            quantity: existingHolding.quantity + quantity,
            avgBuyPrice: computeWeightedAvgPrice(
              existingHolding.quantity,
              existingHolding.avgBuyPrice,
              quantity,
              total
            ),
          },
        })
      : await tx.holding.create({
          data: { userId, symbol, quantity, avgBuyPrice: price },
        });

    const transaction = await tx.transaction.create({
      data: { userId, symbol, side: "BUY", quantity, price, total },
    });

    return { wallet: updatedWallet, holding, transaction };
  });

  return res
    .status(200)
    .json(new ApiResponse(200, "Stock purchased successfully", result));
});

const sellStock = asyncHandler(async (req: AuthRequest, res: Response) => {
  const parsed = tradeSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ApiError(400, "Invalid input", parsed.error.issues);
  }
  const { symbol, quantity } = parsed.data;
  const userId = req.user!.id;

  const quote = await fetchQuoteOrThrow(symbol);
  const price = new Prisma.Decimal(quote.price);

  const result = await prisma.$transaction(async (tx) => {
    const holding = await tx.holding.findUnique({
      where: { userId_symbol: { userId, symbol } },
    });
    if (!holding || !canSell(quantity, holding.quantity)) {
      throw new ApiError(400, "Insufficient holdings to sell");
    }

    const total = price.mul(quantity);

    const wallet = await tx.wallet.update({
      where: { userId },
      data: { balance: { increment: total } },
    });

    const remainingQuantity = computeRemainingQuantity(holding.quantity, quantity);
    const updatedHolding =
      remainingQuantity === 0
        ? await tx.holding
            .delete({ where: { userId_symbol: { userId, symbol } } })
            .then(() => null)
        : await tx.holding.update({
            where: { userId_symbol: { userId, symbol } },
            data: { quantity: remainingQuantity },
          });

    const transaction = await tx.transaction.create({
      data: { userId, symbol, side: "SELL", quantity, price, total },
    });

    return { wallet, holding: updatedHolding, transaction };
  });

  return res
    .status(200)
    .json(new ApiResponse(200, "Stock sold successfully", result));
});

export { buyStock, sellStock };
