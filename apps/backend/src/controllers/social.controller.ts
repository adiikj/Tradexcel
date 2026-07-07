import { z } from "zod";
import { Response } from "express";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import prisma from "../db/prisma.js";
import { computeNetWorths } from "../services/netWorth.js";
import { getRankings } from "./leaderboard.controller.js";

interface AuthRequest {
  user?: { id: string; name?: string; username?: string };
  params: any;
  query: any;
}

const STARTING_BALANCE = 100000;

async function findUserByUsername(username: string) {
  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      name: true,
      username: true,
      avatar: true,
      createdAt: true,
      currentStreak: true,
      longestStreak: true,
    },
  });
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  return user;
}

function badgesFor(streak: number, rank: number | null): string[] {
  const badges: string[] = [];
  if (streak >= 30) badges.push("30-Day Streak");
  else if (streak >= 7) badges.push("7-Day Streak");
  else if (streak >= 3) badges.push("3-Day Streak");

  if (rank === 1) badges.push("#1 Trader");
  else if (rank !== null && rank <= 10) badges.push("Top 10");

  return badges;
}

const getPublicProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const viewerId = req.user?.id;
  const target = await findUserByUsername(req.params.username);

  const [netWorths, rankings, followersCount, followingCount, followRow] = await Promise.all([
    computeNetWorths([target.id]),
    getRankings(),
    prisma.follow.count({ where: { followingId: target.id } }),
    prisma.follow.count({ where: { followerId: target.id } }),
    viewerId
      ? prisma.follow.findUnique({
          where: { followerId_followingId: { followerId: viewerId, followingId: target.id } },
        })
      : null,
  ]);

  const netWorth = netWorths.get(target.id)?.toNumber() ?? STARTING_BALANCE;
  const totalPnlPercent = ((netWorth - STARTING_BALANCE) / STARTING_BALANCE) * 100;
  const rankEntry = rankings.find((entry) => entry.userId === target.id) ?? null;

  return res.status(200).json(
    new ApiResponse(200, "Profile fetched successfully", {
      id: target.id,
      name: target.name,
      username: target.username,
      avatar: target.avatar,
      memberSince: target.createdAt,
      netWorth,
      totalPnlPercent,
      rank: rankEntry?.rank ?? null,
      currentStreak: target.currentStreak,
      longestStreak: target.longestStreak,
      followersCount,
      followingCount,
      isFollowing: Boolean(followRow),
      isSelf: target.id === viewerId,
      badges: badgesFor(target.currentStreak, rankEntry?.rank ?? null),
    })
  );
});

const followUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  const viewerId = req.user!.id;
  const target = await findUserByUsername(req.params.username);

  if (target.id === viewerId) {
    throw new ApiError(400, "You can't follow yourself");
  }

  const existing = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId: viewerId, followingId: target.id } },
  });

  if (!existing) {
    await prisma.follow.create({ data: { followerId: viewerId, followingId: target.id } });
    // Only the first follow notifies - re-following after an unfollow (which
    // this endpoint is idempotent to) shouldn't spam the target again.
    await prisma.notification.create({
      data: {
        userId: target.id,
        actorId: viewerId,
        type: "FOLLOW",
        message: `${req.user!.name ?? "Someone"} (@${req.user!.username ?? "unknown"}) started following you`,
        link: `/u/${req.user!.username ?? ""}`,
      },
    });
  }

  return res.status(200).json(new ApiResponse(200, `You're now following ${target.username}`, null));
});

const unfollowUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  const viewerId = req.user!.id;
  const target = await findUserByUsername(req.params.username);

  await prisma.follow.deleteMany({
    where: { followerId: viewerId, followingId: target.id },
  });

  return res.status(200).json(new ApiResponse(200, `Unfollowed ${target.username}`, null));
});

const listQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).default(50),
});

