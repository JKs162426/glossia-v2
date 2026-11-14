import { describe, it, expect } from "vitest";
import { dayIn, localDay } from "../../src/middleware/localDay.js";

const at = new Date("2026-11-14T03:30:00Z");

describe("dayIn", () => {
  it("gives the calendar date in a time zone", () => {
    expect(dayIn("UTC", at)).toBe("2026-11-14");
    expect(dayIn("America/Mexico_City", at)).toBe("2026-11-13");
    expect(dayIn("Asia/Tokyo", at)).toBe("2026-11-14");
  });

  it("is null for a zone that doesn't exist", () => {
    expect(dayIn("Not/A_Zone", at)).toBeNull();
    expect(dayIn("", at)).toBeNull();
  });
});

describe("localDay", () => {
  const run = (zone) => {
    const req = { get: (name) => (name === "X-Time-Zone" ? zone : undefined) };
    localDay(req, {}, () => {});
    return req.today;
  };

  it("uses the X-Time-Zone header, and UTC when it's missing, invalid or too long", () => {
    expect(run("Pacific/Kiritimati")).toBe(dayIn("Pacific/Kiritimati"));
    expect(run(undefined)).toBe(dayIn("UTC"));
    expect(run("Not/A_Zone")).toBe(dayIn("UTC"));
    expect(run(`Europe/${"x".repeat(80)}`)).toBe(dayIn("UTC"));
  });
});
