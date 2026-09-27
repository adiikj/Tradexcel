import { describe, expect, it } from "vitest";
import { STOCK_LIST } from "@tradexcel/shared";
import { streaks, targetDate } from "./predictions.js";
import { rankResults } from "./weeklyRecap.js";
import { weeklyRecapEmailTemplate } from "./emailTemplates.js";
import { DUEL_SYMBOLS } from "../controllers/contest.controller.js";

// 2026-09-21 is a Monday. Times are UTC; IST = UTC + 5:30.
const utc = (iso: string) => new Date(`${iso}Z`);

describe("targetDate", () => {
  it("is today before the open", () => {
    expect(targetDate(utc("2026-09-22T02:00:00"))).toBe("2026-09-22"); // Tue 7:30 AM IST
  });

  it("is the next session once today's has opened", () => {
    expect(targetDate(utc("2026-09-22T05:00:00"))).toBe("2026-09-23"); // Tue 10:30 AM IST
    expect(targetDate(utc("2026-09-22T12:00:00"))).toBe("2026-09-23"); // Tue evening
  });

  it("skips the weekend", () => {
    expect(targetDate(utc("2026-09-25T12:00:00"))).toBe("2026-09-28"); // Fri evening -> Mon
    expect(targetDate(utc("2026-09-27T08:00:00"))).toBe("2026-09-28"); // Sun -> Mon
  });
});

describe("streaks", () => {
  it("counts the current run from the latest call and the best ever", () => {
    // newest first
    const history = [true, true, false, true, true, true, false].map((correct) => ({ correct }));
    expect(streaks(history)).toEqual({ current: 2, best: 3 });
  });

  it("ignores flat days", () => {
    expect(streaks([{ correct: true }, { correct: null }, { correct: true }])).toEqual({ current: 2, best: 2 });
    expect(streaks([])).toEqual({ current: 0, best: 0 });
  });
});

describe("rankResults", () => {
  it("ranks by return, ties sharing a rank", () => {
    const ranks = rankResults([
      { userId: "a", pnlPercent: 2 },
      { userId: "b", pnlPercent: 5 },
      { userId: "c", pnlPercent: 2 },
      { userId: "d", pnlPercent: -1 },
    ]);
    expect(Object.fromEntries(ranks)).toEqual({ b: 1, a: 2, c: 2, d: 4 });
  });
});

describe("weeklyRecapEmailTemplate", () => {
  it("summarises the week and links to the opt-out", () => {
    const { subject, html, text } = weeklyRecapEmailTemplate({
      name: "Asha <script>",
      pnlPercent: 3.456,
      endNetWorth: 103456,
      rank: 2,
      players: 40,
      trades: 7,
      badges: ["🎉 First Trade"],
      siteUrl: "https://tradexcel.app",
    });
    expect(subject).toBe("Your week on Tradexcel: +3.46%, #2 of 40");
    expect(html).toContain("Asha &lt;script&gt;");
    expect(html).not.toContain("<script>");
    expect(text).toContain("Badges earned: 🎉 First Trade");
    expect(text).toContain("https://tradexcel.app/your-profile");
  });
});

describe("DUEL_SYMBOLS", () => {
  it("are 50 distinct listed stocks", () => {
    const listed = new Set(STOCK_LIST.map((s) => s.symbol));
    expect(DUEL_SYMBOLS.filter((s) => !listed.has(s))).toEqual([]);
    expect(new Set(DUEL_SYMBOLS).size).toBe(50);
  });
});
