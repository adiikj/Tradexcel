import { Prisma } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  holding: { findMany: vi.fn() },
  wallet: { findUnique: vi.fn() },
  queuedOrder: { findMany: vi.fn() },
  transaction: { findMany: vi.fn() },
}));
const quotes = vi.hoisted(() => ({ getQuotes: vi.fn() }));
const market = vi.hoisted(() => ({ open: true }));
const rankings = vi.hoisted(() => ({ getRankings: vi.fn() }));

vi.mock("../../db/prisma.js", () => ({ default: db }));
vi.mock("../../services/pricing.js", () => quotes);
vi.mock("../../services/marketHours.js", () => ({ isMarketOpen: () => market.open, getNextOpenLabel: () => "Opens tomorrow at 9:15 AM" }));
vi.mock("../../controllers/leaderboard.controller.js", () => rankings);
vi.mock("../../controllers/contest.controller.js", () => ({ deriveStatus: () => "LIVE" }));
vi.mock("../../services/contestNetWorth.js", () => ({ computeContestNetWorths: vi.fn() }));

const { DATA_HANDLERS } = await import("./handlers.js");

const q = (price: number, change: number) => ({ symbol: "", price, previousClose: price - change, change, changePercent: (change / (price - change)) * 100, currency: "INR", timestamp: 0 });
const ctx = (symbols: string[], ambiguous: { term: string; candidates: string[]; default?: string }[] = []) => ({
  userId: "u1",
  link: { symbols, ambiguous: ambiguous.map((a) => a.term) },
  ambiguous,
});

beforeEach(() => {
  vi.clearAllMocks();
  market.open = true;
});

describe("price_quote", () => {
  it("formats the price and today's move, and returns quote cards", async () => {
    quotes.getQuotes.mockResolvedValue({ "TCS.NS": q(3500, 35) });
    const a = await DATA_HANDLERS.price_quote(ctx(["TCS.NS"]));
    expect(a.text).toContain("Here's the latest:\n- **TCS** (Tata Consultancy Services): **₹3,500.00** ▲ +1.01% (+₹35.00) today");
    expect(a.quotes).toEqual([expect.objectContaining({ symbol: "TCS.NS", price: 3500 })]);
    expect(a.links[0].href).toBe("/market?symbol=TCS.NS");
  });

  it("says when prices are last closes", async () => {
    market.open = false;
    quotes.getQuotes.mockResolvedValue({ "TCS.NS": q(3500, -35) });
    const a = await DATA_HANDLERS.price_quote(ctx(["TCS.NS"]));
    expect(a.text).toContain("▼ −");
    expect(a.text).toContain("last closing prices. Opens tomorrow at 9:15 AM IST.");
  });

  it("asks which company for an ambiguous word with no default", async () => {
    const a = await DATA_HANDLERS.price_quote(ctx([], [{ term: "tata", candidates: ["TCS.NS", "TATASTEEL.NS"] }]));
    expect(a.text).toBe("There are a few **tata** companies. Which one did you mean?");
    expect(a.suggestions).toEqual(["TCS price", "TATASTEEL price"]);
    expect(quotes.getQuotes).not.toHaveBeenCalled();
  });

  it("explains an assumed default", async () => {
    quotes.getQuotes.mockResolvedValue({ "HDFCBANK.NS": q(1600, 10) });
    const a = await DATA_HANDLERS.price_quote(ctx(["HDFCBANK.NS"], [{ term: "hdfc", candidates: ["HDFCBANK.NS", "HDFCLIFE.NS"], default: "HDFCBANK.NS" }]));
    expect(a.text).toContain("I took “hdfc” to mean HDFC Bank. For HDFC Life Insurance Company, ask by name.");
  });

  it("points to the Market page when no listed stock is named", async () => {
    const a = await DATA_HANDLERS.price_quote(ctx([]));
    expect(a.text).toContain("couldn't find a listed stock");
    expect(a.links).toEqual([{ label: "Browse stocks", href: "/market" }]);
  });
});

