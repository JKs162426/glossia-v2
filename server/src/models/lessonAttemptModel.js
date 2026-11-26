import pool from "../config/db.js";

// An attempt can be finished up to a day after it was opened.
export const ATTEMPT_TTL_HOURS = 24;

// Saves the exercises built for this attempt and returns its id. The user's
// attempts that can no longer be finished are deleted on the way.
export const createAttempt = async (userId, language, lessonId, exercises) => {
  await pool.query(
    "DELETE FROM lesson_attempts WHERE user_id = ? AND created_at < NOW() - INTERVAL ? HOUR",
    [userId, ATTEMPT_TTL_HOURS],
  );
  const [result] = await pool.query(
    "INSERT INTO lesson_attempts (user_id, language, lesson_id, exercises) VALUES (?, ?, ?, ?)",
    [userId, language, lessonId, JSON.stringify(exercises)],
  );
  return result.insertId;
};

// The attempt, locked until the transaction ends, so two requests finishing
// it at once are handled one after the other. Only the user's own attempt
// for this lesson and language is found.
export const lockAttempt = async (conn, { id, userId, lessonId, language }) => {
  const [rows] = await conn.query(
    `SELECT exercises, result, completed_at IS NOT NULL AS completed,
            created_at < NOW() - INTERVAL ? HOUR AS expired
     FROM lesson_attempts
     WHERE id = ? AND user_id = ? AND lesson_id = ? AND language = ?
     FOR UPDATE`,
    [ATTEMPT_TTL_HOURS, id, userId, lessonId, language],
  );
  const row = rows[0];
  return row && { ...row, completed: Boolean(row.completed), expired: Boolean(row.expired) };
};

export const finishAttempt = async (conn, id, result) => {
  await conn.query(
    "UPDATE lesson_attempts SET completed_at = NOW(), result = ? WHERE id = ?",
    [JSON.stringify(result), id],
  );
};
