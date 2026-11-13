import pool from "../config/db.js";

// token_version goes into session tokens (never in API responses).
const PUBLIC_FIELDS =
  "id, username, email, target_language, created_at, token_version";

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

// What the auth middleware needs to accept a token: does the user still
// exist, and is the token's version the current one?
export const findSessionUser = async (id) => {
  const [rows] = await pool.query(
    "SELECT id, username, token_version FROM users WHERE id = ?",
    [id],
  );
  return rows[0];
};

// Invalidates every token issued with `version`. Matching on the version
// means an old, already revoked token can't end the user's newer sessions.
export const revokeSessions = async (id, version) => {
  await pool.query(
    "UPDATE users SET token_version = token_version + 1 WHERE id = ? AND token_version = ?",
    [id, version],
  );
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
