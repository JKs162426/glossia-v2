import {
  saveFlashcardSession,
  recordWordResults,
  addXp,
} from "../models/progressModel.js";
import { getCategoryById } from "../models/categoryModel.js";

export const createSession = async (req, res) => {
  const { language, categoryId = null, results } = req.body;

  if (categoryId && !(await getCategoryById(categoryId))) {
    return res.status(404).json({ message: "Category not found" });
  }

  const correct = results.filter((r) => r.correct).length;
  const xp = correct;

  await saveFlashcardSession(req.user.id, categoryId, language, correct, results.length);
  await recordWordResults(req.user.id, language, results);
  if (xp > 0) await addXp(req.user.id, xp);

  res.status(201).json({ correct, total: results.length, xp });
};
