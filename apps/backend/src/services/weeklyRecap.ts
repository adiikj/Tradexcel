import prisma from "../db/prisma.js";
import logger from "../utils/logger.js";
import { sendEmail } from "./mailer.js";
import { weeklyRecapEmailTemplate } from "./emailTemplates.js";
import { BADGE_CATALOG } from "./achievements.js";

// Resend's default rate limit is 2 emails a second; stay under it.
const SEND_GAP_MS = 600;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Ranks this week's results (best return first). Ties share a rank.
export function rankResults(results: { userId: string; pnlPercent: number }[]): Map<string, number> {
  const sorted = [...results].sort((a, b) => b.pnlPercent - a.pnlPercent);
  const ranks = new Map<string, number>();
  sorted.forEach((r, i) => {
    const prev = sorted[i - 1];
    ranks.set(r.userId, prev && prev.pnlPercent === r.pnlPercent ? ranks.get(prev.userId)! : i + 1);
  });
  return ranks;
}

// Emails each opted-in player their week, right after the weekly reset
// snapshots it. Only called with the players whose snapshot this run
// created, so a restart can't send the same week twice.
export async function sendWeeklyRecaps(weekStart: Date, weekEnd: Date, results: { userId: string; pnlPercent: number; endNetWorth: number }[]) {
  if (results.length === 0 || !process.env.RESEND_API_KEY) return 0;

  // Rank against everyone's week, not just this run's batch.
  const all = await prisma.weeklySnapshot.findMany({ where: { weekStart }, select: { userId: true, pnlPercent: true } });
  const ranks = rankResults(all.map((s) => ({ userId: s.userId, pnlPercent: s.pnlPercent.toNumber() })));

  const users = await prisma.user.findMany({
    where: { id: { in: results.map((r) => r.userId) }, weeklyRecapEmails: true },
    select: { id: true, name: true, email: true },
  });
  const byId = new Map(results.map((r) => [r.userId, r]));
  const siteUrl = (process.env.CORS_ORIGIN || "https://tradexcel.app").split(",")[0].replace(/\/$/, "");
  let sent = 0;

  for (const user of users) {
    const result = byId.get(user.id)!;
    try {
      const [trades, badges] = await Promise.all([
        prisma.transaction.count({ where: { userId: user.id, createdAt: { gte: weekStart, lt: weekEnd } } }),
        prisma.userBadge.findMany({ where: { userId: user.id, earnedAt: { gte: weekStart, lt: weekEnd } }, select: { badgeId: true } }),
      ]);
      const { subject, html, text } = weeklyRecapEmailTemplate({
        name: user.name.split(" ")[0] || user.name,
        pnlPercent: result.pnlPercent,
        endNetWorth: result.endNetWorth,
        rank: ranks.get(user.id) ?? all.length,
        players: all.length,
        trades,
        badges: badges.flatMap((b) => {
          const def = BADGE_CATALOG.find((d) => d.id === b.badgeId);
          return def ? [`${def.icon} ${def.name}`] : [];
        }),
        siteUrl,
      });
      await sendEmail({ to: user.email, subject, html, text });
      sent += 1;
    } catch (error) {
      logger.error({ err: error }, `Weekly recap email failed for ${user.id}`);
    }
    await sleep(SEND_GAP_MS);
  }
  return sent;
}
