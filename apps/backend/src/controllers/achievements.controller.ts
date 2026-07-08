import { Response } from "express";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import prisma from "../db/prisma.js";
import { BADGE_CATALOG } from "../services/achievements.js";

interface AuthRequest {
  user?: { id: string };
  query: any;
}

const getAchievements = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;

  const earned = await prisma.userBadge.findMany({ where: { userId } });
  const earnedMap = new Map(earned.map((e) => [e.badgeId, e.earnedAt]));

  const badges = BADGE_CATALOG.map((badge) => ({
    ...badge,
    earned: earnedMap.has(badge.id),
    earnedAt: earnedMap.get(badge.id) ?? null,
  }));

  return res.status(200).json(
    new ApiResponse(200, "Achievements fetched successfully", {
      badges,
      earnedCount: earned.length,
      totalCount: BADGE_CATALOG.length,
    })
  );
});

export { getAchievements };
