// The server builds the exercises and grades the answers
// (server/src/services/exerciseService.js). This copy of its typing check
// gives the learner instant feedback; keep both in sync.

const ARTICLES = {
  es: ["el", "la", "los", "las", "un", "una"],
  fr: ["le", "la", "les", "l'", "un", "une"],
  de: ["der", "die", "das", "ein", "eine"],
  it: ["il", "lo", "la", "l'", "i", "gli", "le", "un", "una"],
  pt: ["o", "a", "os", "as", "um", "uma"],
  en: ["the", "a", "an", "to"],
};

const stripAccents = (text) => text.normalize("NFD").replace(/[̀-ͯ]/g, "");

const clean = (text) =>
  text
    .toLowerCase()
    .replace(/[¿?¡!.,…;:"«»]/g, "")
    .replace(/’/g, "'")
    .replace(/\s+/g, " ")
    .trim();

const withoutArticle = (text, language) => {
  for (const article of ARTICLES[language] || []) {
    if (article.endsWith("'") && text.startsWith(article)) {
      return text.slice(article.length);
    }
    if (text.startsWith(`${article} `)) return text.slice(article.length + 1);
  }
  return text;
};

// Lenient typing check: ignores case, punctuation and a missing article.
// Missing accents are accepted but reported so the learner notices them.
export function checkTyped(input, expected, language) {
  const typed = clean(input);
  const target = clean(expected);
  const variants = [target, withoutArticle(target, language)];

  if (variants.includes(typed) || variants.includes(withoutArticle(typed, language))) {
    return { correct: true, note: null };
  }
  const plain = (s) => stripAccents(withoutArticle(s, language));
  if (plain(typed) === plain(target)) {
    return { correct: true, note: "Watch the accents!" };
  }
  return { correct: false, note: null };
}
