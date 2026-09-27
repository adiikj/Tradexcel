import { Prisma } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const calls: string[] = [];
const tx = {
  $queryRaw: vi.fn(async () => {
    calls.push("lock");
    return [];
  }),
  wallet: {
    findUniqueOrThrow: vi.fn(),
    update: vi.fn(async () => calls.push("resetWallet")),
  },
  holding: {
    findMany: vi.fn(),
    deleteMany: vi.fn(async () => calls.push("deleteHoldings")),
  },
  weeklySnapshot: { create: vi.fn(async () => calls.push("snapshot")) },
  queuedOrder: { updateMany: vi.fn(async () => calls.push("cancelSells")) },
};
const db = {
  user: { findMany: vi.fn() },
  $transaction: vi.fn(async (fn: (t: typeof tx) => unknown) => fn(tx)),
};

vi.mock("../db/prisma.js", () => ({ default: db }));
vi.mock("./pricing.js", () => ({ getQuotes: vi.fn(async () => ({ "TCS.NS": { price: 120 } })) }));
vi.mock("./achievements.js", () => ({ awardWeeklyChampion: vi.fn(async () => []) }));
vi.mock("./weeklyRecap.js", () => ({ sendWeeklyRecaps: vi.fn(async () => 0) }));

const { runWeeklyReset, getMostRecentMonday } = await import("./weeklyReset.js");
const { sendWeeklyRecaps } = await import("./weeklyRecap.js");

beforeEach(() => {
  vi.clearAllMocks();
  calls.length = 0;
  db.user.findMany.mockResolvedValue([{ id: "u1", holdings: [{ symbol: "TCS.NS" }] }]);
  tx.wallet.findUniqueOrThrow.mockResolvedValue({ balance: new Prisma.Decimal(90000) });
  tx.holding.findMany.mockResolvedValue([{ symbol: "TCS.NS", quantity: 100, avgBuyPrice: new Prisma.Decimal(100) }]);
});

describe("runWeeklyReset", () => {
  it("only closes out wallets that existed before this week's boundary", async () => {
    await runWeeklyReset();
    const where = db.user.findMany.mock.calls[0][0].where;
    expect(where.wallet).toEqual({ is: { createdAt: { lt: getMostRecentMonday(new Date()) } } });
  });

  it("locks the wallet first, snapshots at market value, then resets", async () => {
    expect(await runWeeklyReset()).toBe(1);
    expect(calls).toEqual(["lock", "snapshot", "deleteHoldings", "cancelSells", "resetWallet"]);
    // 90,000 cash + 100 x 120 = 1,02,000 -> +2%
    const data = tx.weeklySnapshot.create.mock.calls[0][0].data;
    expect(data.endNetWorth.toNumber()).toBe(102000);
    expect(data.pnlPercent.toNumber()).toBe(2);
    expect(sendWeeklyRecaps).toHaveBeenCalledWith(expect.any(Date), expect.any(Date), [{ userId: "u1", pnlPercent: 2, endNetWorth: 102000 }]);
  });

  it("skips a week that's already closed out without resetting anything", async () => {
    tx.weeklySnapshot.create.mockRejectedValueOnce(Object.assign(new Error("unique"), { code: "P2002" }));
    expect(await runWeeklyReset()).toBe(0);
    expect(calls).toEqual(["lock"]);
    expect(sendWeeklyRecaps).toHaveBeenCalledWith(expect.any(Date), expect.any(Date), []);
  });
});
