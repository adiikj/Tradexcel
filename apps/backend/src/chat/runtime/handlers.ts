import { Prisma } from "@prisma/client";
import type { ChatQuote, ChatReply } from "@tradexcel/shared";
import prisma from "../../db/prisma.js";
import { getQuotes } from "../../services/pricing.js";
import { getNextOpenLabel, isMarketOpen } from "../../services/marketHours.js";
import { STARTING_BALANCE } from "../../services/tradeMath.js";
import { getTitle } from "../../services/titles.js";
import { BADGE_CATALOG } from "../../services/achievements.js";
import { computeContestNetWorths } from "../../services/contestNetWorth.js";
import { getRankings } from "../../controllers/leaderboard.controller.js";
import { deriveStatus } from "../../controllers/contest.controller.js";
import { arrow, fullName, inr, shortDate, shortName, signedInr, signedPct } from "./format.js";
import type { EntitiesFile, LinkResult } from "./linker.js";

// Answers for the live-data intents. Each reuses the same service the
// matching page uses, so the assistant never disagrees with the app.

export type DataContext = {
  userId: string;
  link: LinkResult;
  ambiguous: EntitiesFile["ambiguous"]; // details of any ambiguous words in link.ambiguous
};
export type DataAnswer = Pick<ChatReply, "text" | "links" | "suggestions"> & { quotes?: ChatQuote[] };

const MAX_STOCKS = 3;

function closedNote(): string {
  return isMarketOpen() ? "" : `\n\nThe market is closed, so these are the last closing prices. ${getNextOpenLabel()} IST.`;
}

// "hdfc" defaulted to HDFC Bank: say so, and name the alternatives.
function assumptionNote(ctx: DataContext): string {
  return ctx.ambiguous
    .filter((a) => a.default && ctx.link.symbols.includes(a.default))
    .map((a) => `\n\nI took “${a.term}” to mean ${fullName(a.default!)}. For ${a.candidates.filter((c) => c !== a.default).map(fullName).join(" or ")}, ask by name.`)
    .join("");
}

function whichStock(ctx: DataContext, suffix: string): DataAnswer | null {
  if (ctx.link.symbols.length > 0) return null;
  const amb = ctx.ambiguous.find((a) => !a.default);
  if (amb) {
    return {
      text: `There are a few **${amb.term}** companies. Which one did you mean?`,
      links: [],
      suggestions: amb.candidates.slice(0, 4).map((s) => `${shortName(s)} ${suffix}`),
    };
  }
  return {
    text: "Hmm, I couldn't find a listed stock in that. Try the company name or NSE symbol, like “TCS price”. I know the 250+ stocks on the Market page.",
    links: [{ label: "Browse stocks", href: "/market" }],
    suggestions: ["Reliance price", "Which stocks can I trade?"],
  };
}

async function quotesFor(symbols: string[]): Promise<ChatQuote[]> {
  const quotes = await getQuotes(symbols);
  return symbols.flatMap((s) => {
    const q = quotes[s.toUpperCase()];
    return q ? [{ symbol: s, name: shortName(s), price: q.price, change: q.change, changePercent: q.changePercent }] : [];
  });
}

async function priceQuote(ctx: DataContext): Promise<DataAnswer> {
  const ask = whichStock(ctx, "price");
  if (ask) return ask;
  const symbols = ctx.link.symbols.slice(0, MAX_STOCKS);
  const quotes = await quotesFor(symbols);
  const lines = symbols.map((s) => {
    const q = quotes.find((x) => x.symbol === s);
    if (!q) return `- **${shortName(s)}**: I couldn't get a live price right now.`;
    const move = q.changePercent == null ? "" : ` ${arrow(q.change)} ${signedPct(q.changePercent)}${q.change == null ? "" : ` (${signedInr(q.change)})`} today`;
    return `- **${shortName(s)}** (${fullName(s)}): **${inr(q.price)}**${move}`;
  });
  const lead = symbols.length > 1 ? "Here's how they're trading:" : "Here's the latest:";
  return {
    text: `${lead}\n${lines.join("\n")}` + closedNote() + assumptionNote(ctx),
    links: symbols.slice(0, 2).map((s) => ({ label: `${shortName(s)} chart`, href: `/market?symbol=${encodeURIComponent(s)}` })),
    suggestions: symbols.length === 1 ? [`How is my ${shortName(symbols[0])} doing?`, "How do I set a price alert?"] : ["What's my portfolio worth?"],
    quotes,
  };
}

