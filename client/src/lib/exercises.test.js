import { describe, it, expect, vi, beforeEach } from "vitest";
import { buildExercises, checkTyped } from "./exercises";

// Speech support depends on the browser; each test sets it explicitly.
const speech = vi.hoisted(() => ({ canSpeak: false }));
vi.mock("./speech", () => speech);

const makeCards = (count, prefix = "") =>
  Array.from({ length: count }, (_, i) => ({
    term: `${prefix}term${i}`,
    meaning: `${prefix}meaning${i}`,
  }));

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

  it("rejects a different word", () => {
    expect(checkTyped("gato", "el perro", "es")).toEqual({ correct: false, note: null });
  });

  it("doesn't accept a word that only starts like the answer", () => {
    expect(checkTyped("per", "el perro", "es").correct).toBe(false);
    expect(checkTyped("", "el perro", "es").correct).toBe(false);
  });

  it("only strips articles of the lesson's language", () => {
    // "der" is German, so it isn't dropped from a Spanish answer.
    expect(checkTyped("der perro", "el perro", "es").correct).toBe(false);
  });
});

describe("buildExercises", () => {
  beforeEach(() => {
    speech.canSpeak = false;
  });

  // What the server sends for a lesson: its 6 words, plus every word of the
  // level as distractors (so the lesson's own words appear in both lists).
  const lessonCards = makeCards(6);
  const levelCards = [...lessonCards, ...makeCards(30, "other-")];
  const lesson = (language = "es") =>
    buildExercises({ type: "lesson", cards: lessonCards, distractors: levelCards, language });
  const checkpoint = (language = "es") =>
    buildExercises({
      type: "checkpoint",
      cards: makeCards(12),
      distractors: levelCards,
      language,
    });

  it("builds 12 exercises for a lesson and 11 for a checkpoint", () => {
    expect(lesson()).toHaveLength(12);
    expect(checkpoint()).toHaveLength(11);
  });

  it("gives every exercise a unique id in order", () => {
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

  it("uses listening instead of typing for Russian and Chinese when speech works", () => {
    speech.canSpeak = true;
    for (const language of ["ru", "zh"]) {
      const types = lesson(language).map((e) => e.type);
      expect(types).not.toContain("type");
      expect(types.filter((t) => t === "listen")).toHaveLength(2);
    }
  });

  it("falls back to reverse exercises when the browser can't speak", () => {
    const types = checkpoint("ru").map((e) => e.type);
    expect(types).not.toContain("type");
    expect(types).not.toContain("listen");
    expect(types.filter((t) => t === "reverse")).toHaveLength(7);
  });
});
