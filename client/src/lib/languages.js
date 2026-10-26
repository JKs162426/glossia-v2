// Must stay in sync with server/src/config/languages.js
// `mark` is the language's native initials, shown by <LanguageMark>.
export const LANGUAGES = [
  { code: "en", label: "English", mark: "En", speech: "en-US" },
  { code: "es", label: "Spanish", mark: "Es", speech: "es-ES" },
  { code: "fr", label: "French", mark: "Fr", speech: "fr-FR" },
  { code: "de", label: "German", mark: "De", speech: "de-DE" },
  { code: "it", label: "Italian", mark: "It", speech: "it-IT" },
  { code: "pt", label: "Portuguese", mark: "Pt", speech: "pt-BR" },
  { code: "ru", label: "Russian", mark: "Ру", speech: "ru-RU" },
  { code: "zh", label: "Chinese", mark: "中", speech: "zh-CN" },
];

export const DEFAULT_LANGUAGE = "es";

export const getLanguage = (code) =>
  LANGUAGES.find((l) => l.code === code) || LANGUAGES[1];

// Explanations are in English unless English is what's being learned.
export const baseLanguageFor = (target) => (target === "en" ? "es" : "en");
