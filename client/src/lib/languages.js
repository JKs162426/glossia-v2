// Must stay in sync with server/src/config/languages.js
export const LANGUAGES = [
  { code: "en", label: "English", flag: "🇬🇧", speech: "en-US" },
  { code: "es", label: "Spanish", flag: "🇪🇸", speech: "es-ES" },
  { code: "fr", label: "French", flag: "🇫🇷", speech: "fr-FR" },
  { code: "de", label: "German", flag: "🇩🇪", speech: "de-DE" },
  { code: "it", label: "Italian", flag: "🇮🇹", speech: "it-IT" },
  { code: "pt", label: "Portuguese", flag: "🇧🇷", speech: "pt-BR" },
  { code: "ru", label: "Russian", flag: "🇷🇺", speech: "ru-RU" },
  { code: "zh", label: "Chinese", flag: "🇨🇳", speech: "zh-CN" },
];

export const DEFAULT_LANGUAGE = "es";

export const getLanguage = (code) =>
  LANGUAGES.find((l) => l.code === code) || LANGUAGES[1];

// Explanations are in English unless English is what's being learned.
export const baseLanguageFor = (target) => (target === "en" ? "es" : "en");
