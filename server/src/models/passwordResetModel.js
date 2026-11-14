import crypto from "node:crypto";
import pool from "../config/db.js";

export const RESET_TTL_MINUTES = 30;

const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

// Returns the token for the email link; the database only keeps its hash.
// One live link per user: asking again cancels the previous ones.
export const createPasswordReset = async (userId) => {
  const token = crypto.randomBytes(32).toString("base64url");
  await pool.query("DELETE FROM password_resets WHERE user_id = ?", [userId]);
  await pool.query(
    "INSERT INTO password_resets (user_id, token_hash, expires_at) VALUES (?, ?, NOW() + INTERVAL ? MINUTE)",
    [userId, hashToken(token), RESET_TTL_MINUTES],
  );
  return token;
};

// Sets the new password if the token is real, unused and not expired, and
// bumps token_version so every open session ends. The row lock makes two
// requests with the same link race safely: only one of them succeeds.
// Returns the user's id, or null when the token can't be used.
export const resetPasswordWithToken = async (token, passwordHash) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.query(
      `SELECT id, user_id FROM password_resets
       WHERE token_hash = ? AND used_at IS NULL AND expires_at > NOW()
       FOR UPDATE`,
      [hashToken(token)],
    );
    const reset = rows[0];
    if (!reset) {
      await conn.rollback();
      return null;
    }
    await conn.query(
      "UPDATE users SET password = ?, token_version = token_version + 1 WHERE id = ?",
      [passwordHash, reset.user_id],
    );
    await conn.query("UPDATE password_resets SET used_at = NOW() WHERE id = ?", [reset.id]);
    await conn.commit();
    return reset.user_id;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};
