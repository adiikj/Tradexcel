import { describe, expect, it } from "vitest";
import { getTitle } from "./titles.js";

describe("getTitle", () => {
  it("gives #1 on the leaderboard the top title regardless of P&L", () => {
    expect(getTitle(-50, 1).name).toBe("Market Legend");
  });

  it("uses strict thresholds between tiers", () => {
    expect(getTitle(50.01, 2).name).toBe("Trading Legend");
    expect(getTitle(50, 2).name).toBe("Market Wizard");
    expect(getTitle(25, null).name).toBe("Bull Runner");
    expect(getTitle(10, null).name).toBe("Steady Hand");
    expect(getTitle(0, null).name).toBe("Rookie Trader");
    expect(getTitle(-10, null).name).toBe("Rekt");
  });

  it("falls back to the catch-all tier for NaN", () => {
    expect(getTitle(NaN, null).name).toBe("Rekt");
  });
});
