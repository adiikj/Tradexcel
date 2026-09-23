import { describe, expect, it } from "vitest";
import { rankFromData } from "./marketMovers";

const stock = (symbol: string) => ({ symbol, shortName: symbol, fullName: symbol });
const data = (percentageChange: string, todayChange: string) => ({
  currentPrice: 100,
  percentageChange,
  todayChange,
  stockPrices: [100],
  dates: null,
});

describe("rankFromData", () => {
  const universe = [stock("UP"), stock("DOWN"), stock("FLAT"), stock("UP")];
  const map = { UP: data("5", "+5"), DOWN: data("3", "-3"), FLAT: data("0", "0") };

  it("lists only stocks moving in that direction, once each", () => {
    expect(rankFromData(universe, map, "gainers").map((s) => s.symbol)).toEqual(["UP"]);
  });

  it("uses the sign from todayChange (percentageChange is unsigned)", () => {
    expect(rankFromData(universe, map, "losers").map((s) => s.symbol)).toEqual(["DOWN"]);
  });

  it("sorts the strongest movers first and caps at five", () => {
    const many = Array.from({ length: 7 }, (_, i) => stock(`S${i}`));
    const moves = Object.fromEntries(many.map((s, i) => [s.symbol, data(String(i + 1), `+${i + 1}`)]));
    expect(rankFromData(many, moves, "gainers").map((s) => s.symbol)).toEqual(["S6", "S5", "S4", "S3", "S2"]);
  });

  it("skips symbols without data", () => {
    expect(rankFromData([stock("MISSING")], {}, "gainers")).toEqual([]);
  });
});
