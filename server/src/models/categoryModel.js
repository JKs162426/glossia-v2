import pool from "../config/db.js";

// word_count lets the UI hide/disable decks that don't exist in a language.
export const getAllCategories = async (language) => {
  const [rows] = await pool.query(
    `SELECT c.id, c.name, c.icon, COUNT(w.id) AS word_count
     FROM categories c
     LEFT JOIN category_words w ON w.category_id = c.id AND w.language = ?
     GROUP BY c.id
     ORDER BY c.id`,
    [language],
  );
  return rows.map((row) => ({ ...row, word_count: Number(row.word_count) }));
};

export const getCategoryById = async (id) => {
  const [rows] = await pool.query(
    "SELECT id, name, icon FROM categories WHERE id = ?",
    [id],
  );
  return rows[0];
};

export const getWordsByCategory = async (categoryId, language) => {
  const [rows] = await pool.query(
    "SELECT id, word, translation, language FROM category_words WHERE category_id = ? AND language = ? ORDER BY id",
    [categoryId, language],
  );
  return rows;
};
