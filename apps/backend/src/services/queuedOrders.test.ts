import { describe, expect, it } from "vitest";
import { Prisma } from "@prisma/client";
import { runsAfterWeeklyReset, reservedCash, displaySymbol, isTriggered, buyCost } from "./queuedOrders.js";
import { orderSchema } from "./tradeMath.js";
import { getNextWeeklyReset } from "./weeklyReset.js";

// 2026-09-21 is a Monday. Times are UTC; IST = UTC + 5:30.
const utc = (iso: string) => new Date(`${iso}Z`);

describe("getNextWeeklyReset", () => {
  it("returns the next Monday 00:00 UTC, strictly after the given time", () => {
    expect(getNextWeeklyReset(utc("2026-09-23T12:00:00"))).toEqual(utc("2026-09-28T00:00:00"));
    expect(getNextWeeklyReset(utc("2026-09-21T00:00:00"))).toEqual(utc("2026-09-28T00:00:00"));
    expect(getNextWeeklyReset(utc("2026-09-27T23:59:00"))).toEqual(utc("2026-09-28T00:00:00"));
  });
});

describe("runsAfterWeeklyReset", () => {
  it("is false on a weekday evening - the order fills the next morning, same season", () => {
    expect(runsAfterWeeklyReset(utc("2026-09-22T14:00:00"))).toBe(false); // Tue 7:30 PM IST
  });

  it("is true from Friday's close through the weekend", () => {
    expect(runsAfterWeeklyReset(utc("2026-09-25T10:30:00"))).toBe(true); // Fri 4:00 PM IST
    expect(runsAfterWeeklyReset(utc("2026-09-27T08:00:00"))).toBe(true); // Sun
  });

  it("is false on Monday between the reset and the open", () => {
    expect(runsAfterWeeklyReset(utc("2026-09-28T01:00:00"))).toBe(false); // Mon 6:30 AM IST
  });
});

describe("reservedCash", () => {
  it("sums what each pending buy could cost, charges included", () => {
    const pending = [
      { quantity: 2, quotedPrice: new Prisma.Decimal("100.5") },
      { quantity: 3, quotedPrice: new Prisma.Decimal("10") },
    ];
    expect(reservedCash(pending).toString()).toBe(buyCost(2, new Prisma.Decimal("100.5")).add(buyCost(3, new Prisma.Decimal(10))).toString());
    expect(reservedCash(pending).gt(231)).toBe(true);
    expect(reservedCash([]).toString()).toBe("0");
  });

  it("reserves a limit buy at its limit price, not the last price seen", () => {
    const limit = [{ quantity: 10, quotedPrice: new Prisma.Decimal(500), triggerPrice: new Prisma.Decimal(450) }];
    expect(reservedCash(limit).toString()).toBe(buyCost(10, new Prisma.Decimal(450)).toString());
  });
});

describe("isTriggered", () => {
  const D = (n: number) => new Prisma.Decimal(n);

  it("always fills a market order", () => {
    expect(isTriggered("MARKET", "BUY", null, D(100))).toBe(true);
    expect(isTriggered("MARKET", "SELL", null, D(100))).toBe(true);
  });

  it("fills a limit buy at or below the limit, a limit sell at or above it", () => {
    expect(isTriggered("LIMIT", "BUY", D(100), D(99))).toBe(true);
    expect(isTriggered("LIMIT", "BUY", D(100), D(100))).toBe(true);
    expect(isTriggered("LIMIT", "BUY", D(100), D(101))).toBe(false);
    expect(isTriggered("LIMIT", "SELL", D(100), D(101))).toBe(true);
    expect(isTriggered("LIMIT", "SELL", D(100), D(99))).toBe(false);
  });

  it("triggers a stop-loss sell when the price falls to it, a stop buy when it rises to it", () => {
    expect(isTriggered("STOP", "SELL", D(90), D(95))).toBe(false);
    expect(isTriggered("STOP", "SELL", D(90), D(90))).toBe(true);
    expect(isTriggered("STOP", "SELL", D(90), D(80))).toBe(true); // gapped down past the stop
    expect(isTriggered("STOP", "BUY", D(110), D(105))).toBe(false);
    expect(isTriggered("STOP", "BUY", D(110), D(111))).toBe(true);
  });
});

describe("orderSchema", () => {
  it("defaults to a market order", () => {
    expect(orderSchema.parse({ symbol: "tcs.ns", quantity: 2 })).toEqual({ symbol: "TCS.NS", quantity: 2, orderType: "MARKET" });
  });

  it("requires a price for limit and stop orders", () => {
    expect(orderSchema.safeParse({ symbol: "TCS.NS", quantity: 1, orderType: "LIMIT" }).success).toBe(false);
    expect(orderSchema.safeParse({ symbol: "TCS.NS", quantity: 1, orderType: "STOP", triggerPrice: "3400.5" }).success).toBe(true);
  });

  it("rejects a price on a market order, and prices finer than a paisa", () => {
    expect(orderSchema.safeParse({ symbol: "TCS.NS", quantity: 1, triggerPrice: 100 }).success).toBe(false);
    expect(orderSchema.safeParse({ symbol: "TCS.NS", quantity: 1, orderType: "LIMIT", triggerPrice: 100.123 }).success).toBe(false);
    expect(orderSchema.safeParse({ symbol: "TCS.NS", quantity: 1, orderType: "LIMIT", triggerPrice: -5 }).success).toBe(false);
  });
});

describe("displaySymbol", () => {
  it("drops the exchange suffix", () => {
    expect(displaySymbol("TCS.NS")).toBe("TCS");
    expect(displaySymbol("RELIANCE.BO")).toBe("RELIANCE");
    expect(displaySymbol("AAPL")).toBe("AAPL");
  });
});
