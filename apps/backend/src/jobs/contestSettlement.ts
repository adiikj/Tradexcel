import cron from "node-cron";
import prisma from "../db/prisma.js";
import { computeNetWorths } from "../services/netWorth.js";

// Freezes final standings for any contest whose endAt has passed but hasn't
// been settled yet: computes each entrant's final net worth once, ranks by
// delta from their joinNetWorth, writes finalRank/finalNetWorth, and flips
// the contest to ENDED. Also flips UPCOMING -> LIVE for contests that have
// started, so the persisted status column stays honest between reads (the
// read endpoints derive status from the clock anyway, so this isn't load
// bearing for correctness — just keeps the DB row consistent with reality).
export async function settleDueContests(): Promise<number> {
  const now = new Date();

  const dueContests = await prisma.contest.findMany({
    where: { endAt: { lte: now }, status: { not: "ENDED" } },
  });

  for (const contest of dueContests) {
    const entries = await prisma.contestEntry.findMany({ where: { contestId: contest.id } });

    if (entries.length > 0) {
      const netWorths = await computeNetWorths(entries.map((e) => e.userId));

      const ranked = entries
        .map((entry) => {
          const finalNetWorth = netWorths.get(entry.userId) ?? entry.joinNetWorth;
          return { entry, finalNetWorth, delta: finalNetWorth.sub(entry.joinNetWorth) };
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
