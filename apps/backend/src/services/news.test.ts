import { describe, expect, it } from "vitest";
import { relatesTo } from "./news.js";

describe("relatesTo", () => {
  it("matches a holding mentioned on either exchange", () => {
    expect(relatesTo({ relatedTickers: ["^NSEI", "RELIANCE.BO"] }, ["RELIANCE.NS"])).toBe(true);
    expect(relatesTo({ relatedTickers: ["reliance.ns"] }, ["RELIANCE.NS"])).toBe(true);
  });

  it("ignores stories about other stocks", () => {
    expect(relatesTo({ relatedTickers: ["^NSEI", "TCS.NS"] }, ["RELIANCE.NS"])).toBe(false);
    expect(relatesTo({ relatedTickers: [] }, ["RELIANCE.NS"])).toBe(false);
  });
});
