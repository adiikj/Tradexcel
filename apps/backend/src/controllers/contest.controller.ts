import crypto from "crypto";
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
const INVITE_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const INVITE_CODE_LENGTH = 8;

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

function serializeContestForUser(contest: any, userId: string) {
  const { entries, ...rest } = toContestResponse(contest);
  return {
    ...rest,
    isJoined: Array.isArray(entries) && entries.length > 0,
    isOwner: contest.ownerId === userId,
  };
}

function buildContestSelectForUser(userId: string) {
  return {
    id: true,
    name: true,
    startAt: true,
    endAt: true,
    startingBalance: true,
    symbols: true,
    status: true,
    visibility: true,
    prize: true,
    imageUrl: true,
    inviteCode: true,
    ownerId: true,
    historicalStartDate: true,
    historicalDates: true,
    createdAt: true,
    _count: { select: { entries: true } },
    entries: {
      where: { userId },
      select: { id: true },
      take: 1,
    },
  } as const;
}

async function assertContestAccess(
  contest: { id: string; visibility: "PUBLIC" | "PRIVATE"; ownerId: string | null },
  userId: string
) {
  if (contest.visibility === "PUBLIC" || contest.ownerId === userId) {
    return;
  }

  const entry = await prisma.contestEntry.findUnique({
    where: { contestId_userId: { contestId: contest.id, userId } },
    select: { id: true },
  });

  if (!entry) {
    throw new ApiError(403, "You don't have access to this private league");
  }
}

function makeInviteCode() {
  const bytes = crypto.randomBytes(INVITE_CODE_LENGTH);
  let code = "";
  for (let i = 0; i < INVITE_CODE_LENGTH; i += 1) {
    code += INVITE_CODE_ALPHABET[bytes[i] % INVITE_CODE_ALPHABET.length];
  }
  return code;
}

async function generateUniqueInviteCode() {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const inviteCode = makeInviteCode();
    const existing = await prisma.contest.findUnique({ where: { inviteCode }, select: { id: true } });
    if (!existing) {
      return inviteCode;
    }
  }

  throw new ApiError(500, "Unable to generate an invite code right now");
}

// The DB status only ever starts UPCOMING; what a client sees is derived from the clock.
export function deriveStatus(contest: { startAt: Date; endAt: Date }): "UPCOMING" | "LIVE" | "ENDED" {
  const now = Date.now();
  if (now < contest.startAt.getTime()) return "UPCOMING";
  if (now < contest.endAt.getTime()) return "LIVE";
  return "ENDED";
}

const contestInputSchema = z
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
    historicalStartDate: z.coerce.date().optional(),
  })
  .refine((data) => data.endAt > data.startAt, {
    message: "endAt must be after startAt",
    path: ["endAt"],
  });

const contestScopeSchema = z.object({
  scope: z.enum(["public", "private"]).default("public"),
});

const joinPrivateContestSchema = z.object({
  inviteCode: z.string().trim().min(6).max(20).transform((value) => value.toUpperCase()),
});

async function resolveHistoricalDates(
  symbols: string[],
  startAt: Date,
  endAt: Date,
  historicalStartDate?: Date
) {
  if (!historicalStartDate) {
    return [] as Date[];
  }

  const numDays = Math.ceil((endAt.getTime() - startAt.getTime()) / MS_PER_DAY);
  const historicalDates = await ingestContestHistory(symbols, historicalStartDate, numDays);
  if (historicalDates.length === 0) {
    throw new ApiError(400, "Couldn't find historical price data for this symbol/date range");
  }
  return historicalDates;
}

// Contest creation is admin-only; see admin.routes.ts's verifyAdmin-gated routes.
const createContest = asyncHandler(async (req: AuthRequest, res: Response) => {
  const parsed = contestInputSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ApiError(400, "Invalid input", parsed.error.issues);
  }
  const { name, startAt, endAt, startingBalance, symbols, prize, historicalStartDate } = parsed.data;

  const historicalDates = await resolveHistoricalDates(symbols, startAt, endAt, historicalStartDate);

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
      visibility: "PUBLIC",
    },
  });

  return res.status(200).json(new ApiResponse(200, "Contest created successfully", toContestResponse(contest)));
});

