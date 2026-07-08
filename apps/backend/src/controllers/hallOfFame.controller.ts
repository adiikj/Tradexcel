import { Response } from "express";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import prisma from "../db/prisma.js";
import { getRankings } from "./leaderboard.controller.js";

interface AuthRequest {
  user?: { id: string };
  query: any;
}

const RECENT_WEEKS = 8;
const RECENT_CHAMPIONS = 20;

const getHallOfFame = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const [rankings, championEntries, recentWeeks] = await Promise.all([
    getRankings(),
    prisma.contestEntry.findMany({
      where: { finalRank: 1, contest: { status: "ENDED" } },
      orderBy: { contest: { endAt: "desc" } },
      take: RECENT_CHAMPIONS,
      include: {
        user: { select: { id: true, name: true, username: true, avatar: true } },
        contest: { select: { id: true, name: true, endAt: true, prize: true } },
      },
    }),
    prisma.weeklySnapshot.groupBy({
      by: ["weekStart"],
      _max: { pnlPercent: true },
      orderBy: { weekStart: "desc" },
      take: RECENT_WEEKS,
    }),
  ]);

  const weeklyChampions = (
    await Promise.all(
      recentWeeks.map((week) =>
        prisma.weeklySnapshot.findFirst({
          where: { weekStart: week.weekStart, pnlPercent: week._max.pnlPercent ?? undefined },
          include: { user: { select: { id: true, name: true, username: true, avatar: true } } },
        })
      )
    )
  )
    .filter((snapshot): snapshot is NonNullable<typeof snapshot> => snapshot !== null)
    .map((snapshot) => ({
      weekStart: snapshot.weekStart,
      weekEnd: snapshot.weekEnd,
      pnlPercent: snapshot.pnlPercent.toNumber(),
      user: snapshot.user,
    }));

  return res.status(200).json(
    new ApiResponse(200, "Hall of fame fetched successfully", {
      topNetWorth: rankings.slice(0, 10),
      contestChampions: championEntries.map((entry) => ({
        userId: entry.userId,
        user: entry.user,
        contestId: entry.contest.id,
        contestName: entry.contest.name,
        prize: entry.contest.prize,
        endAt: entry.contest.endAt,
        finalNetWorth: entry.finalNetWorth?.toNumber() ?? null,
      })),
      weeklyChampions,
    })
  );
});

export { getHallOfFame };