const getFollowers = asyncHandler(async (req: AuthRequest, res: Response) => {
  const parsed = listQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    throw new ApiError(400, "Invalid query parameters", parsed.error.issues);
  }
  const viewerId = req.user!.id;
  const target = await findUserByUsername(req.params.username);

  const follows = await prisma.follow.findMany({
    where: { followingId: target.id },
    take: parsed.data.limit,
    orderBy: { createdAt: "desc" },
    include: { follower: { select: { id: true, name: true, username: true, avatar: true } } },
  });

  const viewerFollowing = await prisma.follow.findMany({
    where: { followerId: viewerId, followingId: { in: follows.map((f) => f.followerId) } },
    select: { followingId: true },
  });
  const followingSet = new Set(viewerFollowing.map((f) => f.followingId));

  return res.status(200).json(
    new ApiResponse(200, "Followers fetched successfully", {
      users: follows.map((f) => ({ ...f.follower, isFollowing: followingSet.has(f.follower.id) })),
    })
  );
});

const getFollowing = asyncHandler(async (req: AuthRequest, res: Response) => {
  const parsed = listQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    throw new ApiError(400, "Invalid query parameters", parsed.error.issues);
  }
  const viewerId = req.user!.id;
  const target = await findUserByUsername(req.params.username);

  const follows = await prisma.follow.findMany({
    where: { followerId: target.id },
    take: parsed.data.limit,
    orderBy: { createdAt: "desc" },
    include: { following: { select: { id: true, name: true, username: true, avatar: true } } },
  });

  const viewerFollowing = await prisma.follow.findMany({
    where: { followerId: viewerId, followingId: { in: follows.map((f) => f.followingId) } },
    select: { followingId: true },
  });
  const followingSet = new Set(viewerFollowing.map((f) => f.followingId));

  return res.status(200).json(
    new ApiResponse(200, "Following fetched successfully", {
      users: follows.map((f) => ({ ...f.following, isFollowing: followingSet.has(f.following.id) })),
    })
  );
});

const feedQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
});

// Merges trades and contest results into one timeline, over-fetching each
// source before re-slicing to the requested page.
const getActivityFeed = asyncHandler(async (req: AuthRequest, res: Response) => {
  const parsed = feedQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    throw new ApiError(400, "Invalid query parameters", parsed.error.issues);
  }
  const { page, limit } = parsed.data;
  const viewerId = req.user!.id;

  const following = await prisma.follow.findMany({
    where: { followerId: viewerId },
    select: { followingId: true },
  });
  const followedIds = following.map((f) => f.followingId);

  if (followedIds.length === 0) {
    return res.status(200).json(
      new ApiResponse(200, "Activity feed fetched successfully", {
        items: [],
        pagination: { page, limit, total: 0, totalPages: 0 },
      })
    );
  }

  const fetchCount = page * limit;

  const [trades, contestResults] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId: { in: followedIds } },
      orderBy: { createdAt: "desc" },
      take: fetchCount,
      include: { user: { select: { id: true, name: true, username: true, avatar: true } } },
    }),
    prisma.contestEntry.findMany({
      where: { userId: { in: followedIds }, finalRank: { not: null } },
      orderBy: { contest: { endAt: "desc" } },
      take: fetchCount,
      include: {
        user: { select: { id: true, name: true, username: true, avatar: true } },
        contest: { select: { id: true, name: true, endAt: true } },
      },
    }),
  ]);

  const items = [
    ...trades.map((t) => ({
      type: "trade" as const,
      id: t.id,
      user: t.user,
      symbol: t.symbol,
      side: t.side,
      quantity: t.quantity,
      price: t.price,
      total: t.total,
      timestamp: t.createdAt,
    })),
    ...contestResults.map((c) => ({
      type: "contest_result" as const,
      id: c.id,
      user: c.user,
      contestId: c.contest.id,
      contestName: c.contest.name,
      finalRank: c.finalRank,
      finalNetWorth: c.finalNetWorth,
      timestamp: c.contest.endAt,
    })),
  ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  const start = (page - 1) * limit;
  const paged = items.slice(start, start + limit);

  return res.status(200).json(
    new ApiResponse(200, "Activity feed fetched successfully", {
      items: paged,
      pagination: { page, limit, total: items.length, totalPages: Math.ceil(items.length / limit) },
    })
  );
});

export { getPublicProfile, followUser, unfollowUser, getFollowers, getFollowing, getActivityFeed };
