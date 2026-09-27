import { describe, expect, it } from "vitest";
import { Prisma } from "@prisma/client";
import { contestRuleViolation } from "./contestRules.js";

const D = (n: number) => new Prisma.Decimal(n);
const none = { maxHoldings: null, maxPositionPercent: null };

describe("contestRuleViolation", () => {
  it("allows anything without rules", () => {
    expect(contestRuleViolation(none, [], {}, D(1000), "A.NS", 10, D(100))).toBeNull();
  });

  it("caps the number of different stocks, but lets you add to one you hold", () => {
    const rules = { maxHoldings: 2, maxPositionPercent: null };
    const held = [
      { symbol: "A.NS", quantity: 1, avgBuyPrice: D(10) },
      { symbol: "B.NS", quantity: 1, avgBuyPrice: D(10) },
    ];
    expect(contestRuleViolation(rules, held, {}, D(1000), "C.NS", 1, D(10))).toMatch(/at most 2 different stocks/);
    expect(contestRuleViolation(rules, held, {}, D(1000), "A.NS", 1, D(10))).toBeNull();
  });

  it("caps one position's share of net worth, counting what you already hold", () => {
    const rules = { maxHoldings: null, maxPositionPercent: 35 };
    // net worth = 800 cash + 2 × 100 (A at today's price) = 1000; 35% = 350
    const held = [{ symbol: "A.NS", quantity: 2, avgBuyPrice: D(90) }];
    const quotes = { "A.NS": { price: 100 } };
    expect(contestRuleViolation(rules, held, quotes, D(800), "B.NS", 3, D(100))).toBeNull(); // 300
    expect(contestRuleViolation(rules, held, quotes, D(800), "B.NS", 4, D(100))).toMatch(/more than 35%/); // 400
    expect(contestRuleViolation(rules, held, quotes, D(800), "A.NS", 1, D(100))).toBeNull(); // (2 + 1) × 100
    expect(contestRuleViolation(rules, held, quotes, D(800), "A.NS", 2, D(100))).toMatch(/more than 35%/); // (2 + 2) × 100
  });
});
