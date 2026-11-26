import { describe, it, expect } from "vitest";
import { checkTyped } from "./exercises";

// The same cases as server/tests/unit/exerciseService.test.js: both copies
// of checkTyped must agree, or the lesson would say "Correct!" and the
// server would count the answer wrong.
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
