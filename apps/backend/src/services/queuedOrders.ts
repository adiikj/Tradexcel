import { Prisma, type QueuedOrder, type Side } from "@prisma/client";
import prisma from "../db/prisma.js";
import { ApiError } from "../utils/ApiError.js";
import logger from "../utils/logger.js";
import { lockWallet } from "./ledgerLock.js";
import { canAfford, canSell, STARTING_BALANCE } from "./tradeMath.js";
import { executeBuy, executeSell } from "./tradeExecution.js";
import { getNextMarketOpen, isMarketOpen } from "./marketHours.js";
import { getNextWeeklyReset } from "./weeklyReset.js";
import { getQuotes } from "./pricing.js";
import { checkAndAwardAchievements } from "./achievements.js";

// Main-wallet orders placed while the market is closed wait here and fill at
// the first live price after the open. Orders that would only run after the
// Monday reset belong to the new season: buys spend the fresh wallet, and sells
// aren't accepted at all (the reset already liquidates every holding).

export const QUEUED_MESSAGE = "Your order will be placed when market opens";
export const QUEUED_NEXT_SEASON_MESSAGE = "Your order will be placed when market opens on Monday, using your new season's wallet";

export function runsAfterWeeklyReset(now: Date = new Date()): boolean {
  return getNextMarketOpen(now) > getNextWeeklyReset(now);
}

// Cash already promised to this user's other pending buys, at the prices they saw.
export function reservedCash(pendingBuys: { quantity: number; quotedPrice: Prisma.Decimal }[]): Prisma.Decimal {
  return pendingBuys.reduce((sum, o) => sum.add(o.quotedPrice.mul(o.quantity)), new Prisma.Decimal(0));
}

export function displaySymbol(symbol: string): string {
  return symbol.replace(/\.(NS|BO)$/, "");
}

export async function queueOrder(userId: string, side: Side, symbol: string, quantity: number, quotedPrice: Prisma.Decimal) {
  const afterReset = runsAfterWeeklyReset();
  if (side === "SELL" && afterReset) {
    throw new ApiError(
      400,
      "The market opens after Monday's weekly reset, which sells all your holdings, so sell orders can't be queued now. Queued buys are still allowed."
    );
  }

  const order = await prisma.$transaction(async (tx) => {
    // Same lock as a live trade, so two queue requests can't both pass the checks below.
    await lockWallet(tx, userId);
    const pending = await tx.queuedOrder.findMany({
      where: { userId, status: "PENDING", side, ...(side === "SELL" ? { symbol } : {}) },
      select: { quantity: true, quotedPrice: true },
    });
    const countingQueued = pending.length > 0 ? " once your other queued orders are counted" : "";

    if (side === "BUY") {
      const wallet = await tx.wallet.findUnique({ where: { userId } });
      if (!wallet) throw new ApiError(404, "Wallet not found");
      // A next-season order spends the reset wallet, not what's left of this week's.
      const available = afterReset ? new Prisma.Decimal(STARTING_BALANCE) : wallet.balance;
      if (!canAfford(reservedCash(pending).add(quotedPrice.mul(quantity)), available)) {
        throw new ApiError(400, `Insufficient funds for this order${countingQueued}`);
      }
    } else {
      const holding = await tx.holding.findUnique({ where: { userId_symbol: { userId, symbol } } });
      const queuedQty = pending.reduce((n, o) => n + o.quantity, 0);
      if (!holding || !canSell(queuedQty + quantity, holding.quantity)) {
        throw new ApiError(400, `Insufficient holdings to sell${countingQueued}`);
      }
    }

    return tx.queuedOrder.create({ data: { userId, side, symbol, quantity, quotedPrice } });
  });

  return { order, message: afterReset ? QUEUED_NEXT_SEASON_MESSAGE : QUEUED_MESSAGE };
}

export async function cancelQueuedOrder(userId: string, orderId: string) {
  const { count } = await prisma.queuedOrder.updateMany({
    where: { id: orderId, userId, status: "PENDING" },
    data: { status: "CANCELLED", resolvedAt: new Date() },
  });
  if (count === 0) {
    throw new ApiError(404, "That order was already placed or cancelled.");
  }
}

function describe(order: Pick<QueuedOrder, "side" | "quantity" | "symbol">): string {
  return `${order.side === "BUY" ? "buy" : "sell"} ${order.quantity} ${displaySymbol(order.symbol)}`;
}

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });

let filling = false;

// Runs every minute; only does work while the market is open. Each order is
// claimed (PENDING -> FILLED) inside the same transaction as its fill, so an
// overlapping run or a second server can never fill it twice.
export async function fillQueuedOrders(): Promise<{ filled: number; failed: number }> {
  const result = { filled: 0, failed: 0 };
  if (filling || !isMarketOpen()) return result;
  filling = true;

  try {
    const orders = await prisma.queuedOrder.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
      take: 500,
    });
    if (orders.length === 0) return result;

    const quotes = await getQuotes(orders.map((o) => o.symbol));

    for (const order of orders) {
      const quote = quotes[order.symbol];
      if (!quote) continue; // no price yet - retry next tick
      const price = new Prisma.Decimal(quote.price);

      try {
        const filled = await prisma.$transaction(async (tx) => {
          const claim = await tx.queuedOrder.updateMany({
            where: { id: order.id, status: "PENDING" },
            data: { status: "FILLED", resolvedAt: new Date() },
          });
          if (claim.count === 0) return false;

          const fill =
            order.side === "BUY"
              ? await executeBuy(tx, order.userId, order.symbol, order.quantity, price)
              : await executeSell(tx, order.userId, order.symbol, order.quantity, price);

          await tx.queuedOrder.update({ where: { id: order.id }, data: { transactionId: fill.transaction.id } });
          await tx.notification.create({
            data: {
              userId: order.userId,
              type: "ORDER",
              message: `✅ Your queued order to ${describe(order)} was placed at ${inr.format(quote.price)}.`,
              link: "/portfolio",
            },
          });
          return true;
        });

        if (filled) {
          result.filled += 1;
          checkAndAwardAchievements(order.userId).catch((error) => logger.error({ err: error }, "Error checking achievements"));
        }
      } catch (error) {
        // A 400 is a business rule (not enough cash/shares at the open) - final.
        // Anything else is infrastructure; leave the order pending to retry.
        if (!(error instanceof ApiError) || error.statusCode !== 400) {
          logger.error({ err: error }, `Filling queued order ${order.id} failed`);
          continue;
        }
        const { count } = await prisma.queuedOrder.updateMany({
          where: { id: order.id, status: "PENDING" },
          data: { status: "FAILED", failureReason: error.message, resolvedAt: new Date() },
        });
        if (count > 0) {
          result.failed += 1;
          await prisma.notification.create({
            data: {
              userId: order.userId,
              type: "ORDER",
              message: `⚠️ Your queued order to ${describe(order)} couldn't be placed: ${error.message}.`,
              link: "/portfolio",
            },
          });
        }
      }
    }
  } finally {
    filling = false;
  }

  return result;
}

export async function listQueuedOrders(userId: string) {
  return prisma.queuedOrder.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
}
