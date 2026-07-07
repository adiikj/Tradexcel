import { Response } from "express";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import prisma from "../db/prisma.js";
import { getNewsForSymbols } from "../services/news.js";

interface AuthRequest {
  user?: { id: string };
  query: any;
}

const getNews = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;

  const holdings = await prisma.holding.findMany({
    where: { userId },
    select: { symbol: true },
  });

  const { articles, personalized } = await getNewsForSymbols(holdings.map((h) => h.symbol));

  return res.status(200).json(
    new ApiResponse(200, "News fetched successfully", {
      articles,
      personalized,
    })
  );
});

export { getNews };
