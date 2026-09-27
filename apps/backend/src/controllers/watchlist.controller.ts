import { z } from "zod";
import { Response } from "express";
import { STOCK_LIST } from "@tradexcel/shared";
import { ApiError } from "../utils/ApiError.js";
import { validationError } from "../utils/validation.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import prisma from "../db/prisma.js";

interface AuthRequest {
  user?: { id: string };
  params: any;
}

// Enough for a real watchlist, small enough that the Market page can show it all.
export const WATCHLIST_LIMIT = 50;
const LISTED = new Set(STOCK_LIST.map((s) => s.symbol));

const symbolSchema = z
  .string()
  .trim()
  .min(1, "symbol is required")
  .max(15, "symbol is too long")
  .transform((s) => s.toUpperCase())
  .refine((s) => LISTED.has(s), "That stock isn't listed on Tradexcel");

async function listSymbols(userId: string): Promise<string[]> {
  const items = await prisma.watchlistItem.findMany({ where: { userId }, orderBy: { createdAt: "asc" }, select: { symbol: true } });
  return items.map((i) => i.symbol);
}

const getWatchlist = asyncHandler(async (req: AuthRequest, res: Response) => {
  return res.status(200).json(new ApiResponse(200, "Watchlist fetched successfully", await listSymbols(req.user!.id)));
});

// Idempotent: starring a stock that's already on the list is a no-op.
const addToWatchlist = asyncHandler(async (req: AuthRequest, res: Response) => {
  const parsed = symbolSchema.safeParse(req.params.symbol);
  if (!parsed.success) {
    throw validationError(parsed.error);
  }
  const userId = req.user!.id;
  const symbol = parsed.data;

  const count = await prisma.watchlistItem.count({ where: { userId } });
  if (count >= WATCHLIST_LIMIT) {
    const already = await prisma.watchlistItem.findUnique({ where: { userId_symbol: { userId, symbol } } });
    if (!already) throw new ApiError(400, `Your watchlist can hold up to ${WATCHLIST_LIMIT} stocks`);
  }
  await prisma.watchlistItem.upsert({
    where: { userId_symbol: { userId, symbol } },
    create: { userId, symbol },
    update: {},
  });

  return res.status(200).json(new ApiResponse(200, "Added to watchlist", await listSymbols(userId)));
});

const removeFromWatchlist = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const symbol = String(req.params.symbol ?? "").trim().toUpperCase();
  await prisma.watchlistItem.deleteMany({ where: { userId, symbol } });
  return res.status(200).json(new ApiResponse(200, "Removed from watchlist", await listSymbols(userId)));
});

export { getWatchlist, addToWatchlist, removeFromWatchlist };
