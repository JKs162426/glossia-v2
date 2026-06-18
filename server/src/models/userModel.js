import pool from "../config/db.js";

export const createUser = async (username, email, hashedPassword) => {
  const [result] = await pool.query(
    "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
    [username, email, hashedPassword]
  );
  return result.insertId;
};

export const findUserByEmail = async (email) => {
  const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [
    email,
  ]);
  return rows[0];
};

export const findUserById = async (id) => {
  const [rows] = await pool.query(
    "SELECT id, username, email, created_at FROM users WHERE id = ?",
    [id]
  );
  return rows[0];
};

export const updateTargetLanguage = async (userId, language) => {
  await pool.query("UPDATE users SET target_language = ? WHERE id = ?", [
    language,
    userId,
  ]);
};

export const findUserWithLanguage = async (id) => {
  const [rows] = await pool.query(
    "SELECT id, username, email, target_language FROM users WHERE id = ?",
    [id]
  );
  return rows[0];
};
