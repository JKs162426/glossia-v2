import {
  saveFlashcardSession,
  recordWordResults,
  addXp,
} from "../models/progressModel.js";
import { getCategoryById, getCategoryTerms } from "../models/categoryModel.js";
import { getFavoriteTerms } from "../models/favoritesModel.js";
import { withTransaction } from "../config/db.js";

export const createSession = async (req, res) => {
  const { language, categoryId = null, results } = req.body;
  const userId = req.user.id;

  if (categoryId && !(await getCategoryById(categoryId))) {
    return res.status(404).json({ message: "Category not found" });
  }

  // Each answered card must be in the deck, once: XP is one per card, so
  // made-up or repeated words would inflate it.
  const deck = categoryId
    ? await getCategoryTerms(categoryId, language)
    : await getFavoriteTerms(userId, language);
  const words = results.map((r) => r.word);
  if (new Set(words).size !== words.length || !words.every((word) => deck.has(word))) {
    return res.status(400).json({ message: "These cards aren't in this deck" });
  }

  // The learner grades the cards themselves ("Got it" / "Missed"), so the
  // server can't check `correct`. XP is per card reviewed, known or not, so
  // marking everything as known isn't worth more.
  const correct = results.filter((r) => r.correct).length;
  const xp = results.length;

  await withTransaction(async (conn) => {
    await saveFlashcardSession(userId, categoryId, language, correct, results.length, conn);
    await recordWordResults(userId, language, results, conn);
    if (xp > 0) await addXp(userId, xp, req.today, conn);
  });

  res.status(201).json({ correct, total: results.length, xp });
};
