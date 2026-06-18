import {
  getAllCategories,
  getWordsByCategory,
} from "../models/categoryModel.js";

export const listCategories = async (req, res) => {
  try {
    const categories = await getAllCategories();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getCategoryWords = async (req, res) => {
  const { id } = req.params;
  const { language } = req.query;

  if (!language) {
    return res
      .status(400)
      .json({ message: "Language query param is required" });
  }

  try {
    const words = await getWordsByCategory(id, language);
    res.json(words);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
