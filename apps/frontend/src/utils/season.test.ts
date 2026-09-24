import { describe, expect, it } from "vitest";
import { formatCountdown, nextReset, seasonStart } from "./season";

describe("season timing", () => {
  it("starts seasons on Monday 00:00 UTC", () => {
    // Thursday 2026-09-24 10:00 UTC -> Monday 2026-09-21
    expect(seasonStart(new Date("2026-09-24T10:00:00Z")).toISOString()).toBe("2026-09-21T00:00:00.000Z");
    // A Monday belongs to its own season
    expect(seasonStart(new Date("2026-09-21T00:30:00Z")).toISOString()).toBe("2026-09-21T00:00:00.000Z");
    // Sunday late still belongs to the previous Monday
    expect(seasonStart(new Date("2026-09-27T23:59:00Z")).toISOString()).toBe("2026-09-21T00:00:00.000Z");
    expect(nextReset(new Date("2026-09-24T10:00:00Z")).toISOString()).toBe("2026-09-28T00:00:00.000Z");
  });

  it("formats countdowns compactly", () => {
    expect(formatCountdown((2 * 24 + 5) * 3600_000)).toBe("2d 5h");
    expect(formatCountdown((5 * 60 + 12) * 60_000)).toBe("5h 12m");
    expect(formatCountdown(12 * 60_000)).toBe("12m");
    expect(formatCountdown(-1)).toBe("0m");
  });
});
