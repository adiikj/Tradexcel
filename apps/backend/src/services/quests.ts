import { sectorOf, type Quest } from "@tradexcel/shared";
import prisma from "../db/prisma.js";
import logger from "../utils/logger.js";
import { awardBadge } from "./achievements.js";

// The Learn page's quests: each teaches one idea with a short lesson and a
// hands-on task. Progress is checked when the player opens the page and
// saved as it's reached (QuestCompletion), so a quest stays done even if,
// say, the holdings that completed it are sold later. Finishing every quest
// earns the "graduate" badge.

type QuestDef = Omit<Quest, "completedAt"> & { check: (userId: string) => Promise<boolean> };

export const QUESTS: QuestDef[] = [
  {
    id: "first_trade",
    title: "Make your first trade",
    lesson:
      "A market order buys or sells straight away at the current price. Start small: buying a few shares of a company you know is a fine first step.",
    cta: { label: "Open Market", href: "/market" },
    texQuestion: "How do I buy a stock?",
    check: async (userId) => (await prisma.transaction.count({ where: { userId } })) > 0,
  },
  {
    id: "limit_order",
    title: "Place a limit order",
    lesson:
      "A limit order only fills at your price or better. Use it when you'd rather wait for a good price than chase the current one. In the Buy window, pick Limit and set a price a little below today's.",
    cta: { label: "Open Market", href: "/market" },
    texQuestion: "What is a limit order?",
    check: async (userId) => (await prisma.queuedOrder.count({ where: { userId, orderType: "LIMIT" } })) > 0,
  },
  {
    id: "stop_loss",
    title: "Protect a position with a stop-loss",
    lesson:
      "A stop-loss sells automatically if a stock falls to your trigger price, capping how much you can lose on it. Traders often set it 5 to 10% below what they paid.",
    cta: { label: "Open Portfolio", href: "/portfolio" },
    texQuestion: "Why use a stop loss?",
    check: async (userId) => (await prisma.queuedOrder.count({ where: { userId, orderType: "STOP", side: "SELL" } })) > 0,
  },
  {
    id: "three_sectors",
    title: "Hold stocks from 3 different sectors",
    lesson:
      "Stocks in the same sector tend to move together, so owning five banks isn't much safer than owning one. Spreading across sectors is the simplest form of diversification.",
    cta: { label: "See your sector exposure", href: "/portfolio" },
    texQuestion: "What is diversification?",
    check: async (userId) => {
      const holdings = await prisma.holding.findMany({ where: { userId }, select: { symbol: true } });
      return new Set(holdings.map((h) => sectorOf(h.symbol))).size >= 3;
    },
  },
  {
    id: "price_alert",
    title: "Set a price alert",
    lesson: "Alerts let the market come to you. Pick a price that would change your mind about a stock and get an email when it gets there.",
    cta: { label: "Open Alerts", href: "/alerts" },
    texQuestion: "How do I set a price alert?",
    check: async (userId) => (await prisma.priceAlert.count({ where: { userId } })) > 0,
  },
  {
    id: "journal",
    title: "Write a trade journal note",
    lesson:
      "Write down why you made a trade while it's fresh. Reading those notes later is how you learn which of your reasons actually work.",
    cta: { label: "Open Wallet", href: "/wallet" },
    texQuestion: null,
    check: async (userId) => (await prisma.transaction.count({ where: { userId, note: { not: null } } })) > 0,
  },
  {
    id: "practice_run",
    title: "Finish a practice run",
    lesson:
      "Replay a real market episode, like the 2020 crash, one day at a time. You'll feel how fast things move, with nothing on the line.",
    cta: { label: "Start a practice run", href: "/learn#practice" },
    texQuestion: null,
    check: async (userId) => (await prisma.practiceSession.count({ where: { userId, status: "FINISHED", finalNetWorth: { not: null } } })) > 0,
  },
  {
    id: "join_contest",
    title: "Join a contest",
    lesson: "Contests give everyone the same budget and the same time window, so you can see how your decisions compare with other players'.",
    cta: { label: "Browse contests", href: "/contest" },
    texQuestion: "How do contests work?",
    check: async (userId) => (await prisma.contestEntry.count({ where: { userId } })) > 0,
  },
];

export const GRADUATE_BADGE = "graduate";

// Checks every unfinished quest, saves any newly completed, and returns the
// full list with completion times.
export async function getQuests(userId: string): Promise<Quest[]> {
  const done = await prisma.questCompletion.findMany({ where: { userId }, select: { questId: true, completedAt: true } });
  const doneAt = new Map(done.map((d) => [d.questId, d.completedAt]));

  const pending = QUESTS.filter((q) => !doneAt.has(q.id));
  const results = await Promise.all(pending.map(async (q) => ({ id: q.id, ok: await q.check(userId).catch(() => false) })));
  const newlyDone = results.filter((r) => r.ok).map((r) => r.id);
  if (newlyDone.length > 0) {
    await prisma.questCompletion.createMany({ data: newlyDone.map((questId) => ({ userId, questId })), skipDuplicates: true });
    const now = new Date();
    for (const id of newlyDone) doneAt.set(id, now);
  }

  if (doneAt.size === QUESTS.length) {
    await awardBadge(userId, GRADUATE_BADGE).catch((error) => logger.error({ err: error }, "Error awarding graduate badge"));
  }

  return QUESTS.map(({ check: _check, ...q }) => ({ ...q, completedAt: doneAt.get(q.id)?.toISOString() ?? null }));
}
