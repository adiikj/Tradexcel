import { beforeEach, describe, expect, it, vi } from "vitest";
import { STOCK_LIST } from "@tradexcel/shared";

const db = vi.hoisted(() => ({
  questCompletion: { findMany: vi.fn(), createMany: vi.fn() },
  transaction: { count: vi.fn() },
  queuedOrder: { count: vi.fn() },
  holding: { findMany: vi.fn() },
  priceAlert: { count: vi.fn() },
  practiceSession: { count: vi.fn() },
  contestEntry: { count: vi.fn() },
}));
const badges = vi.hoisted(() => ({ awardBadge: vi.fn(), BADGE_CATALOG: [] as { id: string }[] }));

vi.mock("../db/prisma.js", () => ({ default: db }));
vi.mock("./achievements.js", () => badges);

const { getQuests, QUESTS, GRADUATE_BADGE } = await import("./quests.js");
const { SCENARIOS, basketReturnPct } = await import("./practice.js");
const { BADGE_CATALOG } = await vi.importActual<typeof import("./achievements.js")>("./achievements.js");

beforeEach(() => {
  vi.clearAllMocks();
  db.questCompletion.findMany.mockResolvedValue([]);
  for (const model of [db.transaction, db.queuedOrder, db.priceAlert, db.practiceSession, db.contestEntry]) model.count.mockResolvedValue(0);
  db.holding.findMany.mockResolvedValue([]);
  badges.awardBadge.mockResolvedValue(true);
});

describe("quests", () => {
  it("have unique ids, and the graduate badge exists", () => {
    expect(new Set(QUESTS.map((q) => q.id)).size).toBe(QUESTS.length);
    expect(BADGE_CATALOG.some((b) => b.id === GRADUATE_BADGE)).toBe(true);
  });

  it("saves newly completed quests and keeps earlier ones done", async () => {
    db.questCompletion.findMany.mockResolvedValue([{ questId: "first_trade", completedAt: new Date("2026-09-01T00:00:00Z") }]);
    db.priceAlert.count.mockResolvedValue(1);
    // three sectors: bank, IT, FMCG
    db.holding.findMany.mockResolvedValue([{ symbol: "HDFCBANK.NS" }, { symbol: "TCS.NS" }, { symbol: "ITC.NS" }]);

    const quests = await getQuests("u1");
    const done = quests.filter((q) => q.completedAt).map((q) => q.id);
    expect(done.sort()).toEqual(["first_trade", "price_alert", "three_sectors"]);
    expect(quests.find((q) => q.id === "first_trade")!.completedAt).toBe("2026-09-01T00:00:00.000Z");
    // The already-completed quest isn't re-checked or re-saved.
    expect(db.transaction.count).not.toHaveBeenCalledWith({ where: { userId: "u1" } });
    expect(db.questCompletion.createMany).toHaveBeenCalledWith({
      data: [{ userId: "u1", questId: "three_sectors" }, { userId: "u1", questId: "price_alert" }],
      skipDuplicates: true,
    });
    expect(badges.awardBadge).not.toHaveBeenCalled();
  });

  it("two holdings in the same sector don't count as diversified", async () => {
    db.holding.findMany.mockResolvedValue([{ symbol: "HDFCBANK.NS" }, { symbol: "SBIN.NS" }, { symbol: "TCS.NS" }]);
    const quests = await getQuests("u1");
    expect(quests.find((q) => q.id === "three_sectors")!.completedAt).toBeNull();
  });

  it("awards the graduate badge once every quest is done", async () => {
    db.questCompletion.findMany.mockResolvedValue(QUESTS.map((q) => ({ questId: q.id, completedAt: new Date() })));
    await getQuests("u1");
    expect(badges.awardBadge).toHaveBeenCalledWith("u1", "graduate");
  });
});

describe("practice scenarios", () => {
  it("only use listed stocks, with no repeats", () => {
    const listed = new Set(STOCK_LIST.map((s) => s.symbol));
    for (const s of SCENARIOS) {
      expect(s.symbols.filter((sym) => !listed.has(sym))).toEqual([]);
      expect(new Set(s.symbols).size).toBe(s.symbols.length);
      expect(s.days).toBeGreaterThan(0);
    }
  });

  it("measures an equal-weight buy-and-hold of the basket", () => {
    const first = new Map([["A", 100], ["B", 200]]);
    const now = new Map([["A", 110], ["B", 180]]); // +10% and -10%
    expect(basketReturnPct(first, now)).toBe(0);
    expect(basketReturnPct(first, new Map([["A", 150]]))).toBe(50); // missing prices are skipped
    expect(basketReturnPct(new Map(), now)).toBeNull();
  });
});
