// Must stay in sync with client/src/lib/languages.js
export const LANGUAGE_CODES = ["en", "es", "fr", "de", "it", "pt", "ru", "zh"];

// Lessons and flashcards are explained in English, except when the learner
// is studying English itself — then Spanish is the reference language.
export const baseLanguageFor = (target) => (target === "en" ? "es" : "en");
