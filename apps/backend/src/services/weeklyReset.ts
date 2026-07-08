import { Prisma } from "@prisma/client";
import prisma from "../db/prisma.js";
import { getQuotes } from "./pricing.js";
import { calculateHoldingsValue, STARTING_BALANCE } from "./tradeMath.js";
import { awardWeeklyChampion } from "./achievements.js";

// Weeks are aligned to Monday 00:00 UTC regardless of when the job actually
// ticks, so the boundary is stable even if the server was briefly down.
function getMostRecentMonday(date: Date): Date {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const daysSinceMonday = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - daysSinceMonday);
  return d;
}

// Closes out the week that just ended for every player: snapshots their net
// worth (cash + mark-to-market holdings) against the fixed starting balance,
// then force-liquidates holdings and resets the wallet back to a fresh
// STARTING_BALANCE for the new week. Guarded by the [userId, weekStart]
// unique constraint so re-running mid-week (e.g. a server restart) is a
// harmless no-op once a user's snapshot for that week already exists.
export async function runWeeklyReset(): Promise<number> {
  const weekEnd = getMostRecentMonday(new Date());
  const weekStart = new Date(weekEnd);
  weekStart.setUTCDate(weekStart.getUTCDate() - 7);

  const users = await prisma.user.findMany({
    where: { otpVerified: true, wallet: { isNot: null } },
    select: {
      id: true,
      wallet: { select: { balance: true } },
      holdings: { select: { symbol: true, quantity: true, avgBuyPrice: true } },
    },
  });

  if (users.length === 0) return 0;

  const allSymbols = [...new Set(users.flatMap((u) => u.holdings.map((h) => h.symbol)))];
  const quotes = allSymbols.length > 0 ? await getQuotes(allSymbols) : {};

  let resetCount = 0;

  for (const user of users) {
    const holdingsValue = calculateHoldingsValue(user.holdings, quotes);
    const endNetWorth = user.wallet!.balance.add(holdingsValue);
    const pnlPercent = endNetWorth.sub(STARTING_BALANCE).div(STARTING_BALANCE).mul(100);

    try {
      await prisma.$transaction([
        prisma.weeklySnapshot.create({
          data: {
            userId: user.id,
            weekStart,
            weekEnd,
            startBalance: new Prisma.Decimal(STARTING_BALANCE),
            endNetWorth,
            pnlPercent,
          },
        }),
        prisma.holding.deleteMany({ where: { userId: user.id } }),
        prisma.wallet.update({ where: { userId: user.id }, data: { balance: STARTING_BALANCE } }),
      ]);
      resetCount += 1;
    } catch (error: any) {
      if (error?.code !== "P2002") {
        console.error(`Weekly reset failed for user ${user.id}:`, error.message);
      }
    }
  }

  // Idempotent (awardBadge no-ops on an already-earned badge), so it's safe
  // to call this every run rather than only when resetCount > 0.
  await awardWeeklyChampion(weekStart).catch((error) => console.error("Error awarding weekly champion:", error));

  return resetCount;
}
