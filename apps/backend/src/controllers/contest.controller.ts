import { z } from "zod";
import { Response } from "express";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import prisma from "../db/prisma.js";
import { computeNetWorths } from "../services/netWorth.js";

interface AuthRequest {
  user?: { id: string };
  params: any;
  query: any;
  body: any;
}

// Status in the DB only ever starts as UPCOMING — the actual UPCOMING/LIVE/
// ENDED a client sees is derived from the clock at read time. Persisting the
// transition (plus freezing final standings) is the settlement job, Day 10.
function deriveStatus(contest: { startAt: Date; endAt: Date }): "UPCOMING" | "LIVE" | "ENDED" {
  const now = Date.now();
  if (now < contest.startAt.getTime()) return "UPCOMING";
  if (now < contest.endAt.getTime()) return "LIVE";
  return "ENDED";
}

const CONTEST_LIST_FIELDS = {
  id: true,
  name: true,
  startAt: true,
  endAt: true,
  startingBalance: true,
  status: true,
  prize: true,
  createdAt: true,
  _count: { select: { entries: true } },
} as const;

// No admin-role system exists anywhere in this app yet, so any authenticated
// user can create a contest for now — same trust level as the rest of the API.
const createContestSchema = z
  .object({
    name: z.string().trim().min(1, "name is required").max(100),
    startAt: z.coerce.date(),
    endAt: z.coerce.date(),
    startingBalance: z.coerce.number().positive().optional(),
    prize: z.string().trim().max(200).optional(),
  })
  .refine((data) => data.endAt > data.startAt, {
    message: "endAt must be after startAt",
    path: ["endAt"],
  });

const createContest = asyncHandler(async (req: AuthRequest, res: Response) => {
  const parsed = createContestSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ApiError(400, "Invalid input", parsed.error.issues);
  }
  const { name, startAt, endAt, startingBalance, prize } = parsed.data;

  const contest = await prisma.contest.create({
    data: {
      name,
      startAt,
      endAt,
      ...(startingBalance !== undefined ? { startingBalance } : {}),
      prize,
    },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, "Contest created successfully", { ...contest, status: deriveStatus(contest) }));
});

const getContests = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const contests = await prisma.contest.findMany({
    select: CONTEST_LIST_FIELDS,
    orderBy: { startAt: "asc" },
  });

  const withStatus = contests.map((c) => ({ ...c, status: deriveStatus(c) }));

  return res.status(200).json(new ApiResponse(200, "Contests fetched successfully", withStatus));
});

const getContest = asyncHandler(async (req: AuthRequest, res: Response) => {
  const contest = await prisma.contest.findUnique({
    where: { id: req.params.id },
    select: CONTEST_LIST_FIELDS,
  });

  if (!contest) {
    throw new ApiError(404, "Contest not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Contest fetched successfully", { ...contest, status: deriveStatus(contest) }));
});

const joinContest = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const contest = await prisma.contest.findUnique({ where: { id: req.params.id } });

  if (!contest) {
    throw new ApiError(404, "Contest not found");
  }
  if (deriveStatus(contest) === "ENDED") {
    throw new ApiError(400, "This contest has already ended");
  }

  const existingEntry = await prisma.contestEntry.findUnique({
    where: { contestId_userId: { contestId: contest.id, userId } },
  });
  if (existingEntry) {
    throw new ApiError(400, "You've already joined this contest");
  }

  const netWorths = await computeNetWorths([userId]);
  const joinNetWorth = netWorths.get(userId);
  if (!joinNetWorth) {
    throw new ApiError(404, "Wallet not found");
  }

  const entry = await prisma.contestEntry.create({
    data: { contestId: contest.id, userId, joinNetWorth },
  });

  return res.status(200).json(new ApiResponse(200, "Joined contest successfully", entry));
});

const getStandings = asyncHandler(async (req: AuthRequest, res: Response) => {
  const contest = await prisma.contest.findUnique({ where: { id: req.params.id } });
  if (!contest) {
    throw new ApiError(404, "Contest not found");
  }

  const entries = await prisma.contestEntry.findMany({
    where: { contestId: contest.id },
    include: { user: { select: { id: true, name: true, username: true, avatar: true } } },
  });

  if (entries.length === 0) {
    return res.status(200).json(
      new ApiResponse(200, "Standings fetched successfully", { status: deriveStatus(contest), standings: [] })
    );
  }

  // Once settled (Day 10), finalRank/finalNetWorth are frozen — no need to
  // recompute live prices for a contest that's already over.
  const isSettled = entries.every((e) => e.finalRank !== null);

  let standings;
  if (isSettled) {
    standings = entries
      .sort((a, b) => a.finalRank! - b.finalRank!)
      .map((entry) => ({
        userId: entry.userId,
        name: entry.user.name,
        username: entry.user.username,
        avatar: entry.user.avatar,
        netWorth: entry.finalNetWorth!.toNumber(),
        delta: entry.finalNetWorth!.sub(entry.joinNetWorth).toNumber(),
        rank: entry.finalRank!,
      }));
  } else {
    const netWorths = await computeNetWorths(entries.map((e) => e.userId));
    standings = entries
      .map((entry) => {
        const currentNetWorth = netWorths.get(entry.userId) ?? entry.joinNetWorth;
        return {
          userId: entry.userId,
          name: entry.user.name,
          username: entry.user.username,
          avatar: entry.user.avatar,
          netWorth: currentNetWorth.toNumber(),
          delta: currentNetWorth.sub(entry.joinNetWorth).toNumber(),
        };
      })
      .sort((a, b) => b.delta - a.delta)
      .map((entry, index) => ({ ...entry, rank: index + 1 }));
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Standings fetched successfully", { status: deriveStatus(contest), standings }));
});

export { createContest, getContests, getContest, joinContest, getStandings };