async function holdingDetail(ctx: DataContext): Promise<DataAnswer> {
  if (ctx.link.symbols.length === 0) {
    if (ctx.ambiguous.some((a) => !a.default)) return whichStock(ctx, "holding")!;
    // No stock named: offer the ones they actually hold.
    const held = await prisma.holding.findMany({ where: { userId: ctx.userId }, select: { symbol: true }, orderBy: { symbol: "asc" }, take: 4 });
    if (held.length === 0) {
      return { text: "You're not holding any stocks right now. Want to find one to start with?", links: [{ label: "Find a stock", href: "/market" }], suggestions: ["How do I buy a stock?"] };
    }
    return {
      text: "Sure! Which holding should I check?",
      links: [{ label: "Open Portfolio", href: "/portfolio" }],
      suggestions: held.map((h) => `How is my ${shortName(h.symbol)} doing?`),
    };
  }
  const symbols = ctx.link.symbols.slice(0, MAX_STOCKS);
  const [holdings, quotes] = await Promise.all([
    prisma.holding.findMany({ where: { userId: ctx.userId, symbol: { in: symbols } } }),
    quotesFor(symbols),
  ]);
  const lines = symbols.map((s) => {
    const h = holdings.find((x) => x.symbol === s);
    const q = quotes.find((x) => x.symbol === s);
    if (!h) return `- You don't hold **${shortName(s)}** right now${q ? ` (it's at ${inr(q.price)})` : ""}.`;
    const invested = h.avgBuyPrice.toNumber() * h.quantity;
    if (!q) return `- **${shortName(s)}**: ${h.quantity} shares, average ${inr(h.avgBuyPrice.toNumber())}. I couldn't get a live price right now.`;
    const value = q.price * h.quantity;
    const pnl = value - invested;
    return `- **${shortName(s)}**: ${h.quantity} shares at an average of ${inr(h.avgBuyPrice.toNumber())}, now ${inr(q.price)}. Worth **${inr(value)}**, ${arrow(pnl)} ${signedInr(pnl)} (${signedPct((pnl / invested) * 100)}).`;
  });
  return {
    text: lines.join("\n") + closedNote() + assumptionNote(ctx),
    links: [{ label: "Open Portfolio", href: "/portfolio" }],
    suggestions: ["What's my portfolio worth?", "What's my rank?"],
    quotes,
  };
}

async function portfolioSummary(ctx: DataContext): Promise<DataAnswer> {
  const [wallet, holdings] = await Promise.all([
    prisma.wallet.findUnique({ where: { userId: ctx.userId } }),
    prisma.holding.findMany({ where: { userId: ctx.userId } }),
  ]);
  if (!wallet) return { text: "I couldn't find your wallet. Try signing out and back in.", links: [], suggestions: [] };
  const quotes = await getQuotes(holdings.map((h) => h.symbol));
  // Same fallback as the Portfolio page: no live price -> value at cost.
  const rows = holdings.map((h) => {
    const invested = h.avgBuyPrice.mul(h.quantity);
    const price = quotes[h.symbol]?.price;
    const value = price != null ? new Prisma.Decimal(price).mul(h.quantity) : invested;
    return { symbol: h.symbol, invested: invested.toNumber(), value: value.toNumber() };
  });
  const cash = wallet.balance.toNumber();
  const holdingsValue = rows.reduce((s, r) => s + r.value, 0);
  const invested = rows.reduce((s, r) => s + r.invested, 0);
  const netWorth = cash + holdingsValue;
  const season = netWorth - STARTING_BALANCE;
  // A little encouragement, never advice.
  const mood = season > 0 ? " Nice, you're in the green." : season < 0 ? " A tough stretch so far, but there's still time." : "";
  const lines = [
    `Your net worth is **${inr(netWorth)}**, ${arrow(season)} ${signedInr(season)} (${signedPct((season / STARTING_BALANCE) * 100)}) this season.${mood}`,
    `- Cash: ${inr(cash)}`,
    `- ${rows.length} holding${rows.length === 1 ? "" : "s"} worth ${inr(holdingsValue)}${invested > 0 ? ` (${signedInr(holdingsValue - invested)} on ${inr(invested)} invested)` : ""}`,
  ];
  if (rows.length > 1) {
    const byPct = [...rows].filter((r) => r.invested > 0).sort((a, b) => b.value / b.invested - a.value / a.invested);
    const best = byPct[0];
    const worst = byPct[byPct.length - 1];
    lines.push(`- Best: **${shortName(best.symbol)}** ${signedPct((best.value / best.invested - 1) * 100)}; worst: **${shortName(worst.symbol)}** ${signedPct((worst.value / worst.invested - 1) * 100)}`);
  }
  return {
    text: lines.join("\n") + (rows.length ? closedNote() : ""),
    links: [{ label: "Open Portfolio", href: "/portfolio" }],
    suggestions: ["What's my rank?", "Which badges am I missing?"],
  };
}

async function myRank(ctx: DataContext): Promise<DataAnswer> {
  const rankings = await getRankings();
  const me = rankings.find((r) => r.userId === ctx.userId);
  if (!me) return { text: "You're not on the leaderboard yet. It updates once your account is verified and has a wallet.", links: [], suggestions: [] };
  const title = getTitle(me.totalPnlPercent, me.rank);
  const above = me.rank > 1 ? rankings[me.rank - 2] : null;
  const lines = [
    `You're **#${me.rank}** of ${rankings.length} players, with a net worth of ${inr(me.netWorth)} (${signedPct(me.totalPnlPercent)}).`,
    `Your title: ${title.icon} **${title.name}**.`,
    above
      ? `You're ${inr(above.netWorth - me.netWorth)} behind #${above.rank} (@${above.username}).${me.rank <= 10 ? " Top 10, nice work!" : ""}`
      : "You're at the very top. Well played!",
  ];
  return { text: lines.join("\n"), links: [{ label: "Open Leaderboard", href: "/leaderboard" }], suggestions: ["How is the leaderboard ranked?", "What are titles?"] };
}

async function myAchievements(ctx: DataContext): Promise<DataAnswer> {
  const [earned, user] = await Promise.all([
    prisma.userBadge.findMany({ where: { userId: ctx.userId }, orderBy: { earnedAt: "desc" } }),
    prisma.user.findUnique({ where: { id: ctx.userId }, select: { currentStreak: true, longestStreak: true } }),
  ]);
  const have = new Set(earned.map((b) => b.badgeId));
  const byId = new Map(BADGE_CATALOG.map((b) => [b.id, b]));
  const latest = earned[0] && byId.get(earned[0].badgeId);
  const missing = BADGE_CATALOG.filter((b) => !have.has(b.id)).slice(0, 3);
  const tally =
    have.size === 0
      ? "No badges yet, but your first trade earns one."
      : have.size === BADGE_CATALOG.length
        ? `You've collected all **${have.size}** badges. Impressive!`
        : `You've earned **${have.size} of ${BADGE_CATALOG.length}** badges.${latest ? ` Latest: ${latest.icon} ${latest.name}.` : ""}`;
  const lines = [
    tally,
    `Login streak: **${user?.currentStreak ?? 0} day${user?.currentStreak === 1 ? "" : "s"}** (best ${user?.longestStreak ?? 0}).`,
  ];
  if (missing.length) lines.push("Some you could go for next:", ...missing.map((b) => `- ${b.icon} **${b.name}**: ${b.description}`));
  return { text: lines.join("\n"), links: [{ label: "Open Achievements", href: "/achievements" }], suggestions: ["How do streaks work?"] };
}

async function myContests(ctx: DataContext): Promise<DataAnswer> {
  const entries = await prisma.contestEntry.findMany({
    where: { userId: ctx.userId },
    include: { contest: { select: { id: true, name: true, startAt: true, endAt: true, startingBalance: true } } },
    orderBy: { joinedAt: "desc" },
    take: 5,
  });
  if (entries.length === 0) {
    return { text: "You haven't joined any contests yet. They're a fun way to compete with others, and they don't touch your weekly wallet.", links: [{ label: "Open Contests", href: "/contest" }], suggestions: ["How do contests work?", "How do I create a private league?"] };
  }
  const lines = await Promise.all(
    entries.map(async (e) => {
      const status = deriveStatus(e.contest);
      if (status === "ENDED" && e.finalRank != null) return `- **${e.contest.name}**: finished **#${e.finalRank}** with ${inr(e.finalNetWorth!.toNumber())}.`;
      if (status === "UPCOMING") return `- **${e.contest.name}**: starts ${shortDate(e.contest.startAt)}.`;
      if (status === "ENDED") return `- **${e.contest.name}**: ended; final results are being calculated.`;
      const [netWorths, all] = await Promise.all([
        computeContestNetWorths(e.contest.id),
        prisma.contestEntry.findMany({ where: { contestId: e.contest.id }, select: { id: true, balance: true } }),
      ]);
      const worth = (id: string, balance: Prisma.Decimal) => (netWorths.get(id) ?? balance).toNumber();
      const mine = worth(e.id, e.balance);
      const rank = 1 + all.filter((o) => worth(o.id, o.balance) > mine).length;
      const delta = mine - e.contest.startingBalance.toNumber();
      return `- **${e.contest.name}**: **#${rank}** of ${all.length}, net worth ${inr(mine)} (${signedInr(delta)}), ends ${shortDate(e.contest.endAt)}.`;
    })
  );
  return { text: lines.join("\n"), links: [{ label: "Open Contests", href: "/contest" }], suggestions: ["How are contest winners decided?"] };
}

async function myAlerts(ctx: DataContext): Promise<DataAnswer> {
  const alerts = await prisma.priceAlert.findMany({
    where: { userId: ctx.userId, ...(ctx.link.symbols.length ? { symbol: { in: ctx.link.symbols } } : {}) },
    orderBy: { createdAt: "desc" },
    take: 8,
  });
  if (alerts.length === 0) {
    const about = ctx.link.symbols.length ? ` for ${ctx.link.symbols.map(shortName).join(", ")}` : "";
    return { text: `You don't have any price alerts${about} yet. Set one and I'll make sure you get an email when the price hits.`, links: [{ label: "Set an alert", href: "/alerts" }], suggestions: ["How do I set a price alert?"] };
  }
  const lines = alerts.map((a) => {
    const target = `${shortName(a.symbol)} ${a.direction === "ABOVE" ? "above" : "below"} ${inr(a.targetPrice.toNumber())}`;
    return a.triggered ? `- ✅ ${target}: triggered ${a.triggeredAt ? shortDate(a.triggeredAt) : ""}` : `- ⏳ ${target}: active`;
  });
  return { text: lines.join("\n"), links: [{ label: "Open Alerts", href: "/alerts" }], suggestions: ["How do alerts work?"] };
}

async function myOrders(ctx: DataContext): Promise<DataAnswer> {
  const symbolFilter = ctx.link.symbols.length ? { symbol: { in: ctx.link.symbols } } : {};
  const [pending, recent] = await Promise.all([
    prisma.queuedOrder.findMany({ where: { userId: ctx.userId, status: "PENDING", ...symbolFilter }, orderBy: { createdAt: "asc" }, take: 5 }),
    prisma.transaction.findMany({ where: { userId: ctx.userId, ...symbolFilter }, orderBy: { createdAt: "desc" }, take: 3 }),
  ]);
  const lines: string[] = [];
  if (pending.length) {
    lines.push(`**${pending.length} order${pending.length === 1 ? "" : "s"} waiting for the market to open:**`);
    lines.push(...pending.map((o) => `- ${o.side === "BUY" ? "Buy" : "Sell"} ${o.quantity} ${shortName(o.symbol)} (last price ${inr(o.quotedPrice.toNumber())})`));
  } else {
    lines.push("Nothing's waiting for the market to open right now.");
  }
  if (recent.length) {
    lines.push("**Recent trades:**");
    lines.push(...recent.map((t) => `- ${shortDate(t.createdAt)}: ${t.side === "BUY" ? "bought" : "sold"} ${t.quantity} ${shortName(t.symbol)} at ${inr(t.price.toNumber())}`));
  }
  return {
    text: lines.join("\n"),
    links: [{ label: "Open Portfolio", href: "/portfolio" }, { label: "All transactions", href: "/wallet" }],
    suggestions: pending.length ? ["How do I cancel a queued order?"] : ["What's my portfolio worth?"],
  };
}

export const DATA_HANDLERS: Record<string, (ctx: DataContext) => Promise<DataAnswer>> = {
  price_quote: priceQuote,
  holding_detail: holdingDetail,
  portfolio_summary: portfolioSummary,
  my_rank: myRank,
  my_achievements: myAchievements,
  my_contests: myContests,
  my_alerts: myAlerts,
  my_orders: myOrders,
};
