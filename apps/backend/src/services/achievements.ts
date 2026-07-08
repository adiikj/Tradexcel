import prisma from "../db/prisma.js";
import { computeNetWorths } from "./netWorth.js";
import { getQuotes } from "./pricing.js";
import { STARTING_BALANCE } from "./tradeMath.js";
import { getRankings } from "../controllers/leaderboard.controller.js";

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  // Emoji placeholder - real artwork lands later, swap to an iconUrl then.
  icon: string;
}

// Definitions live in code, not the DB - only *earned* records are persisted
// (UserBadge, keyed by this id), so adding/editing a badge never needs a
// migration.
export const BADGE_CATALOG: BadgeDefinition[] = [
  { id: "first_trade", name: "First Trade", description: "Placed your first buy order.", icon: "🎉" },
  { id: "in_the_green", name: "In the Green", description: "Your net worth is above your starting balance.", icon: "💰" },
  { id: "century_club", name: "Century Club", description: "Your net worth reached 2x your starting balance.", icon: "💯" },
  { id: "big_winner", name: "Big Winner", description: "A single holding is up 20% or more.", icon: "📈" },
  { id: "diversified", name: "Diversified", description: "Holding 5 or more different stocks at once.", icon: "🎯" },
  { id: "streak_3", name: "3-Day Streak", description: "Logged in 3 days in a row.", icon: "🔥" },
  { id: "streak_7", name: "Weekly Warrior", description: "Logged in 7 days in a row.", icon: "🔥" },
  { id: "streak_30", name: "Monthly Regular", description: "Logged in 30 days in a row.", icon: "🔥" },
  { id: "contest_champion", name: "Contest Champion", description: "Finished #1 in a contest.", icon: "🏆" },
  { id: "podium_finish", name: "Podium Finish", description: "Finished top 3 in a contest.", icon: "🥉" },
  { id: "weekly_champion", name: "Weekly Champion", description: "Had the best return of any player in a week.", icon: "👑" },
  { id: "top_of_leaderboard", name: "King of the Hill", description: "Reached #1 on the global leaderboard.", icon: "🏔️" },
  { id: "league_host", name: "Community Host", description: "Created a private contest.", icon: "🎪" },
  { id: "social_butterfly", name: "Social Butterfly", description: "Gained 10 followers.", icon: "🤝" },
  { id: "green_shoots", name: "Green Shoots", description: "Finished a week in the green for the first time.", icon: "🌱" },
  { id: "steady_grower", name: "Steady Grower", description: "Closed your last 3 weeks all in the green.", icon: "🛡️" },
  { id: "team_player", name: "Team Player", description: "Joined your first contest.", icon: "🧑‍🤝‍🧑" },
  { id: "networker", name: "Networker", description: "Followed 5 or more traders.", icon: "🤜🤛" },
];

const BADGE_MAP = new Map(BADGE_CATALOG.map((b) => [b.id, b]));

// Creates the UserBadge + a notification, but only the first time - relies
// on the (userId, badgeId) unique constraint rather than a pre-check, so
// concurrent callers can't double-award.
async function awardBadge(userId: string, badgeId: string): Promise<boolean> {
  const badge = BADGE_MAP.get(badgeId);
  if (!badge) return false;

  try {
    await prisma.userBadge.create({ data: { userId, badgeId } });
  } catch (error: any) {
    if (error?.code === "P2002") return false; // already earned
    throw error;
  }

  await prisma.notification.create({
    data: {
      userId,
      type: "ACHIEVEMENT",
      message: `${badge.icon} You earned "${badge.name}"!`,
      link: "/achievements",
    },
  });

  return true;
}

