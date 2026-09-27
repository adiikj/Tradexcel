import { describe, expect, it } from "vitest";
import { Prisma } from "@prisma/client";
import { SECTOR_BY_SYMBOL, STOCK_LIST, sectorOf } from "@tradexcel/shared";
import { istDate, replayTrades, summarizeClosed } from "./analytics.js";

const D = (n: number | string) => new Prisma.Decimal(n);
let seq = 0;
const trade = (side: "BUY" | "SELL", symbol: string, quantity: number, price: number, charges = 0, at = seq++) => ({
  id: `t${at}`,
  symbol,
  side,
  quantity,
  price: D(price),
  total: D(price).mul(quantity),
  charges: D(charges),
  note: null,
  createdAt: new Date(Date.UTC(2026, 8, 21, 4, at)),
});

describe("replayTrades", () => {
  it("measures a sale against the weighted average cost", () => {
    // 10 @ 100 + 10 @ 120 -> avg 110; sell 5 @ 130 -> +100
    const { closed } = replayTrades([trade("BUY", "TCS.NS", 10, 100), trade("BUY", "TCS.NS", 10, 120), trade("SELL", "TCS.NS", 5, 130)]);
    expect(closed).toHaveLength(1);
    expect(closed[0]).toMatchObject({ avgBuyPrice: 110, sellPrice: 130, pnl: 100, pnlPercent: 18.18 });
  });

  it("charges count against the trade: sell charges plus the closed share of buy charges", () => {
    // buy 10 @ 100 with ₹4 charges; sell 5 @ 110 with ₹1 charges
    // gross +50, minus 1 (sell), minus 2 (half the buy charges) = 47; basis 502
    const { closed, chargesPaid } = replayTrades([trade("BUY", "ITC.NS", 10, 100, 4), trade("SELL", "ITC.NS", 5, 110, 1)]);
    expect(closed[0].pnl).toBe(47);
    expect(closed[0].pnlPercent).toBe(9.36);
    expect(chargesPaid).toBe(5);
  });

  it("carries the remaining cost basis to later sales", () => {
    const { closed } = replayTrades([
      trade("BUY", "INFY.NS", 4, 100),
      trade("SELL", "INFY.NS", 2, 90),
      trade("BUY", "INFY.NS", 2, 80), // 2 @ 100 + 2 @ 80 -> avg 90
      trade("SELL", "INFY.NS", 4, 95),
    ]);
    expect(closed.map((c) => c.pnl)).toEqual([-20, 20]);
    expect(closed[1].avgBuyPrice).toBe(90);
  });

  it("skips a sale with no position in the replay", () => {
    expect(replayTrades([trade("SELL", "SBIN.NS", 3, 500)]).closed).toEqual([]);
  });
});

describe("summarizeClosed", () => {
  it("reports win rate and the best and worst trades", () => {
    const { closed } = replayTrades([
      trade("BUY", "A.NS", 1, 100),
      trade("SELL", "A.NS", 1, 150),
      trade("BUY", "B.NS", 1, 100),
      trade("SELL", "B.NS", 1, 70),
      trade("BUY", "C.NS", 1, 100),
      trade("SELL", "C.NS", 1, 110),
    ]);
    const s = summarizeClosed(closed);
    expect(s).toMatchObject({ realizedPnl: 30, closedTrades: 3, wins: 2, winRate: 66.7 });
    expect(s.best?.symbol).toBe("A.NS");
    expect(s.worst?.symbol).toBe("B.NS");
  });

  it("has no win rate before any sale", () => {
    expect(summarizeClosed([])).toMatchObject({ realizedPnl: 0, closedTrades: 0, winRate: null, best: null, worst: null });
  });
});

describe("istDate", () => {
  it("uses the Indian calendar day", () => {
    expect(istDate(new Date("2026-09-21T18:29:00Z"))).toBe("2026-09-21"); // 11:59 PM IST
    expect(istDate(new Date("2026-09-21T18:31:00Z"))).toBe("2026-09-22"); // 12:01 AM IST
  });
});

describe("sectors", () => {
  it("files every listed stock under exactly one sector", () => {
    const listed = new Set(STOCK_LIST.map((s) => s.symbol));
    expect([...listed].filter((s) => !SECTOR_BY_SYMBOL[s])).toEqual([]);
    expect(Object.keys(SECTOR_BY_SYMBOL).filter((s) => !listed.has(s))).toEqual([]);
    expect(sectorOf("NOPE.NS")).toBe("Other");
  });
});
