import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { STOCK_LIST } from "@tradexcel/shared";
import { StockLinker, ratio } from "./linker.js";
import { compileGuards, guardMatch } from "./model.js";
import { loadEntities } from "./config.js";

// Reference outputs from the Python implementation (ml/tradexcel_ml/parity_fixtures.py).
const fixture = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), "__fixtures__/parity.json"), "utf8")) as {
  guard_patterns: Record<string, string[]>;
  cases: { text: string; symbols: string[]; ambiguous: string[]; guard: string | null }[];
};

describe("ratio (rapidfuzz fuzz.ratio)", () => {
  it("matches known values", () => {
    expect(ratio("infosis", "infosys")).toBeCloseTo(85.714, 2);
    expect(ratio("abc", "abc")).toBe(100);
    expect(ratio("abc", "xyz")).toBe(0);
  });
});

describe("parity with the Python pipeline", () => {
  const linker = new StockLinker(STOCK_LIST, loadEntities());

  it("links stocks exactly like ml/tradexcel_ml/linker.py", () => {
    const mismatches = fixture.cases
      .map((c) => ({ c, got: linker.link(c.text) }))
      .filter(({ c, got }) => JSON.stringify(got) !== JSON.stringify({ symbols: c.symbols, ambiguous: c.ambiguous }))
      .map(({ c, got }) => `${c.text}: expected ${JSON.stringify(c.symbols)}/${JSON.stringify(c.ambiguous)}, got ${JSON.stringify(got)}`);
    expect(mismatches).toEqual([]);
    expect(fixture.cases.length).toBeGreaterThan(1000);
  });

  it("applies the guard patterns exactly like ml/tradexcel_ml/guard_rules.py", () => {
    const guards = compileGuards(fixture.guard_patterns);
    const mismatches = fixture.cases.filter((c) => guardMatch(guards, c.text) !== c.guard).map((c) => c.text);
    expect(mismatches).toEqual([]);
  });
});
