import pool from "../config/db.js";

export const addFavorite = async (userId, word, translation, language) => {
  const [result] = await pool.query(
    "INSERT INTO favorite_words (user_id, word, translation, language) VALUES (?, ?, ?, ?)",
    [userId, word, translation, language],
  );
  return result.insertId;
};

export const findFavorite = async (userId, word, language) => {
  const [rows] = await pool.query(
    "SELECT * FROM favorite_words WHERE user_id = ? AND word = ? AND language = ?",
    [userId, word, language],
  );
  return rows[0];
};

export const getFavoritesByUser = async (userId, language) => {
  const [rows] = await pool.query(
    `SELECT * FROM favorite_words
     WHERE user_id = ? ${language ? "AND language = ?" : ""}
     ORDER BY created_at DESC, id DESC`,
    language ? [userId, language] : [userId],
  );
  return rows;
};

export const deleteFavorite = async (id, userId) => {
  const [result] = await pool.query(
    "DELETE FROM favorite_words WHERE id = ? AND user_id = ?",
    [id, userId],
  );
  return result.affectedRows;
};
