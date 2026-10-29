import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { rememberStreak, streakIncrease } from "./streakMemory";

describe("streak memory", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it("shows no gain on the first visit in this browser", () => {
    expect(streakIncrease(1, 4)).toBe(0);
  });

  it("returns how much the streak grew since the last visit", () => {
    rememberStreak(1, 2);
    expect(streakIncrease(1, 3)).toBe(1);
    expect(streakIncrease(1, 2)).toBe(0);
    expect(streakIncrease(1, 0)).toBe(0);
  });

  it("keeps each user's streak separate", () => {
    rememberStreak(1, 5);
    rememberStreak(2, 1);
    expect(streakIncrease(1, 6)).toBe(1);
    expect(streakIncrease(2, 2)).toBe(1);
  });

  it("works without storage (private mode) instead of crashing", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(() => rememberStreak(1, 3)).not.toThrow();
    expect(streakIncrease(1, 3)).toBe(0);
  });
});
