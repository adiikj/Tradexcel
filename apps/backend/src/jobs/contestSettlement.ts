import cron from "node-cron";
import prisma from "../db/prisma.js";
import { computeContestNetWorths } from "../services/contestNetWorth.js";

// Freezes final standings for contests past endAt: ranks entrants by delta
// from startingBalance, writes finalRank/finalNetWorth, flips status to ENDED.
export async function settleDueContests(): Promise<number> {
  const now = new Date();

  const dueContests = await prisma.contest.findMany({
    where: { endAt: { lte: now }, status: { not: "ENDED" } },
  });

  for (const contest of dueContests) {
    const entries = await prisma.contestEntry.findMany({ where: { contestId: contest.id } });

    if (entries.length > 0) {
      const netWorths = await computeContestNetWorths(contest.id);

      const ranked = entries
        .map((entry) => {
          const finalNetWorth = netWorths.get(entry.id) ?? entry.balance;
          return { entry, finalNetWorth, delta: finalNetWorth.sub(contest.startingBalance) };
        })
        .sort((a, b) => (b.delta.gt(a.delta) ? 1 : b.delta.lt(a.delta) ? -1 : 0))
        .map((item, index) => ({ ...item, rank: index + 1 }));

      await prisma.$transaction(
        ranked.map(({ entry, finalNetWorth, rank }) =>
          prisma.contestEntry.update({
            where: { id: entry.id },
            data: { finalRank: rank, finalNetWorth },
          })
        )
      );
    }

    await prisma.contest.update({ where: { id: contest.id }, data: { status: "ENDED" } });
  }

  await prisma.contest.updateMany({
    where: { startAt: { lte: now }, endAt: { gt: now }, status: "UPCOMING" },
    data: { status: "LIVE" },
  });

  return dueContests.length;
}

export function startContestSettlementJob() {
  // Run once at startup so newly-due contests don't wait for the next tick.
  settleDueContests().catch((error) => console.error("Contest settlement (startup) failed:", error));

  cron.schedule("* * * * *", () => {
    settleDueContests().catch((error) => console.error("Contest settlement failed:", error));
  });
}
