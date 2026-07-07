import { z } from "zod";
import { Response } from "express";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import prisma from "../db/prisma.js";
import { computeContestNetWorths } from "../services/contestNetWorth.js";
import { ingestContestHistory } from "../services/contestHistoricalIngest.js";
import { resolveSimulatedDate } from "../services/contestClock.js";
import { getQuotes } from "../services/pricing.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

interface AuthRequest {
  user?: { id: string };
  params: any;
  query: any;
  body: any;
  file?: { path: string };
}

const MS_PER_DAY = 86_400_000;

// Derives status + simulatedDate and drops the internal historicalDates array.
function toContestResponse<T extends { startAt: Date; endAt: Date; historicalDates: Date[] }>(
  contest: T
): Omit<T, "historicalDates"> & { status: "UPCOMING" | "LIVE" | "ENDED"; simulatedDate: Date | null } {
  const { historicalDates, ...rest } = contest;
  return {
    ...rest,
    status: deriveStatus(contest),
    simulatedDate: resolveSimulatedDate(contest),
  };
}

// The DB status only ever starts UPCOMING; what a client sees is derived from the clock.
export function deriveStatus(contest: { startAt: Date; endAt: Date }): "UPCOMING" | "LIVE" | "ENDED" {
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
  symbols: true,
  status: true,
  prize: true,
  imageUrl: true,
  historicalStartDate: true,
  historicalDates: true,
  createdAt: true,
  _count: { select: { entries: true } },
} as const;

// Contest creation is admin-only; see admin.routes.ts's verifyAdmin-gated routes.
const createContestSchema = z
  .object({
    name: z.string().trim().min(1, "name is required").max(100),
    startAt: z.coerce.date(),
    endAt: z.coerce.date(),
    startingBalance: z.coerce.number().positive().optional(),
    symbols: z
      .array(z.string().trim().min(1).max(15))
      .min(1, "at least one symbol is required")
      .max(50, "at most 50 symbols allowed")
      .transform((symbols) => [...new Set(symbols.map((s) => s.toUpperCase()))]),
    prize: z.string().trim().max(200).optional(),
    // Presence turns this into a "past event" replay contest - trades price
    // off historical closes instead of live quotes. See ingestContestHistory.
    historicalStartDate: z.coerce.date().optional(),
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
  const { name, startAt, endAt, startingBalance, symbols, prize, historicalStartDate } = parsed.data;

  let historicalDates: Date[] = [];
  if (historicalStartDate) {
    const numDays = Math.ceil((endAt.getTime() - startAt.getTime()) / MS_PER_DAY);
    historicalDates = await ingestContestHistory(symbols, historicalStartDate, numDays);
    if (historicalDates.length === 0) {
      throw new ApiError(400, "Couldn't find historical price data for this symbol/date range");
    }
  }

  const contest = await prisma.contest.create({
    data: {
      name,
      startAt,
      endAt,
      symbols,
      ...(startingBalance !== undefined ? { startingBalance } : {}),
      prize,
      historicalStartDate: historicalStartDate ?? null,
      historicalDates,
    },
  });

  return res.status(200).json(new ApiResponse(200, "Contest created successfully", toContestResponse(contest)));
});

// Omits historicalStartDate: a replay contest's schedule is fixed at creation.
const updateContestSchema = z
  .object({
    name: z.string().trim().min(1, "name is required").max(100),
    startAt: z.coerce.date(),
    endAt: z.coerce.date(),
    startingBalance: z.coerce.number().positive().optional(),
    symbols: z
      .array(z.string().trim().min(1).max(15))
      .min(1, "at least one symbol is required")
      .max(50, "at most 50 symbols allowed")
      .transform((symbols) => [...new Set(symbols.map((s) => s.toUpperCase()))]),
    prize: z.string().trim().max(200).optional(),
  })
  .refine((data) => data.endAt > data.startAt, {
    message: "endAt must be after startAt",
    path: ["endAt"],
  });

const updateContest = asyncHandler(async (req: AuthRequest, res: Response) => {
  const parsed = updateContestSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ApiError(400, "Invalid input", parsed.error.issues);
  }
  const { name, startAt, endAt, startingBalance, symbols, prize } = parsed.data;

  const existing = await prisma.contest.findUnique({ where: { id: req.params.id } });
  if (!existing) {
    throw new ApiError(404, "Contest not found");
  }

  const contest = await prisma.contest.update({
    where: { id: req.params.id },
    data: {
      name,
      startAt,
      endAt,
      symbols,
      ...(startingBalance !== undefined ? { startingBalance } : {}),
      prize: prize ?? null,
    },
  });

  return res.status(200).json(new ApiResponse(200, "Contest updated successfully", toContestResponse(contest)));
});

// Separate from updateContest so metadata edits don't require multipart/form-data.
const updateContestImage = asyncHandler(async (req: AuthRequest, res: Response) => {
  const imageLocalPath = req.file?.path;
  if (!imageLocalPath) {
    throw new ApiError(400, "Image is required");
  }

  const existing = await prisma.contest.findUnique({ where: { id: req.params.id } });
  if (!existing) {
    throw new ApiError(404, "Contest not found");
  }

  const uploaded = await uploadOnCloudinary(imageLocalPath);
  if (!uploaded?.url) {
    throw new ApiError(500, "Error uploading image");
  }

  const contest = await prisma.contest.update({
    where: { id: req.params.id },
    data: { imageUrl: uploaded.url },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, "Contest image updated successfully", toContestResponse(contest)));
});

const getContests = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const contests = await prisma.contest.findMany({
    select: CONTEST_LIST_FIELDS,
    orderBy: { startAt: "asc" },
  });

  const withStatus = contests.map((c) => toContestResponse(c));

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

  const simulatedDate = resolveSimulatedDate(contest);
  let todaysPrices: Record<string, number> | undefined;

  if (simulatedDate) {
    const rows = await prisma.contestHistoricalPrice.findMany({
      where: { symbol: { in: contest.symbols }, date: simulatedDate },
    });
    todaysPrices = Object.fromEntries(rows.map((r) => [r.symbol, r.close.toNumber()]));
  } else if (contest.symbols.length > 0) {
    const quotes = await getQuotes(contest.symbols);
    todaysPrices = Object.fromEntries(
      contest.symbols.filter((s) => quotes[s]).map((s) => [s, quotes[s]!.price])
    );
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Contest fetched successfully", { ...toContestResponse(contest), todaysPrices }));
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

  const entry = await prisma.contestEntry.create({
    data: { contestId: contest.id, userId, balance: contest.startingBalance },
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

  // Once settled, finalRank/finalNetWorth are frozen; no need to recompute live prices.
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
        delta: entry.finalNetWorth!.sub(contest.startingBalance).toNumber(),
        rank: entry.finalRank!,
      }));
  } else {
    const netWorths = await computeContestNetWorths(contest.id);
    standings = entries
      .map((entry) => {
        const currentNetWorth = netWorths.get(entry.id) ?? entry.balance;
        return {
          userId: entry.userId,
          name: entry.user.name,
          username: entry.user.username,
          avatar: entry.user.avatar,
          netWorth: currentNetWorth.toNumber(),
          delta: currentNetWorth.sub(contest.startingBalance).toNumber(),
        };
      })
      .sort((a, b) => b.delta - a.delta)
      .map((entry, index) => ({ ...entry, rank: index + 1 }));
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Standings fetched successfully", { status: deriveStatus(contest), standings }));
});

export { createContest, updateContest, updateContestImage, getContests, getContest, joinContest, getStandings };
