import { describe, it, expect } from "vitest";
import { starsFor, xpFor } from "../../src/services/scoringService.js";

describe("starsFor", () => {
  it.each([
    [100, 3],
    [90, 3],
    [89, 2],
    [70, 2],
    [69, 1],
    [0, 1],
  ])("score %i earns %i stars", (score, stars) => {
    expect(starsFor(score)).toBe(stars);
  });
});

describe("xpFor", () => {
  it.each([
    ["lesson", true, 80, 10],
    ["lesson", true, 100, 15],
    ["lesson", false, 80, 5],
    ["lesson", false, 100, 10],
    ["checkpoint", true, 80, 20],
    ["checkpoint", true, 100, 25],
    ["checkpoint", false, 80, 5],
    ["checkpoint", false, 100, 10],
  ])("%s, first time %s, score %i -> %i XP", (type, firstCompletion, score, xp) => {
    expect(xpFor({ type, firstCompletion, score })).toBe(xp);
  });

  it("gives the perfect-score bonus only at exactly 100", () => {
    expect(xpFor({ type: "lesson", firstCompletion: true, score: 99 })).toBe(10);
  });
});
