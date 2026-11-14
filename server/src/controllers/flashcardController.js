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

  // Each answered card must be in the deck, once: XP is one per right answer,
  // so made-up or repeated words would inflate it.
  const deck = categoryId
    ? await getCategoryTerms(categoryId, language)
    : await getFavoriteTerms(userId, language);
  const words = results.map((r) => r.word);
  if (new Set(words).size !== words.length || !words.every((word) => deck.has(word))) {
    return res.status(400).json({ message: "These cards aren't in this deck" });
  }

  const correct = results.filter((r) => r.correct).length;
  const xp = correct;

  await withTransaction(async (conn) => {
    await saveFlashcardSession(userId, categoryId, language, correct, results.length, conn);
    await recordWordResults(userId, language, results, conn);
    if (xp > 0) await addXp(userId, xp, req.today, conn);
  });

  res.status(201).json({ correct, total: results.length, xp });
};
