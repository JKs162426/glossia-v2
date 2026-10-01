import {
  getAllCategories,
  getCategoryById,
  getWordsByCategory,
} from "../models/categoryModel.js";

export const listCategories = async (req, res) => {
  res.json(await getAllCategories(req.query.language));
};

// Returns the deck as flashcards: `term` is in the language being learned,
// `meaning` in the reference language (category_words stores them as
// translation/word respectively).
export const getCategoryDeck = async (req, res) => {
  const category = await getCategoryById(req.params.id);
  if (!category) {
    return res.status(404).json({ message: "Category not found" });
  }

  const words = await getWordsByCategory(req.params.id, req.query.language);
  res.json({
    category,
    cards: words.map((w) => ({ id: w.id, term: w.translation, meaning: w.word })),
  });
};