describe("holding_detail", () => {
  it("reports quantity, average, value and P&L, and unheld stocks", async () => {
    db.holding.findMany.mockResolvedValue([{ symbol: "INFY.NS", quantity: 10, avgBuyPrice: new Prisma.Decimal(1500) }]);
    quotes.getQuotes.mockResolvedValue({ "INFY.NS": q(1650, 5), "TCS.NS": q(3500, 0) });
    const a = await DATA_HANDLERS.holding_detail(ctx(["INFY.NS", "TCS.NS"]));
    expect(a.text).toContain("**INFY**: 10 shares at an average of ₹1,500.00, now ₹1,650.00. Worth **₹16,500.00**, ▲ +₹1,500.00 (+10.00%).");
    expect(a.text).toContain("You don't hold **TCS** right now (it's at ₹3,500.00).");
  });

  it("offers the stocks you hold when none is named", async () => {
    db.holding.findMany.mockResolvedValue([{ symbol: "ITC.NS" }, { symbol: "WIPRO.NS" }]);
    const a = await DATA_HANDLERS.holding_detail(ctx([]));
    expect(a.suggestions).toEqual(["How is my ITC doing?", "How is my WIPRO doing?"]);
  });
});

describe("portfolio_summary", () => {
  it("adds cash and live holdings value, with best and worst", async () => {
    db.wallet.findUnique.mockResolvedValue({ balance: new Prisma.Decimal(50000) });
    db.holding.findMany.mockResolvedValue([
      { symbol: "INFY.NS", quantity: 10, avgBuyPrice: new Prisma.Decimal(1500) },
      { symbol: "ITC.NS", quantity: 100, avgBuyPrice: new Prisma.Decimal(400) },
    ]);
    quotes.getQuotes.mockResolvedValue({ "INFY.NS": q(1650, 0), "ITC.NS": q(380, 0) });
    const a = await DATA_HANDLERS.portfolio_summary(ctx([]));
    // 50,000 + 16,500 + 38,000 = 1,04,500 vs 1,00,000 start
    expect(a.text).toContain("Your net worth is **₹1,04,500.00**, ▲ +₹4,500.00 (+4.50%) this season. Nice, you're in the green.");
    expect(a.text).toContain("Best: **INFY** +10.00%; worst: **ITC** −5.00%");
  });
});

describe("my_rank", () => {
  it("gives rank, title and the gap to the player above", async () => {
    rankings.getRankings.mockResolvedValue([
      { userId: "x", rank: 1, username: "top", netWorth: 130000, totalPnlPercent: 30 },
      { userId: "u1", rank: 2, username: "me", netWorth: 112000, totalPnlPercent: 12 },
    ]);
    const a = await DATA_HANDLERS.my_rank(ctx([]));
    expect(a.text).toContain("You're **#2** of 2 players");
    expect(a.text).toContain("🐂 **Bull Runner**");
    expect(a.text).toContain("₹18,000.00 behind #1 (@top). Top 10, nice work!");
  });
});

describe("my_orders", () => {
  it("lists orders waiting for the open and recent trades", async () => {
    db.queuedOrder.findMany.mockResolvedValue([{ side: "BUY", quantity: 5, symbol: "TCS.NS", quotedPrice: new Prisma.Decimal(3500) }]);
    db.transaction.findMany.mockResolvedValue([{ side: "SELL", quantity: 2, symbol: "ITC.NS", price: new Prisma.Decimal(410), createdAt: new Date("2026-09-22T06:00:00Z") }]);
    const a = await DATA_HANDLERS.my_orders(ctx([]));
    expect(a.text).toContain("**1 order waiting for the market to open:**\n- Buy 5 TCS (last price ₹3,500.00)");
    expect(a.text).toContain("22 Sept: sold 2 ITC at ₹410.00");
    expect(a.suggestions).toEqual(["How do I cancel a queued order?"]);
  });
});
