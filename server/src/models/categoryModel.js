import pool from "../config/db.js";

export const getAllCategories = async () => {
  const [rows] = await pool.query("SELECT * FROM categories");
  return rows;
};

export const getWordsByCategory = async (categoryId, language) => {
  const [rows] = await pool.query(
    "SELECT * FROM category_words WHERE category_id = ? AND language = ?",
    [categoryId, language]
  );
  return rows;
};
