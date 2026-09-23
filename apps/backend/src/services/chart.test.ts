import { describe, expect, it } from "vitest";
import { completeLastBar, toCandles } from "./chart.js";

describe("toCandles", () => {
  it("zips Yahoo's parallel arrays and drops bars where trading paused", () => {
    const candles = toCandles({
      timestamp: [100, 200, 300],
      indicators: {
        quote: [{ open: [10, null, 12], high: [11, null, 13], low: [9, null, 11], close: [10.5, null, 12.5], volume: [1000, null, null] }],
      },
    });
    expect(candles).toEqual([
      { time: 100, open: 10, high: 11, low: 9, close: 10.5, volume: 1000 },
      { time: 300, open: 12, high: 13, low: 11, close: 12.5, volume: 0 },
    ]);
  });

  it("returns no candles for an empty result", () => {
    expect(toCandles({})).toEqual([]);
  });
});

describe("completeLastBar", () => {
  const result = {
    timestamp: [100, 200],
    meta: { regularMarketPrice: 865.25, regularMarketDayHigh: 870, regularMarketDayLow: 720, regularMarketVolume: 5000 },
    indicators: { quote: [{ open: [700, 725], high: [710, null], low: [690, null], close: [721.05, null], volume: [900, null] }] },
  };

  it("fills today's still-open daily bar from the session stats", () => {
    const candles = completeLastBar(result, toCandles(result));
    expect(candles).toHaveLength(2);
    expect(candles[1]).toEqual({ time: 200, open: 725, high: 870, low: 720, close: 865.25, volume: 5000 });
  });

  it("leaves a complete series alone", () => {
    const complete = { ...result, indicators: { quote: [{ open: [700, 725], high: [710, 870], low: [690, 720], close: [721.05, 860], volume: [900, 5000] }] } };
    expect(completeLastBar(complete, toCandles(complete))).toEqual(toCandles(complete));
  });
});
