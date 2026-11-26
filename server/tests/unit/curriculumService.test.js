import { describe, it, expect } from "vitest";
import {
  buildPath,
  computeStatuses,
  findCurrentNode,
  getLevelCards,
  getNode,
  getNodeOrder,
  nextNodeAfter,
} from "../../src/services/curriculumService.js";
import { LANGUAGE_CODES } from "../../src/config/languages.js";

const order = getNodeOrder();
const a1 = order.filter((id) => id.startsWith("a1-"));
const a2 = order.filter((id) => id.startsWith("a2-"));

// Progress rows as getLessonProgress returns them: Map(lesson_id -> row).
const progressFor = (ids, stars = 3) =>
  new Map(ids.map((id) => [id, { lesson_id: id, best_score: 100, stars, attempts: 1 }]));

describe("path order", () => {
  it("has ids the lesson routes accept, A1 before A2", () => {
    // Same pattern as lessonParamValidators: a node with another id could
    // never be opened or completed.
    for (const id of order) expect(id).toMatch(/^a[12]-u\d+-(l\d+|test)$/);
    expect(a1.length).toBeGreaterThan(0);
    expect(a2.length).toBeGreaterThan(0);
    expect(order).toEqual([...a1, ...a2]);
  });

  it("ends every unit with its checkpoint, which reviews all the unit's words", () => {
    const checkpoints = order.filter((id) => id.endsWith("-test"));
    for (const id of checkpoints) {
      const checkpoint = getNode(id);
      const lessons = order
        .map(getNode)
        .filter((node) => node.unitId === checkpoint.unitId && node.type === "lesson");
      expect(nextNodeAfter(lessons.at(-1).id).id).toBe(id);
      expect(checkpoint.items).toEqual(lessons.flatMap((lesson) => lesson.items));
    }
  });
});

describe("computeStatuses (sequential unlocking)", () => {
  it("opens only the first node for a new user", () => {
    const statuses = computeStatuses(new Set());
    expect(statuses.get(order[0])).toBe("current");
    for (const id of order.slice(1)) expect(statuses.get(id)).toBe("locked");
  });

  it("unlocks exactly the node after the completed ones", () => {
    const statuses = computeStatuses(new Set(order.slice(0, 3)));
    expect(order.slice(0, 3).map((id) => statuses.get(id))).toEqual([
      "completed",
      "completed",
      "completed",
    ]);
    expect(statuses.get(order[3])).toBe("current");
    expect(order.slice(4).every((id) => statuses.get(id) === "locked")).toBe(true);
  });

  it("keeps A2 locked until the last A1 checkpoint is done", () => {
    const almost = computeStatuses(new Set(a1.slice(0, -1)));
    expect(almost.get(a1.at(-1))).toBe("current");
    expect(almost.get(a2[0])).toBe("locked");

    const done = computeStatuses(new Set(a1));
    expect(done.get(a2[0])).toBe("current");
  });

  it("marks everything completed when the whole path is done", () => {
    const statuses = computeStatuses(new Set(order));
    expect([...statuses.values()].every((s) => s === "completed")).toBe(true);
  });
});

describe("buildPath", () => {
  it("returns A1 and A2 with their progress counts", () => {
    const levels = buildPath(progressFor(a1.slice(0, 2)));
    expect(levels.map((level) => level.id)).toEqual(["A1", "A2"]);
    expect(levels[0]).toMatchObject({ completed: 2, total: a1.length });
    expect(levels[1]).toMatchObject({ completed: 0, total: a2.length });
  });

  it("gives each node its status, best stars and word count", () => {
    const [first, second, third] = buildPath(progressFor(order.slice(0, 2), 2))[0]
      .units[0].nodes;
    expect(first).toMatchObject({ id: order[0], status: "completed", stars: 2 });
    expect(second).toMatchObject({ status: "completed", stars: 2 });
    expect(third).toMatchObject({ status: "current", stars: 0 });
    expect(first.wordCount).toBe(getNode(order[0]).items.length);
  });

  it("doesn't send the words themselves (they are loaded per lesson)", () => {
    const node = buildPath(new Map())[0].units[0].nodes[0];
    expect(node).not.toHaveProperty("items");
  });
});

describe("findCurrentNode / nextNodeAfter", () => {
  it("points a new user to the first lesson and a finished one to nothing", () => {
    expect(findCurrentNode(new Set()).id).toBe(order[0]);
    expect(findCurrentNode(new Set(order))).toBeNull();
  });

  it("goes from the last A1 node to the first A2 node, then ends", () => {
    // completeLesson relies on this to report levelCompleted.
    expect(nextNodeAfter(a1.at(-1))).toMatchObject({ id: a2[0], level: "A2" });
    expect(nextNodeAfter(order.at(-1))).toBeNull();
  });
});

describe("curriculum content", () => {
  it.each(["A1", "A2"])("has no repeated word in %s for any language", (levelId) => {
    // A repeated word would make two options of a question correct.
    for (const language of LANGUAGE_CODES) {
      const terms = getLevelCards(levelId, language).map((card) => card.term.toLowerCase());
      expect(terms.every(Boolean)).toBe(true);
      expect(new Set(terms).size).toBe(terms.length);
    }
  });

  it("gives Chinese cards their pinyin and other languages no hint", () => {
    const [zh] = getLevelCards("A1", "zh");
    const [es] = getLevelCards("A1", "es");
    expect(zh.hint).toBeTruthy();
    expect(es.hint).toBeUndefined();
  });
});
