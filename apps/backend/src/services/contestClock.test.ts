import { describe, it, expect } from "vitest";
import { resolveSimulatedDate } from "./contestClock.js";

const DAY = 86_400_000;
const dates = [
  new Date("2020-03-02T00:00:00.000Z"),
  new Date("2020-03-03T00:00:00.000Z"),
  new Date("2020-03-04T00:00:00.000Z"),
  new Date("2020-03-05T00:00:00.000Z"),
  new Date("2020-03-06T00:00:00.000Z"),
];

describe("resolveSimulatedDate", () => {
  it("returns null for an ordinary (non-replay) contest", () => {
    const contest = { startAt: new Date("2026-01-01T00:00:00.000Z"), historicalDates: [] };
    expect(resolveSimulatedDate(contest, new Date("2026-01-02T00:00:00.000Z"))).toBeNull();
  });

  it("resolves to the first historical date at the contest's start", () => {
    const startAt = new Date("2026-01-01T00:00:00.000Z");
    const contest = { startAt, historicalDates: dates };
    expect(resolveSimulatedDate(contest, startAt)).toEqual(dates[0]);
  });

  it("advances one historical date per elapsed real day", () => {
    const startAt = new Date("2026-01-01T00:00:00.000Z");
    const contest = { startAt, historicalDates: dates };
    expect(resolveSimulatedDate(contest, new Date(startAt.getTime() + 2 * DAY))).toEqual(dates[2]);
  });

  it("clamps to the last historical date once the contest has run past its length", () => {
    const startAt = new Date("2026-01-01T00:00:00.000Z");
    const contest = { startAt, historicalDates: dates };
    expect(resolveSimulatedDate(contest, new Date(startAt.getTime() + 30 * DAY))).toEqual(dates[dates.length - 1]);
  });

  it("clamps to the first historical date if called before the contest started", () => {
    const startAt = new Date("2026-01-01T00:00:00.000Z");
    const contest = { startAt, historicalDates: dates };
    expect(resolveSimulatedDate(contest, new Date(startAt.getTime() - DAY))).toEqual(dates[0]);
  });
});
