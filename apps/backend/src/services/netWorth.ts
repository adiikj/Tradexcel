import { Prisma } from "@prisma/client";
import prisma from "../db/prisma.js";
import { getQuotes } from "./pricing.js";

// Shared by the leaderboard and contest standings: given a set of users,
// batch-fetch live quotes once across every symbol anyone holds and compute
// net worth = wallet cash + holdings value. A failed quote falls back to the
// position's cost basis (zero P&L for that holding) rather than breaking the
// whole computation — same hardening rule as the portfolio endpoint.
export async function computeNetWorths(userIds?: string[]): Promise<Map<string, Prisma.Decimal>> {
  const users = await prisma.user.findMany({
    where: {
      otpVerified: true,
      wallet: { isNot: null },
      ...(userIds ? { id: { in: userIds } } : {}),
    },
    select: {
      id: true,
      wallet: { select: { balance: true } },
      holdings: { select: { symbol: true, quantity: true, avgBuyPrice: true } },
    },
  });

  const allSymbols = [...new Set(users.flatMap((u) => u.holdings.map((h) => h.symbol)))];
  const quotes = allSymbols.length > 0 ? await getQuotes(allSymbols) : {};

  const result = new Map<string, Prisma.Decimal>();
  for (const user of users) {
    const holdingsValue = user.holdings.reduce((sum, holding) => {
      const quote = quotes[holding.symbol];
      const price = quote ? new Prisma.Decimal(quote.price) : holding.avgBuyPrice;
      return sum.add(price.mul(holding.quantity));
    }, new Prisma.Decimal(0));

    result.set(user.id, user.wallet!.balance.add(holdingsValue));
  }

  return result;
}
