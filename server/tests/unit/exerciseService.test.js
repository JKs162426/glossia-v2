import { describe, it, expect } from "vitest";
import { buildExercises, checkTyped, gradeAnswers } from "../../src/services/exerciseService.js";
import {
  getLevelCards,
  getNode,
  getNodeCards,
  getNodeOrder,
} from "../../src/services/curriculumService.js";

const makeCards = (count, prefix = "") =>
  Array.from({ length: count }, (_, i) => ({
    term: `${prefix}term${i}`,
    meaning: `${prefix}meaning${i}`,
  }));

// The same cases as client/src/lib/exercises.test.js: both must agree, or
// the lesson would say "Correct!" and the server would count it wrong.
describe("checkTyped", () => {
  it.each([
    ["perro", "el perro", "es"],
    ["El Perro", "el perro", "es"],
    ["Hund", "der Hund", "de"],
    ["eau", "l'eau", "fr"],
    ["l’eau", "l'eau", "fr"],
    ["eat", "to eat", "en"],
  ])("accepts %j for %j (%s)", (input, expected, language) => {
    expect(checkTyped(input, expected, language)).toEqual({ correct: true, note: null });
  });

  it.each([
    ["cafe", "el café", "es"],
    ["como estas", "¿cómo estás?", "es"],
  ])("accepts %j for %j but points out the accents", (input, expected, language) => {
    expect(checkTyped(input, expected, language)).toEqual({
      correct: true,
      note: "Watch the accents!",
    });
  });

  it("rejects a different word, or one that only starts like the answer", () => {
    expect(checkTyped("gato", "el perro", "es").correct).toBe(false);
    expect(checkTyped("per", "el perro", "es").correct).toBe(false);
    expect(checkTyped("", "el perro", "es").correct).toBe(false);
  });

  it("only strips articles of the lesson's language", () => {
    expect(checkTyped("der perro", "el perro", "es").correct).toBe(false);
  });
});

describe("buildExercises", () => {
  // What a lesson uses: its 6 words, plus every word of the level as
  // distractors (so the lesson's own words appear in both lists).
  const lessonCards = makeCards(6);
  const levelCards = [...lessonCards, ...makeCards(30, "other-")];
  const lesson = (language = "es", canSpeak = false) =>
    buildExercises({ type: "lesson", cards: lessonCards, distractors: levelCards, language, canSpeak });
  const checkpoint = (language = "es", canSpeak = false) =>
    buildExercises({ type: "checkpoint", cards: makeCards(12), distractors: levelCards, language, canSpeak });

  it("builds 12 exercises for every lesson and 11 for every checkpoint", () => {
    for (const id of getNodeOrder()) {
      const node = getNode(id);
      const exercises = buildExercises({
        type: node.type,
        cards: getNodeCards(node, "es"),
        distractors: getLevelCards(node.level, "es"),
        language: "es",
      });
      expect(exercises, id).toHaveLength(node.type === "checkpoint" ? 11 : 12);
    }
  });

  it("gives every exercise its position as id", () => {
    expect(lesson().map((e) => e.id)).toEqual([...Array(12).keys()]);
  });

  it("starts a lesson by showing every word once (recognition before recall)", () => {
    const exercises = lesson();
    expect(exercises.slice(0, 3).every((e) => e.type === "choice")).toBe(true);
    expect(exercises[3]).toMatchObject({ type: "match" });
    expect(exercises[3].pairs).toHaveLength(5);

    const shown = exercises.filter((e) => e.type === "choice").map((e) => e.card.term);
    expect(shown.sort()).toEqual(lessonCards.map((c) => c.term).sort());
  });

  it("offers 4 different options that include the answer exactly once", () => {
    for (const build of [lesson, checkpoint]) {
      for (const exercise of build().filter((e) => e.options)) {
        expect(exercise.options).toHaveLength(4);
        expect(new Set(exercise.options).size).toBe(4);
        expect(exercise.options.filter((o) => o === exercise.answer)).toHaveLength(1);
      }
    }
  });

  it("asks the meaning in choice exercises and the word in reverse ones", () => {
    for (const exercise of checkpoint()) {
      if (exercise.type === "choice") expect(exercise.answer).toBe(exercise.card.meaning);
      if (exercise.type === "reverse") expect(exercise.answer).toBe(exercise.card.term);
    }
  });

  it("asks to type the word in languages with a Latin keyboard", () => {
    const types = lesson("es").map((e) => e.type);
    expect(types.filter((t) => t === "type")).toHaveLength(2);
    expect(types).not.toContain("listen");
  });

  it("uses listening instead of typing for Russian and Chinese when the browser can speak", () => {
    for (const language of ["ru", "zh"]) {
      const types = lesson(language, true).map((e) => e.type);
      expect(types).not.toContain("type");
      expect(types.filter((t) => t === "listen")).toHaveLength(2);
    }
  });

  it("falls back to reverse exercises when the browser can't speak", () => {
    const types = checkpoint("ru", false).map((e) => e.type);
    expect(types).not.toContain("type");
    expect(types).not.toContain("listen");
    expect(types.filter((t) => t === "reverse")).toHaveLength(7);
  });
});

// The answers a learner who knows every word would send.
const rightAnswers = (exercises) =>
  exercises.map((e) => (e.type === "match" ? e.pairs.map((p) => [p.term, p.term]) : e.answer));

describe("gradeAnswers", () => {
  const exercises = buildExercises({
    type: "lesson",
    cards: makeCards(6),
    distractors: makeCards(30, "other-"),
    language: "es",
  });
  const matchAt = exercises.findIndex((e) => e.type === "match");
  const typeAt = exercises.findIndex((e) => e.type === "type");
  const choiceAt = exercises.findIndex((e) => e.type === "choice");
  const with_ = (index, answer) => rightAnswers(exercises).map((a, i) => (i === index ? answer : a));

  it("counts every right answer", () => {
    expect(gradeAnswers(exercises, rightAnswers(exercises), "es").every(Boolean)).toBe(true);
  });

  it("counts a wrong option, a missing answer or a wrong type of answer as wrong", () => {
    const wrongOption = exercises[choiceAt].options.find((o) => o !== exercises[choiceAt].answer);
    for (const answer of [wrongOption, undefined, null, 3, ["a", "b"]]) {
      const graded = gradeAnswers(exercises, with_(choiceAt, answer), "es");
      expect(graded[choiceAt], String(answer)).toBe(false);
      expect(graded.filter(Boolean)).toHaveLength(exercises.length - 1);
    }
  });

  it("grades typed answers leniently, like the lesson does", () => {
    const expected = exercises[typeAt].answer;
    expect(gradeAnswers(exercises, with_(typeAt, expected.toUpperCase()), "es")[typeAt]).toBe(true);
    expect(gradeAnswers(exercises, with_(typeAt, "something else"), "es")[typeAt]).toBe(false);
  });

  it("counts a match right only when every pair is matched with no wrong try", () => {
    const pairs = exercises[matchAt].pairs;
    const right = pairs.map((p) => [p.term, p.term]);
    const grade = (tries) => gradeAnswers(exercises, with_(matchAt, tries), "es")[matchAt];

    expect(grade(right)).toBe(true);
    expect(grade([[pairs[0].term, pairs[1].term], ...right])).toBe(false); // one mismatch
    expect(grade(right.slice(1))).toBe(false); // a pair left unmatched
    expect(grade([...right, ["made-up", "made-up"]])).toBe(false); // a word not in the match
    expect(grade("all right")).toBe(false);
  });
});
