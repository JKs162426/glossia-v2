import pool from "../config/db.js";

const PUBLIC_FIELDS = "id, username, email, target_language, created_at";

// password is NULL for accounts created through Google sign-in.
export const createUser = async (username, email, hashedPassword = null) => {
  const [result] = await pool.query(
    "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
    [username, email, hashedPassword],
  );
  return result.insertId;
};

// Includes the password hash — only for credential checks, never send it out.
export const findUserByEmail = async (email) => {
  const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [
    email,
  ]);
  return rows[0];
};

export const findUserById = async (id) => {
  const [rows] = await pool.query(
    `SELECT ${PUBLIC_FIELDS} FROM users WHERE id = ?`,
    [id],
  );
  return rows[0];
};

export const usernameExists = async (username) => {
  const [rows] = await pool.query("SELECT 1 FROM users WHERE username = ?", [
    username,
  ]);
  return rows.length > 0;
};

export const updateTargetLanguage = async (userId, language) => {
  await pool.query("UPDATE users SET target_language = ? WHERE id = ?", [
    language,
    userId,
  ]);
};
