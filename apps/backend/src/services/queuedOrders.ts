import { Prisma, type OrderType, type QueuedOrder, type Side } from "@prisma/client";
import prisma from "../db/prisma.js";
import { ApiError } from "../utils/ApiError.js";
import logger from "../utils/logger.js";
import { lockWallet } from "./ledgerLock.js";
import { canAfford, canSell, STARTING_BALANCE, type OrderInput } from "./tradeMath.js";
import { executeBuy, executeSell } from "./tradeExecution.js";
import { computeCharges } from "./charges.js";
import { getNextMarketOpen, isMarketOpen } from "./marketHours.js";
import { getNextWeeklyReset } from "./weeklyReset.js";
import { fetchQuoteOrThrow, getQuotes } from "./pricing.js";
import { checkAndAwardAchievements } from "./achievements.js";

// Main-wallet orders that don't fill the moment they're placed wait here:
//  - MARKET orders placed while the market is closed fill at the first live
//    price after the open.
//  - LIMIT orders fill once the price is at or better than the limit.
//  - STOP (stop-loss) orders become market orders once the price reaches the
//    trigger: a sell when it falls to it, a buy when it rises to it.
// Pending orders hold on to what they need: buys reserve cash, sells reserve
// shares, and a new order or a live trade can't spend what's reserved.
// Orders that would only run after the Monday reset belong to the new season:
// buys spend the fresh wallet, and sells aren't accepted at all (the reset
// already liquidates every holding).

export const QUEUED_MESSAGE = "Your order will be placed when market opens";
export const QUEUED_NEXT_SEASON_MESSAGE = "Your order will be placed when market opens on Monday, using your new season's wallet";

export function runsAfterWeeklyReset(now: Date = new Date()): boolean {
  return getNextMarketOpen(now) > getNextWeeklyReset(now);
}

// Would an order of this type fill at `price`? Market orders always do.
export function isTriggered(orderType: OrderType, side: Side, triggerPrice: Prisma.Decimal | null, price: Prisma.Decimal): boolean {
  if (orderType === "MARKET" || !triggerPrice) return true;
  if (orderType === "LIMIT") return side === "BUY" ? price.lte(triggerPrice) : price.gte(triggerPrice);
  return side === "BUY" ? price.gte(triggerPrice) : price.lte(triggerPrice);
}

// Cash a buy needs at a given price, charges included.
export function buyCost(quantity: number, price: Prisma.Decimal): Prisma.Decimal {
  const total = price.mul(quantity);
  return total.add(computeCharges("BUY", total).total);
}

// Cash already promised to this user's pending buys: a limit buy at its limit
// (the most it can cost), anything else at the price the user last saw.
export function reservedCash(
  pendingBuys: { quantity: number; quotedPrice: Prisma.Decimal; triggerPrice?: Prisma.Decimal | null }[]
): Prisma.Decimal {
  return pendingBuys.reduce((sum, o) => sum.add(buyCost(o.quantity, o.triggerPrice ?? o.quotedPrice)), new Prisma.Decimal(0));
}

export function displaySymbol(symbol: string): string {
  return symbol.replace(/\.(NS|BO)$/, "");
}

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });

// Throws unless this order fits alongside the user's pending ones. Call with
// the wallet locked. `cost` is what a buy needs (charges included).
async function checkAgainstPending(
  tx: Prisma.TransactionClient,
  userId: string,
  side: Side,
  symbol: string,
  quantity: number,
  cost: Prisma.Decimal,
  availableCash?: Prisma.Decimal
) {
  const pending = await tx.queuedOrder.findMany({
    where: { userId, status: "PENDING", side, ...(side === "SELL" ? { symbol } : {}) },
    select: { quantity: true, quotedPrice: true, triggerPrice: true },
  });
  const countingPending = pending.length > 0 ? " once your open orders are counted" : "";

  if (side === "BUY") {
    const wallet = await tx.wallet.findUnique({ where: { userId } });
    if (!wallet) throw new ApiError(404, "Wallet not found");
    if (!canAfford(reservedCash(pending).add(cost), availableCash ?? wallet.balance)) {
      throw new ApiError(400, `Insufficient funds for this order and its charges${countingPending}`);
    }
  } else {
    const holding = await tx.holding.findUnique({ where: { userId_symbol: { userId, symbol } } });
    const reservedQty = pending.reduce((n, o) => n + o.quantity, 0);
    if (!holding || !canSell(reservedQty + quantity, holding.quantity)) {
      throw new ApiError(400, `Insufficient holdings to sell${countingPending}`);
    }
  }
}

function pendingMessage(side: Side, orderType: OrderType, symbol: string, trigger: Prisma.Decimal | null, afterReset: boolean): string {
  const name = displaySymbol(symbol);
  const at = trigger ? inr.format(trigger.toNumber()) : "";
  if (orderType === "LIMIT") {
    return `Limit order placed. It fills if ${name} trades at or ${side === "BUY" ? "below" : "above"} ${at}.`;
  }
  if (orderType === "STOP") {
    return side === "SELL"
      ? `Stop-loss placed. If ${name} falls to ${at}, it sells at the market price.`
      : `Stop order placed. If ${name} rises to ${at}, it buys at the market price.`;
  }
  return afterReset ? QUEUED_NEXT_SEASON_MESSAGE : QUEUED_MESSAGE;
}

