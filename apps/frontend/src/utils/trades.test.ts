import { describe, expect, it } from "vitest";
import { cashMoved, netCashFlow } from "./trades";

describe("cashMoved", () => {
  it("adds charges to a buy and takes them off a sale", () => {
    expect(cashMoved({ side: "BUY", total: "1000", charges: "1.5" })).toBe(1001.5);
    expect(cashMoved({ side: "SELL", total: "1000", charges: "1.5" })).toBe(998.5);
  });

  it("signs buys negative and sells positive", () => {
    expect(netCashFlow({ side: "BUY", total: 200, charges: 0 })).toBe(-200);
    expect(netCashFlow({ side: "SELL", total: 200, charges: 0.25 })).toBe(199.75);
  });
});
