import { z } from "zod";
import { Response } from "express";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import prisma from "../db/prisma.js";
import { computeNetWorths } from "../services/netWorth.js";

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

async function computeRankings(): Promise<RankedUser[]> {
  const users = await prisma.user.findMany({
    where: { otpVerified: true, wallet: { isNot: null } },
    select: { id: true, name: true, username: true, avatar: true },
  });

  const netWorths = await computeNetWorths(users.map((u) => u.id));

  const unranked = users.map((user) => {
    const netWorth = netWorths.get(user.id)!.toNumber();
    const totalPnlPercent = ((netWorth - STARTING_BALANCE) / STARTING_BALANCE) * 100;

    return {
      userId: user.id,
      name: user.name,
      username: user.username,
      avatar: user.avatar,
      netWorth,
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

// Re-ranks the cached global rankings within just the caller's follow graph.
const getFriendsLeaderboard = asyncHandler(async (req: AuthRequest, res: Response) => {
  const parsed = leaderboardQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    throw new ApiError(400, "Invalid query parameters", parsed.error.issues);
  }
  const { limit } = parsed.data;
  const userId = req.user!.id;

  const follows = await prisma.follow.findMany({ where: { followerId: userId }, select: { followingId: true } });
  const scopeIds = new Set([userId, ...follows.map((f) => f.followingId)]);

  const rankings = await getRankings();
  const scoped = rankings
    .filter((entry) => scopeIds.has(entry.userId))
    .map((entry, index) => ({ ...entry, rank: index + 1 }));

  const top = scoped.slice(0, limit);
  const currentUser = scoped.find((entry) => entry.userId === userId) ?? null;

  return res.status(200).json(
    new ApiResponse(200, "Friends leaderboard fetched successfully", {
      leaderboard: top,
      currentUser,
      totalPlayers: scoped.length,
    })
  );
});

export { getLeaderboard, getFriendsLeaderboard, getRankings };
