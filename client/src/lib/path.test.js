import { describe, it, expect } from "vitest";
import { celebrationFor } from "./path";

// The shape GET /api/learn/path returns, trimmed to what matters here.
const node = (id, status) => ({ id, status });
const levels = [
  {
    id: "A1",
    completed: 2,
    total: 2,
    units: [{ nodes: [node("a1-u1-l1", "completed"), node("a1-u1-test", "completed")] }],
  },
  {
    id: "A2",
    completed: 1,
    total: 3,
    units: [
      {
        nodes: [node("a2-u1-l1", "completed"), node("a2-u1-l2", "current"), node("a2-u1-test", "locked")],
      },
    ],
  },
];
const none = { completedId: null, unlockedId: null, openedLevelId: null };

describe("celebrationFor", () => {
  it("celebrates nothing when no lesson was just completed", () => {
    expect(celebrationFor(levels, null)).toEqual(none);
    expect(celebrationFor(null, "a2-u1-l1")).toEqual(none);
  });

  it("celebrates the finished node and the one it unlocked", () => {
    expect(celebrationFor(levels, "a2-u1-l1")).toEqual({
      completedId: "a2-u1-l1",
      unlockedId: "a2-u1-l2",
      openedLevelId: null,
    });
  });

  it("also celebrates the new level when the unlocked node starts it", () => {
    const fresh = structuredClone(levels);
    fresh[1].units[0].nodes[0].status = "current";
    fresh[1].units[0].nodes[1].status = "locked";
    expect(celebrationFor(fresh, "a1-u1-test")).toEqual({
      completedId: "a1-u1-test",
      unlockedId: "a2-u1-l1",
      openedLevelId: "A2",
    });
  });

  it("doesn't unlock anything when the next node isn't the current one", () => {
    // a1-u1-l1 was finished long ago: its next node is completed, not current.
    expect(celebrationFor(levels, "a1-u1-l1")).toEqual({
      completedId: "a1-u1-l1",
      unlockedId: null,
      openedLevelId: null,
    });
  });

  it("celebrates nothing if the server doesn't show the node as completed", () => {
    expect(celebrationFor(levels, "a2-u1-l2")).toEqual(none);
    expect(celebrationFor(levels, "a9-u1-l1")).toEqual(none);
  });
});
