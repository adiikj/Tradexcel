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

// Every wallet is seeded with the same starting cash (see registration flow),
// so net worth vs. this baseline is a fair "total return" figure across users.
const STARTING_BALANCE = 100000;
const LEADERBOARD_CACHE_TTL_MS = 45_000;

interface RankedUser {
  userId: string;
  rank: number;
  name: string;
  username: string;
  avatar: string;
  netWorth: number;
  totalPnlPercent: number;
}

let cache: { rankings: RankedUser[]; expiresAt: number } | null = null;

// Recomputes net worth for every verified user in one pass: a single batched
// quote fetch across every symbol anyone holds, rather than N+1 price calls.
async function computeRankings(): Promise<RankedUser[]> {
  const users = await prisma.user.findMany({
    where: { otpVerified: true, wallet: { isNot: null } },
    select: {
      id: true,
      name: true,
      username: true,
      avatar: true,
      wallet: { select: { balance: true } },
      holdings: { select: { symbol: true, quantity: true, avgBuyPrice: true } },
    },
  });

  const allSymbols = [...new Set(users.flatMap((u) => u.holdings.map((h) => h.symbol)))];
  const quotes = allSymbols.length > 0 ? await getQuotes(allSymbols) : {};

  const unranked = users.map((user) => {
    const holdingsValue = user.holdings.reduce((sum, holding) => {
      const quote = quotes[holding.symbol];
      // A failed quote falls back to the position's cost basis (zero P&L
      // for that holding) rather than dropping it or 500ing the endpoint —
      // same hardening rule as the portfolio endpoint.
      const price = quote ? new Prisma.Decimal(quote.price) : holding.avgBuyPrice;
      return sum.add(price.mul(holding.quantity));
    }, new Prisma.Decimal(0));

    const netWorth = user.wallet!.balance.add(holdingsValue);
    const totalPnlPercent = ((netWorth.toNumber() - STARTING_BALANCE) / STARTING_BALANCE) * 100;

    return {
      userId: user.id,
      name: user.name,
      username: user.username,
      avatar: user.avatar,
      netWorth: netWorth.toNumber(),
      totalPnlPercent,
    };
  });

  return unranked
    .sort((a, b) => b.netWorth - a.netWorth)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

async function getRankings(): Promise<RankedUser[]> {
  if (cache && cache.expiresAt > Date.now()) {
    return cache.rankings;
  }

  const rankings = await computeRankings();
  cache = { rankings, expiresAt: Date.now() + LEADERBOARD_CACHE_TTL_MS };
  return rankings;
}

const leaderboardQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).default(20),
});

const getLeaderboard = asyncHandler(async (req: AuthRequest, res: Response) => {
  const parsed = leaderboardQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    throw new ApiError(400, "Invalid query parameters", parsed.error.issues);
  }
  const { limit } = parsed.data;
  const userId = req.user!.id;

  const rankings = await getRankings();
  const top = rankings.slice(0, limit);
  const currentUser = rankings.find((entry) => entry.userId === userId) ?? null;

  return res.status(200).json(
    new ApiResponse(200, "Leaderboard fetched successfully", {
      leaderboard: top,
      currentUser,
      totalPlayers: rankings.length,
    })
  );
});

export { getLeaderboard };