const createPrivateContest = asyncHandler(async (req: AuthRequest, res: Response) => {
  const parsed = contestInputSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ApiError(400, "Invalid input", parsed.error.issues);
  }

  const userId = req.user!.id;
  const { name, startAt, endAt, startingBalance, symbols, prize, historicalStartDate } = parsed.data;
  const historicalDates = await resolveHistoricalDates(symbols, startAt, endAt, historicalStartDate);
  const inviteCode = await generateUniqueInviteCode();

  const contest = await prisma.$transaction(async (tx) => {
    const created = await tx.contest.create({
      data: {
        name,
        startAt,
        endAt,
        symbols,
        ...(startingBalance !== undefined ? { startingBalance } : {}),
        prize,
        historicalStartDate: historicalStartDate ?? null,
        historicalDates,
        visibility: "PRIVATE",
        ownerId: userId,
        inviteCode,
      },
    });

    await tx.contestEntry.create({
      data: {
        contestId: created.id,
        userId,
        balance: created.startingBalance,
      },
    });

    return tx.contest.findUnique({
      where: { id: created.id },
      select: buildContestSelectForUser(userId),
    });
  });

  return res
    .status(200)
    .json(new ApiResponse(200, "Private league created successfully", serializeContestForUser(contest, userId)));
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

const getContests = asyncHandler(async (req: AuthRequest, res: Response) => {
  const parsed = contestScopeSchema.safeParse(req.query);
  if (!parsed.success) {
    throw new ApiError(400, "Invalid query parameters", parsed.error.issues);
  }

  const userId = req.user!.id;
  const where =
    parsed.data.scope === "private"
      ? {
          visibility: "PRIVATE" as const,
          OR: [{ ownerId: userId }, { entries: { some: { userId } } }],
        }
      : { visibility: "PUBLIC" as const };

  const contests = await prisma.contest.findMany({
    where,
    select: buildContestSelectForUser(userId),
    orderBy: [{ startAt: "asc" }, { createdAt: "desc" }],
  });

  const withStatus = contests.map((contest) => serializeContestForUser(contest, userId));

  return res.status(200).json(new ApiResponse(200, "Contests fetched successfully", withStatus));
});

const getContest = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const contest = await prisma.contest.findUnique({
    where: { id: req.params.id },
    select: buildContestSelectForUser(userId),
  });

  if (!contest) {
    throw new ApiError(404, "Contest not found");
  }

  await assertContestAccess(contest as any, userId);

  const simulatedDate = resolveSimulatedDate(contest);
  let todaysPrices: Record<string, number> | undefined;

  if (simulatedDate) {
    const rows = await prisma.contestHistoricalPrice.findMany({
      where: { symbol: { in: contest.symbols }, date: simulatedDate },
    });
    todaysPrices = Object.fromEntries(rows.map((row) => [row.symbol, row.close.toNumber()]));
  } else if (contest.symbols.length > 0) {
    const quotes = await getQuotes(contest.symbols);
    todaysPrices = Object.fromEntries(contest.symbols.filter((symbol) => quotes[symbol]).map((symbol) => [symbol, quotes[symbol]!.price]));
  }

  return res.status(200).json(
    new ApiResponse(200, "Contest fetched successfully", {
      ...serializeContestForUser(contest, userId),
      todaysPrices,
    })
  );
});

const joinContest = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const contest = await prisma.contest.findUnique({ where: { id: req.params.id } });

  if (!contest) {
    throw new ApiError(404, "Contest not found");
  }
  if (contest.visibility === "PRIVATE") {
    throw new ApiError(400, "Private leagues must be joined with an invite code");
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

const joinPrivateContest = asyncHandler(async (req: AuthRequest, res: Response) => {
  const parsed = joinPrivateContestSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ApiError(400, "Invalid input", parsed.error.issues);
  }

  const userId = req.user!.id;
  const contest = await prisma.contest.findUnique({
    where: { inviteCode: parsed.data.inviteCode },
    select: buildContestSelectForUser(userId),
  });

  if (!contest || contest.visibility !== "PRIVATE") {
    throw new ApiError(404, "Private league not found");
  }
  if (deriveStatus(contest) === "ENDED") {
    throw new ApiError(400, "This league has already ended");
  }
  if (contest.ownerId === userId || contest.entries.length > 0) {
    throw new ApiError(400, "You're already in this private league");
  }

  const result = await prisma.$transaction(async (tx) => {
    const entry = await tx.contestEntry.create({
      data: { contestId: contest.id, userId, balance: contest.startingBalance },
    });

    const updatedContest = await tx.contest.findUnique({
      where: { id: contest.id },
      select: buildContestSelectForUser(userId),
    });

    return { entry, contest: updatedContest };
  });

  return res.status(200).json(
    new ApiResponse(200, "Joined private league successfully", {
      entry: result.entry,
      contest: serializeContestForUser(result.contest, userId),
    })
  );
});

const getStandings = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const contest = await prisma.contest.findUnique({
    where: { id: req.params.id },
    select: { id: true, visibility: true, ownerId: true, startingBalance: true, startAt: true, endAt: true },
  });
  if (!contest) {
    throw new ApiError(404, "Contest not found");
  }

  await assertContestAccess(contest as any, userId);

  const entries = await prisma.contestEntry.findMany({
    where: { contestId: contest.id },
    include: { user: { select: { id: true, name: true, username: true, avatar: true } } },
  });

  if (entries.length === 0) {
    return res.status(200).json(
      new ApiResponse(200, "Standings fetched successfully", { status: deriveStatus(contest), standings: [] })
    );
  }

  const isSettled = entries.every((entry) => entry.finalRank !== null);

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

export {
  createContest,
  createPrivateContest,
  updateContest,
  updateContestImage,
  getContests,
  getContest,
  joinContest,
  joinPrivateContest,
  getStandings,
};