// Runs every independent, per-user check and awards whatever newly
// qualifies. Fire-and-forget at every call site (see hook points) - never
// blocks or shapes an HTTP response.
export async function checkAndAwardAchievements(userId: string): Promise<string[]> {
  const awarded: string[] = [];

  const [user, transactionCount, holdings, followerCount, followingCount, contestEntries, contestEntryCount, hostedCount, weeklySnapshots] =
    await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { currentStreak: true } }),
      prisma.transaction.count({ where: { userId } }),
      prisma.holding.findMany({ where: { userId }, select: { symbol: true, quantity: true, avgBuyPrice: true } }),
      prisma.follow.count({ where: { followingId: userId } }),
      prisma.follow.count({ where: { followerId: userId } }),
      prisma.contestEntry.findMany({ where: { userId, finalRank: { not: null } }, select: { finalRank: true } }),
      prisma.contestEntry.count({ where: { userId } }),
      prisma.contest.count({ where: { ownerId: userId } }),
      prisma.weeklySnapshot.findMany({ where: { userId }, orderBy: { weekStart: "desc" }, select: { pnlPercent: true } }),
    ]);

  if (!user) return awarded;

  const tryAward = async (badgeId: string, condition: boolean) => {
    if (condition && (await awardBadge(userId, badgeId))) awarded.push(badgeId);
  };

  await tryAward("first_trade", transactionCount >= 1);
  await tryAward("diversified", holdings.length >= 5);
  await tryAward("social_butterfly", followerCount >= 10);
  await tryAward("league_host", hostedCount >= 1);
  await tryAward("streak_3", user.currentStreak >= 3);
  await tryAward("streak_7", user.currentStreak >= 7);
  await tryAward("streak_30", user.currentStreak >= 30);
  await tryAward("contest_champion", contestEntries.some((e) => e.finalRank === 1));
  await tryAward("podium_finish", contestEntries.some((e) => e.finalRank !== null && e.finalRank <= 3));
  await tryAward("team_player", contestEntryCount >= 1);
  await tryAward("networker", followingCount >= 5);
  await tryAward(
    "green_shoots",
    weeklySnapshots.some((s) => s.pnlPercent.toNumber() > 0)
  );
  await tryAward(
    "steady_grower",
    weeklySnapshots.length >= 3 && weeklySnapshots.slice(0, 3).every((s) => s.pnlPercent.toNumber() >= 0)
  );

  const netWorths = await computeNetWorths([userId]);
  const netWorth = netWorths.get(userId)?.toNumber() ?? STARTING_BALANCE;
  await tryAward("in_the_green", netWorth > STARTING_BALANCE);
  await tryAward("century_club", netWorth >= STARTING_BALANCE * 2);

  if (holdings.length > 0) {
    const quotes = await getQuotes(holdings.map((h) => h.symbol));
    const hasBigWinner = holdings.some((h) => {
      const quote = quotes[h.symbol];
      if (!quote) return false;
      const avg = h.avgBuyPrice.toNumber();
      return avg > 0 && (quote.price - avg) / avg >= 0.2;
    });
    await tryAward("big_winner", hasBigWinner);
  }

  // getRankings() is cached for 45s (see leaderboard.controller.ts), so
  // calling it here on every login/trade doesn't add real load.
  const rankings = await getRankings();
  const myRank = rankings.find((r) => r.userId === userId)?.rank;
  await tryAward("top_of_leaderboard", myRank === 1);

  return awarded;
}

// Called once by the weekly-reset job after all snapshots for a week are
// written - awards weekly_champion to whoever had the best pnlPercent that
// week. A tie means everyone tied for best gets it.
export async function awardWeeklyChampion(weekStart: Date): Promise<string[]> {
  const snapshots = await prisma.weeklySnapshot.findMany({ where: { weekStart } });
  if (snapshots.length === 0) return [];

  const best = snapshots.reduce((max, s) => (s.pnlPercent.gt(max) ? s.pnlPercent : max), snapshots[0].pnlPercent);
  const winners = snapshots.filter((s) => s.pnlPercent.equals(best));

  const awardedUserIds: string[] = [];
  for (const winner of winners) {
    if (await awardBadge(winner.userId, "weekly_champion")) awardedUserIds.push(winner.userId);
  }
  return awardedUserIds;
}
