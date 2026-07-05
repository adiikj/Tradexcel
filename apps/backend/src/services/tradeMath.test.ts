import { describe, it, expect } from "vitest";
import { Prisma } from "@prisma/client";
import {
  computeWeightedAvgPrice,
  computeRemainingQuantity,
  canAfford,
  canSell,
  calculateHoldingsValue,
} from "./tradeMath.js";

const D = (value: string | number) => new Prisma.Decimal(value);

describe("computeWeightedAvgPrice", () => {
  it("keeps the same average when buying more at the identical price", () => {
    // 5 shares @ 100, buy 5 more @ 100 (total 500) -> still 100
    const result = computeWeightedAvgPrice(5, D(100), 5, D(500));
    expect(result.toNumber()).toBe(100);
  });

  it("shifts the average toward a cheaper second purchase", () => {
    // 10 @ 100 (cost basis 1000), buy 10 @ 50 (total 500) -> avg = 1500/20 = 75
    const result = computeWeightedAvgPrice(10, D(100), 10, D(500));
    expect(result.toNumber()).toBe(75);
  });

  it("shifts the average toward a more expensive second purchase", () => {
    // 10 @ 100 (cost basis 1000), buy 10 @ 200 (total 2000) -> avg = 3000/20 = 150
    const result = computeWeightedAvgPrice(10, D(100), 10, D(2000));
    expect(result.toNumber()).toBe(150);
  });

  it("equals the buy price when there was no existing position", () => {
    const result = computeWeightedAvgPrice(0, D(0), 5, D(250));
    expect(result.toNumber()).toBe(50);
  });

  it("handles fractional averages without floating-point drift", () => {
    // 3 @ 33.33 (cost basis 99.99), buy 3 @ 66.67 (total 200.01) -> avg = 300/6 = 50
    const result = computeWeightedAvgPrice(3, D("33.33"), 3, D("200.01"));
    expect(result.toNumber()).toBe(50);
  });
});

describe("computeRemainingQuantity", () => {
  it("subtracts a partial sell from the held quantity", () => {
    expect(computeRemainingQuantity(10, 4)).toBe(6);
  });

  it("returns 0 when the entire position is sold", () => {
    expect(computeRemainingQuantity(10, 10)).toBe(0);
  });
});

describe("canAfford", () => {
  it("allows a trade that costs exactly the wallet balance", () => {
    expect(canAfford(D(100), D(100))).toBe(true);
  });

  it("allows a trade that costs less than the wallet balance", () => {
    expect(canAfford(D(99.99), D(100))).toBe(true);
  });

  it("rejects a trade that costs even a fraction more than the wallet balance", () => {
    expect(canAfford(D(100.01), D(100))).toBe(false);
  });
});

describe("canSell", () => {
  it("allows selling the exact held quantity", () => {
    expect(canSell(10, 10)).toBe(true);
  });

  it("allows selling less than the held quantity", () => {
    expect(canSell(5, 10)).toBe(true);
  });

  it("rejects selling more than the held quantity", () => {
    expect(canSell(11, 10)).toBe(false);
  });

  it("rejects selling out of a zero position", () => {
    expect(canSell(1, 0)).toBe(false);
  });
});

describe("calculateHoldingsValue", () => {
  it("values holdings at the live quote price", () => {
    const holdings = [{ symbol: "AAPL", quantity: 10, avgBuyPrice: D(100) }];
    const quotes = { AAPL: { price: 150 } };
    expect(calculateHoldingsValue(holdings, quotes).toNumber()).toBe(1500);
  });

  it("falls back to cost basis when a quote is missing (never crashes)", () => {
    const holdings = [{ symbol: "AAPL", quantity: 10, avgBuyPrice: D(100) }];
    const quotes = { AAPL: null };
    expect(calculateHoldingsValue(holdings, quotes).toNumber()).toBe(1000);
  });

  it("sums multiple holdings, mixing live and fallback prices", () => {
    const holdings = [
      { symbol: "AAPL", quantity: 10, avgBuyPrice: D(100) }, // live: 10 * 150 = 1500
      { symbol: "MSFT", quantity: 5, avgBuyPrice: D(300) }, // missing quote: 5 * 300 = 1500
    ];
    const quotes = { AAPL: { price: 150 } };
    expect(calculateHoldingsValue(holdings, quotes).toNumber()).toBe(3000);
  });

  it("returns zero for an empty portfolio", () => {
    expect(calculateHoldingsValue([], {}).toNumber()).toBe(0);
  });
});
