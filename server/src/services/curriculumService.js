import { LEVELS } from "../data/curriculum.js";
import { baseLanguageFor } from "../config/languages.js";

// Path order: each unit's lessons, then the unit checkpoint ("test").
// Ids look like "a1-u2-l1" / "a1-u2-test" and are what progress rows store.
const nodes = [];

const levels = LEVELS.map((level) => ({
  ...level,
  units: level.units.map((unit, u) => {
    const unitId = `${level.id.toLowerCase()}-u${u + 1}`;
    const lessons = unit.lessons.map((lesson, l) => ({
      id: `${unitId}-l${l + 1}`,
      type: "lesson",
      title: lesson.title,
      items: lesson.items,
    }));
    const checkpoint = {
      id: `${unitId}-test`,
      type: "checkpoint",
      title: `${unit.title} Checkpoint`,
      items: lessons.flatMap((lesson) => lesson.items),
    };

    const unitNodes = [...lessons, checkpoint].map((node) => ({
      ...node,
      level: level.id,
      unitId,
      unitTitle: unit.title,
      unitIcon: unit.icon,
    }));
    nodes.push(...unitNodes);

    return { id: unitId, title: unit.title, icon: unit.icon, nodes: unitNodes };
  }),
}));

const nodeIndex = new Map(nodes.map((node, i) => [node.id, i]));

export const getNode = (id) => nodes[nodeIndex.get(id)];

export const getNodeOrder = () => nodes.map((node) => node.id);

const toCard = (item, language) => ({
  term: item[language],
  meaning: item[baseLanguageFor(language)],
  hint: language === "zh" ? item.pinyin : undefined,
});

export const getNodeCards = (node, language) =>
  node.items.map((item) => toCard(item, language));

// Every word of the node's level, used as wrong-answer options.
export const getLevelCards = (levelId, language) =>
  nodes
    .filter((node) => node.level === levelId && node.type === "lesson")
    .flatMap((node) => getNodeCards(node, language));

// Sequential unlocking: everything up to and including the first incomplete
// node is playable, the rest is locked.
export const computeStatuses = (completedIds) => {
  const statuses = new Map();
  let foundCurrent = false;
  for (const node of nodes) {
    if (completedIds.has(node.id)) {
      statuses.set(node.id, "completed");
    } else if (!foundCurrent) {
      statuses.set(node.id, "current");
      foundCurrent = true;
    } else {
      statuses.set(node.id, "locked");
    }
  }
  return statuses;
};

export const buildPath = (progressById) => {
  const statuses = computeStatuses(new Set(progressById.keys()));

  return levels.map((level) => {
    const units = level.units.map((unit) => ({
      id: unit.id,
      title: unit.title,
      icon: unit.icon,
      nodes: unit.nodes.map((node) => ({
        id: node.id,
        type: node.type,
        title: node.title,
        wordCount: node.items.length,
        status: statuses.get(node.id),
        stars: progressById.get(node.id)?.stars || 0,
      })),
    }));
    const all = units.flatMap((unit) => unit.nodes);

    return {
      id: level.id,
      title: level.title,
      description: level.description,
      completed: all.filter((node) => node.status === "completed").length,
      total: all.length,
      units,
    };
  });
};

export const nextNodeAfter = (id) => nodes[nodeIndex.get(id) + 1] || null;

export const findCurrentNode = (completedIds) =>
  nodes.find((node) => !completedIds.has(node.id)) || null;

// Defensive check at startup: a level must not contain the same word twice
// in one language, or multiple-choice questions could have two right answers.
const assertUniqueWords = () => {
  for (const level of LEVELS) {
    const items = level.units.flatMap((u) => u.lessons.flatMap((l) => l.items));
    for (const lang of ["en", "es", "fr", "de", "it", "pt", "ru", "zh"]) {
      const seen = new Set();
      for (const item of items) {
        if (!item[lang]) throw new Error(`Missing ${lang} for "${item.en}"`);
        const key = item[lang].toLowerCase();
        if (seen.has(key)) {
          throw new Error(`Duplicate ${lang} word "${item[lang]}" in ${level.id}`);
        }
        seen.add(key);
      }
    }
  }
};

assertUniqueWords();
