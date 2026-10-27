import { describe, it, expect } from "vitest";
import { computeStreak, lastSevenDays } from "../../src/services/activityService.js";

// Rows as getActivityDays returns them (DATE columns come back as strings).
const days = (...isoDays) => isoDays.map((day) => ({ day, xp: 10 }));

describe("computeStreak", () => {
  const today = "2026-10-27";

  it("is 0 with no activity", () => {
    expect(computeStreak([], today)).toBe(0);
  });

  it("counts today", () => {
    expect(computeStreak(days("2026-10-27"), today)).toBe(1);
  });

  it("counts consecutive days ending today", () => {
    expect(computeStreak(days("2026-10-27", "2026-10-26", "2026-10-25"), today)).toBe(3);
  });

  it("keeps yesterday's streak alive before practicing today", () => {
    expect(computeStreak(days("2026-10-26", "2026-10-25"), today)).toBe(2);
  });

  it("is 0 when the last activity was two days ago", () => {
    expect(computeStreak(days("2026-10-25", "2026-10-24"), today)).toBe(0);
  });

  it("stops at the first skipped day", () => {
    expect(computeStreak(days("2026-10-27", "2026-10-26", "2026-10-24"), today)).toBe(2);
  });

  it("doesn't depend on the order of the rows", () => {
    expect(computeStreak(days("2026-10-25", "2026-10-27", "2026-10-26"), today)).toBe(3);
  });

  it("crosses month and year boundaries and the DST change", () => {
    // 2026-11-01 is when US clocks fall back.
    expect(computeStreak(days("2026-11-02", "2026-11-01", "2026-10-31"), "2026-11-02")).toBe(3);
    expect(computeStreak(days("2027-01-01", "2026-12-31"), "2027-01-01")).toBe(2);
  });
});

describe("lastSevenDays", () => {
  it("returns the 7 days ending today, oldest first", () => {
    const week = lastSevenDays([], "2026-10-27");
    expect(week.map((d) => d.day)).toEqual([
      "2026-10-21",
      "2026-10-22",
      "2026-10-23",
      "2026-10-24",
      "2026-10-25",
      "2026-10-26",
      "2026-10-27",
    ]);
  });

  it("fills inactive days with 0 XP and ignores older days", () => {
    const rows = [
      { day: "2026-10-27", xp: 15 },
      { day: "2026-10-23", xp: 30 },
      { day: "2026-10-20", xp: 99 },
    ];
    expect(lastSevenDays(rows, "2026-10-27").map((d) => d.xp)).toEqual([0, 0, 30, 0, 0, 0, 15]);
  });
});
