import { describe, expect, it } from "vitest";
import { Prisma } from "@prisma/client";
import { runsAfterWeeklyReset, reservedCash, displaySymbol } from "./queuedOrders.js";
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
  it("sums quantity x quoted price of pending buys", () => {
    const pending = [
      { quantity: 2, quotedPrice: new Prisma.Decimal("100.5") },
      { quantity: 3, quotedPrice: new Prisma.Decimal("10") },
    ];
    expect(reservedCash(pending).toString()).toBe("231");
    expect(reservedCash([]).toString()).toBe("0");
  });
});

describe("displaySymbol", () => {
  it("drops the exchange suffix", () => {
    expect(displaySymbol("TCS.NS")).toBe("TCS");
    expect(displaySymbol("RELIANCE.BO")).toBe("RELIANCE");
    expect(displaySymbol("AAPL")).toBe("AAPL");
  });
});
