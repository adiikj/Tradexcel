import { Prisma } from "@prisma/client";
import prisma from "../db/prisma.js";
import { getQuotes } from "./pricing.js";
import { calculateHoldingsValue } from "./tradeMath.js";

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
    const holdingsValue = calculateHoldingsValue(user.holdings, quotes);
    result.set(user.id, user.wallet!.balance.add(holdingsValue));
  }

  return result;
}
