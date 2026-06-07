import pool from '../config/db.js';

export const addFavorite = async (userId, word, translation, language) => {
  const [result] = await pool.query(
    'INSERT INTO favorite_words (user_id, word, translation, language) VALUES (?, ?, ?, ?)',
    [userId, word, translation, language]
  );
  return result.insertId;
};

export const getFavoritesByUser = async (userId) => {
  const [rows] = await pool.query(
    'SELECT * FROM favorite_words WHERE user_id = ?',
    [userId]
  );
  return rows;
};

export const deleteFavorite = async (id, userId) => {
  const [result] = await pool.query(
    'DELETE FROM favorite_words WHERE id = ? AND user_id = ?',
    [id, userId]
  );
  return result.affectedRows;
};
