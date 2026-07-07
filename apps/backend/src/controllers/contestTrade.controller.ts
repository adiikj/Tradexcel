import { Prisma } from "@prisma/client";
import { Response } from "express";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import prisma from "../db/prisma.js";
import { resolveContestPrice, resolveContestQuotes } from "../services/contestPricing.js";
import {
  tradeSchema,
  computeWeightedAvgPrice,
  computeRemainingQuantity,
  canAfford,
  canSell,
} from "../services/tradeMath.js";
import { deriveStatus } from "./contest.controller.js";

interface AuthRequest {
  user?: { id: string };
  params: any;
  body: any;
}

// Shared by buy/sell: a contest must be LIVE and the caller must have joined
// it before any contest-scoped trade can happen.
async function loadLiveContestEntry(contestId: string, userId: string) {
  const contest = await prisma.contest.findUnique({ where: { id: contestId } });
  if (!contest) {
    throw new ApiError(404, "Contest not found");
  }

  const status = deriveStatus(contest);
  if (status !== "LIVE") {
    throw new ApiError(
      400,
      status === "UPCOMING" ? "This contest hasn't started yet" : "This contest has already ended"
    );
  }

  const entry = await prisma.contestEntry.findUnique({
    where: { contestId_userId: { contestId, userId } },
  });
  if (!entry) {
    throw new ApiError(404, "You haven't joined this contest");
  }

  return { contest, entry };
}

const buyContestStock = asyncHandler(async (req: AuthRequest, res: Response) => {
  const parsed = tradeSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ApiError(400, "Invalid input", parsed.error.issues);
  }
  const { symbol, quantity } = parsed.data;
  const userId = req.user!.id;
  const contestId = req.params.id;

  const { contest, entry } = await loadLiveContestEntry(contestId, userId);
  if (!contest.symbols.includes(symbol)) {
    throw new ApiError(400, `${symbol} is not in this contest's stock universe`);
  }

  const price = await resolveContestPrice(contest, symbol);
  const total = price.mul(quantity);

  const result = await prisma.$transaction(async (tx) => {
    const currentEntry = await tx.contestEntry.findUnique({ where: { id: entry.id } });
    if (!currentEntry) {
      throw new ApiError(404, "Contest entry not found");
    }
    if (!canAfford(total, currentEntry.balance)) {
      throw new ApiError(400, "Insufficient funds for this trade");
    }

    const updatedEntry = await tx.contestEntry.update({
      where: { id: entry.id },
      data: { balance: { decrement: total } },
    });

    const existingHolding = await tx.contestHolding.findUnique({
      where: { contestEntryId_symbol: { contestEntryId: entry.id, symbol } },
    });

    const holding = existingHolding
      ? await tx.contestHolding.update({
          where: { contestEntryId_symbol: { contestEntryId: entry.id, symbol } },
          data: {
            quantity: existingHolding.quantity + quantity,
            avgBuyPrice: computeWeightedAvgPrice(
              existingHolding.quantity,
              existingHolding.avgBuyPrice,
              quantity,
              total
            ),
          },
        })
      : await tx.contestHolding.create({
          data: { contestEntryId: entry.id, symbol, quantity, avgBuyPrice: price },
        });

    const transaction = await tx.contestTransaction.create({
      data: { contestEntryId: entry.id, symbol, side: "BUY", quantity, price, total },
    });

    return { entry: updatedEntry, holding, transaction };
  });

  return res
    .status(200)
    .json(new ApiResponse(200, "Stock purchased successfully", result));
});

const sellContestStock = asyncHandler(async (req: AuthRequest, res: Response) => {
  const parsed = tradeSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ApiError(400, "Invalid input", parsed.error.issues);
  }
  const { symbol, quantity } = parsed.data;
  const userId = req.user!.id;
  const contestId = req.params.id;

  const { contest, entry } = await loadLiveContestEntry(contestId, userId);

  const price = await resolveContestPrice(contest, symbol);

  const result = await prisma.$transaction(async (tx) => {
    const holding = await tx.contestHolding.findUnique({
      where: { contestEntryId_symbol: { contestEntryId: entry.id, symbol } },
    });
    if (!holding || !canSell(quantity, holding.quantity)) {
      throw new ApiError(400, "Insufficient holdings to sell");
    }

    const total = price.mul(quantity);

    const updatedEntry = await tx.contestEntry.update({
      where: { id: entry.id },
      data: { balance: { increment: total } },
    });

    const remainingQuantity = computeRemainingQuantity(holding.quantity, quantity);
    const updatedHolding =
      remainingQuantity === 0
        ? await tx.contestHolding
            .delete({ where: { contestEntryId_symbol: { contestEntryId: entry.id, symbol } } })
            .then(() => null)
        : await tx.contestHolding.update({
            where: { contestEntryId_symbol: { contestEntryId: entry.id, symbol } },
            data: { quantity: remainingQuantity },
          });

    const transaction = await tx.contestTransaction.create({
      data: { contestEntryId: entry.id, symbol, side: "SELL", quantity, price, total },
    });

    return { entry: updatedEntry, holding: updatedHolding, transaction };
  });

  return res
    .status(200)
    .json(new ApiResponse(200, "Stock sold successfully", result));
});

// A quote failing for one symbol must never take down the whole contest
// portfolio response - mirrors portfolio.controller.ts's getPortfolio.
const getContestPortfolio = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const contestId = req.params.id;

  const [contest, entry] = await Promise.all([
    prisma.contest.findUnique({ where: { id: contestId } }),
    prisma.contestEntry.findUnique({
      where: { contestId_userId: { contestId, userId } },
      include: { holdings: { orderBy: { symbol: "asc" } } },
    }),
  ]);
  if (!contest) {
    throw new ApiError(404, "Contest not found");
  }
  if (!entry) {
    throw new ApiError(404, "You haven't joined this contest");
  }

  const quotes = await resolveContestQuotes(
    contest,
    entry.holdings.map((h) => h.symbol)
  );

  let totalInvested = new Prisma.Decimal(0);
  let totalCurrentValue = new Prisma.Decimal(0);

  const enrichedHoldings = entry.holdings.map((holding) => {
    const quote = quotes[holding.symbol] ?? null;
    const investedValue = holding.avgBuyPrice.mul(holding.quantity);
    const currentPrice = quote?.price ?? null;
    const currentValue =
      currentPrice !== null
        ? new Prisma.Decimal(currentPrice).mul(holding.quantity)
        : investedValue;
    const unrealizedPnl = currentPrice !== null ? currentValue.sub(investedValue) : null;
    const unrealizedPnlPercent =
      unrealizedPnl !== null && investedValue.gt(0)
        ? unrealizedPnl.div(investedValue).mul(100)
        : null;

    totalInvested = totalInvested.add(investedValue);
    totalCurrentValue = totalCurrentValue.add(currentValue);

    return {
      ...holding,
      currentPrice,
      currentValue: currentPrice !== null ? currentValue : null,
      investedValue,
      unrealizedPnl,
      unrealizedPnlPercent,
      priceStale: currentPrice === null,
    };
  });

  const totalPnl = totalCurrentValue.sub(totalInvested);
  const netWorth = entry.balance.add(totalCurrentValue);

  const summary = {
    totalInvested,
    totalCurrentValue,
    totalPnl,
    balance: entry.balance,
    netWorth,
  };

  return res.status(200).json(
    new ApiResponse(200, "Contest portfolio fetched successfully", {
      holdings: enrichedHoldings,
      summary,
    })
  );
});

export { buyContestStock, sellContestStock, getContestPortfolio };