export type PlaceOrderResult =
  | { filled: true; result: Awaited<ReturnType<typeof executeBuy>> | Awaited<ReturnType<typeof executeSell>> }
  | { filled: false; order: QueuedOrder; message: string };

// Places a main-wallet order: fills it now if the market is open and its price
// condition already holds, otherwise leaves it pending for jobs/queuedOrders.ts.
export async function placeOrder(userId: string, side: Side, input: OrderInput): Promise<PlaceOrderResult> {
  const { symbol, quantity, orderType } = input;
  const trigger = input.triggerPrice !== undefined ? new Prisma.Decimal(input.triggerPrice) : null;

  const quote = await fetchQuoteOrThrow(symbol);
  const price = new Prisma.Decimal(quote.price);

  // A stop that has already been hit would just be a market order in disguise;
  // brokers reject it so nobody sets a "stop-loss" above the current price by mistake.
  if (orderType === "STOP" && isTriggered("STOP", side, trigger, price)) {
    throw new ApiError(
      400,
      side === "SELL"
        ? `A stop-loss sell must trigger below the current price (${inr.format(quote.price)})`
        : `A stop buy must trigger above the current price (${inr.format(quote.price)})`
    );
  }

  if (isMarketOpen() && isTriggered(orderType, side, trigger, price)) {
    const result = await prisma.$transaction(async (tx) => {
      await lockWallet(tx, userId);
      await checkAgainstPending(tx, userId, side, symbol, quantity, buyCost(quantity, price));
      return side === "BUY" ? executeBuy(tx, userId, symbol, quantity, price) : executeSell(tx, userId, symbol, quantity, price);
    });
    return { filled: true, result };
  }

  const afterReset = runsAfterWeeklyReset();
  if (side === "SELL" && afterReset) {
    throw new ApiError(
      400,
      "The market opens after Monday's weekly reset, which sells all your holdings, so sell orders can't be placed now. Buy orders are still allowed."
    );
  }

  const order = await prisma.$transaction(async (tx) => {
    // Same lock as a live trade, so two requests can't both pass the checks.
    await lockWallet(tx, userId);
    // A next-season order spends the reset wallet, not what's left of this week's.
    const available = afterReset ? new Prisma.Decimal(STARTING_BALANCE) : undefined;
    await checkAgainstPending(tx, userId, side, symbol, quantity, buyCost(quantity, trigger ?? price), available);
    return tx.queuedOrder.create({ data: { userId, side, symbol, quantity, quotedPrice: price, orderType, triggerPrice: trigger } });
  });

  return { filled: false, order, message: pendingMessage(side, orderType, symbol, trigger, afterReset) };
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

function describe(order: Pick<QueuedOrder, "side" | "quantity" | "symbol" | "orderType">): string {
  const kind = order.orderType === "LIMIT" ? "limit order" : order.orderType === "STOP" ? (order.side === "SELL" ? "stop-loss" : "stop order") : "queued order";
  return `${kind} to ${order.side === "BUY" ? "buy" : "sell"} ${order.quantity} ${displaySymbol(order.symbol)}`;
}

let filling = false;

// Runs every minute; only does work while the market is open. Each order is
// claimed (PENDING -> FILLED) inside the same transaction as its fill, so an
// overlapping run or a second server can never fill it twice.
export async function fillQueuedOrders(): Promise<{ filled: number; failed: number }> {
  const result = { filled: 0, failed: 0 };
  if (filling || !isMarketOpen()) return result;
  filling = true;

  try {
    // No cap: limit and stop orders can wait for days, and a cap would let
    // them starve newer orders behind them.
    const orders = await prisma.queuedOrder.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
    });
    if (orders.length === 0) return result;

    const quotes = await getQuotes([...new Set(orders.map((o) => o.symbol))]);

    for (const order of orders) {
      const quote = quotes[order.symbol];
      if (!quote) continue; // no price yet - retry next tick
      const price = new Prisma.Decimal(quote.price);
      if (!isTriggered(order.orderType, order.side, order.triggerPrice, price)) continue;

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
              message: `✅ Your ${describe(order)} was placed at ${inr.format(quote.price)}.`,
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
              message: `⚠️ Your ${describe(order)} couldn't be placed: ${error.message}.`,
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

// Every open order, plus the 20 most recently resolved ones.
export async function listQueuedOrders(userId: string) {
  const [pending, resolved] = await Promise.all([
    prisma.queuedOrder.findMany({ where: { userId, status: "PENDING" }, orderBy: { createdAt: "desc" } }),
    prisma.queuedOrder.findMany({ where: { userId, status: { not: "PENDING" } }, orderBy: { createdAt: "desc" }, take: 20 }),
  ]);
  return [...pending, ...resolved];
}
