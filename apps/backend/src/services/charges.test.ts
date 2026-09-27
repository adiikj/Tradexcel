import { describe, it, expect } from "vitest";
import { Prisma } from "@prisma/client";
import { estimateCharges } from "@tradexcel/shared";
import { computeCharges } from "./charges.js";

const D = (value: string | number) => new Prisma.Decimal(value);

describe("computeCharges", () => {
  it("itemises a ₹1,00,000 delivery buy", () => {
    const c = computeCharges("BUY", D(100000));
    expect(c.brokerage.toString()).toBe("20"); // 0.03% = ₹30, capped at ₹20
    expect(c.stt.toString()).toBe("100");
    expect(c.exchange.toString()).toBe("2.97");
    expect(c.sebi.toString()).toBe("0.1");
    expect(c.stampDuty.toString()).toBe("15");
    expect(c.gst.toString()).toBe("4.15"); // 18% of 23.07 = 4.1526
    expect(c.total.toString()).toBe("142.22");
  });

  it("charges no stamp duty on a sale", () => {
    const c = computeCharges("SELL", D(100000));
    expect(c.stampDuty.toString()).toBe("0");
    expect(c.total.toString()).toBe("127.22");
  });

  it("uses percentage brokerage below the cap", () => {
    // 0.03% of ₹10,000 = ₹3
    expect(computeCharges("BUY", D(10000)).brokerage.toString()).toBe("3");
  });

  it("is zero-ish but never negative on a tiny trade", () => {
    const c = computeCharges("SELL", D("1.5"));
    expect(c.total.gte(0)).toBe(true);
    expect(c.total.lt(1)).toBe(true);
  });

  it("agrees with the frontend estimate", () => {
    for (const turnover of [1234.56, 9999.99, 48250, 100000, 250000.5]) {
      for (const side of ["BUY", "SELL"] as const) {
        expect(computeCharges(side, D(turnover)).total.toNumber()).toBeCloseTo(estimateCharges(side, turnover).total, 2);
      }
    }
  });
});
