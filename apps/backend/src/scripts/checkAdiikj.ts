// One-off: report + award real achievements for user "adiikj".
// Run with: npx tsx src/scripts/checkAdiikj.ts (from apps/backend)
import prisma from "../db/prisma.js";
import { checkAndAwardAchievements, BADGE_CATALOG } from "../services/achievements.js";
import { computeNetWorths } from "../services/netWorth.js";
import { STARTING_BALANCE } from "../services/tradeMath.js";

async function main() {
  const user = await prisma.user.findUnique({
    where: { username: "adiikj" },
    select: { id: true, name: true, username: true, currentStreak: true, longestStreak: true, createdAt: true },
  });

  console.log("user:", user);
  if (!user) {
    console.log("No user with username 'adiikj' found.");
    return;
  }

  const [txCount, holdings, followers, contestEntries, hosted, wallet, existingBadges] = await Promise.all([
    prisma.transaction.count({ where: { userId: user.id } }),
    prisma.holding.findMany({ where: { userId: user.id } }),
    prisma.follow.count({ where: { followingId: user.id } }),
    prisma.contestEntry.findMany({ where: { userId: user.id } }),
    prisma.contest.count({ where: { ownerId: user.id } }),
    prisma.wallet.findUnique({ where: { userId: user.id } }),
    prisma.userBadge.findMany({ where: { userId: user.id } }),
  ]);

  const netWorths = await computeNetWorths([user.id]);
  const netWorth = netWorths.get(user.id)?.toNumber() ?? STARTING_BALANCE;

  console.log("transactionCount:", txCount);
  console.log("holdings:", holdings.length, holdings.map((h) => h.symbol));
  console.log("followers:", followers);
  console.log(
    "contestEntries:",
    contestEntries.length,
    contestEntries.map((e) => ({ contestId: e.contestId, finalRank: e.finalRank }))
  );
  console.log("hostedContests:", hosted);
  console.log("wallet balance:", wallet?.balance.toString());
  console.log("netWorth:", netWorth, "STARTING_BALANCE:", STARTING_BALANCE);
  console.log("existing badges (before):", existingBadges.map((b) => b.badgeId));

  const awarded = await checkAndAwardAchievements(user.id);
  console.log("newly awarded this run:", awarded);

  const finalBadges = await prisma.userBadge.findMany({ where: { userId: user.id } });
  const finalIds = new Set(finalBadges.map((b) => b.badgeId));
  console.log(
    "final badge list:",
    BADGE_CATALOG.filter((b) => finalIds.has(b.id)).map((b) => `${b.icon} ${b.name}`)
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
