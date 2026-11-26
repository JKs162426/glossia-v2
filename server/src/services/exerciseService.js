// Builds a lesson's exercises and grades the answers. The server does both,
// so a score can't be made up in the browser: the client gets the exercises
// (answers included, for instant feedback), sends back what the learner
// actually picked or typed, and the score is computed here.

// Languages whose script is easy to type on any keyboard.
const TYPEABLE = new Set(["en", "es", "fr", "de", "it", "pt"]);

const ARTICLES = {
  es: ["el", "la", "los", "las", "un", "una"],
  fr: ["le", "la", "les", "l'", "un", "une"],
  de: ["der", "die", "das", "ein", "eine"],
  it: ["il", "lo", "la", "l'", "i", "gli", "le", "un", "una"],
  pt: ["o", "a", "os", "as", "um", "uma"],
  en: ["the", "a", "an", "to"],
};

const shuffle = (list) => {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
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
// The client has the same function (client/src/lib/exercises.js) for its
// instant feedback; keep both in sync.
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

const pickOptions = (card, field, pool) => {
  const seen = new Set([card[field]]);
  const wrong = [];
  for (const other of shuffle(pool)) {
    if (!seen.has(other[field])) {
      seen.add(other[field]);
      wrong.push(other[field]);
    }
    if (wrong.length === 3) break;
  }
  return shuffle([card[field], ...wrong]);
};

const choice = (card, pool) => ({
  type: "choice",
  card,
  options: pickOptions(card, "meaning", pool),
  answer: card.meaning,
});

const reverse = (card, pool) => ({
  type: "reverse",
  card,
  options: pickOptions(card, "term", pool),
  answer: card.term,
});

const listen = (card, pool) => ({
  type: "listen",
  card,
  options: pickOptions(card, "term", pool),
  answer: card.term,
});

const typing = (card) => ({ type: "type", card, answer: card.term });

const match = (cards) => ({ type: "match", pairs: cards });

// The exercise list for a lesson or a checkpoint: 12 for a lesson (6 words),
// 11 for a checkpoint. `canSpeak` is whether the learner's browser has text
// to speech: without it, Russian and Chinese get reverse questions instead
// of listening ones. Every exercise gets its position as id.
export function buildExercises({ type, cards, distractors, language, canSpeak }) {
  const pool = [...cards, ...distractors];
  const production = (card) =>
    TYPEABLE.has(language)
      ? typing(card)
      : canSpeak
        ? listen(card, pool)
        : reverse(card, pool);

  let list;
  if (type === "checkpoint") {
    const picked = shuffle(cards);
    list = [
      ...picked.slice(0, 3).map((c) => choice(c, pool)),
      match(shuffle(cards).slice(0, 5)),
      ...picked.slice(3, 7).map((c) => reverse(c, pool)),
      ...picked.slice(7, 10).map(production),
    ];
  } else {
    // Recognition first (see the word, pick its meaning), then recall.
    const intro = cards.map((c) => choice(c, pool));
    list = [
      ...intro.slice(0, 3),
      match(shuffle(cards).slice(0, 5)),
      ...intro.slice(3),
      ...shuffle([
        ...shuffle(cards).slice(0, 3).map((c) => reverse(c, pool)),
        ...shuffle(cards).slice(0, 2).map(production),
      ]),
    ];
  }

  return list.map((exercise, i) => ({ ...exercise, id: i }));
}

// A match is right when every pair ends up matched with no wrong try. Its
// answer is the list of tries, each [term clicked on the left, term of the
// meaning clicked on the right].
const matchIsRight = (pairs, tries) => {
  if (!Array.isArray(tries)) return false;
  const terms = new Set(pairs.map((p) => p.term));
  const matched = new Set();
  for (const attempt of tries) {
    if (!Array.isArray(attempt) || attempt.length !== 2) return false;
    const [left, right] = attempt;
    if (left !== right || !terms.has(left)) return false;
    matched.add(left);
  }
  return matched.size === terms.size;
};

// Whether the learner's first answer to each exercise was right. `answers`
// has one entry per exercise, in order: the option picked, the text typed,
// or the match tries.
export function gradeAnswers(exercises, answers, language) {
  return exercises.map((exercise, i) => {
    const answer = answers[i];
    if (exercise.type === "match") return matchIsRight(exercise.pairs, answer);
    if (typeof answer !== "string") return false;
    if (exercise.type === "type") return checkTyped(answer, exercise.answer, language).correct;
    return answer === exercise.answer;
  });
}
