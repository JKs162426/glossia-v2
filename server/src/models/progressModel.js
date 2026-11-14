import pool from "../config/db.js";

// The writes below take `db`: the pool, or a transaction's connection
// (withTransaction in config/db.js) so a lesson or a session saves all or nothing.

// ---- Learning path ----

export const getLessonProgress = async (userId, language) => {
  const [rows] = await pool.query(
    "SELECT lesson_id, best_score, stars, attempts FROM lesson_progress WHERE user_id = ? AND language = ?",
    [userId, language],
  );
  return new Map(rows.map((row) => [row.lesson_id, row]));
};

// Returns true if this is the lesson's first completion. The insert decides
// it (1 row inserted vs 2 for an update), so two requests for the same
// lesson at once can't both count as the first one.
export const saveLessonResult = async (userId, language, lessonId, score, stars, db = pool) => {
  const [result] = await db.query(
    `INSERT INTO lesson_progress (user_id, language, lesson_id, best_score, stars)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       best_score = GREATEST(best_score, VALUES(best_score)),
       stars = GREATEST(stars, VALUES(stars)),
       attempts = attempts + 1`,
    [userId, language, lessonId, score, stars],
  );
  return result.affectedRows === 1;
};

// ---- Word progress (shared by flashcards and lessons) ----

export const recordWordResults = async (userId, language, results, db = pool) => {
  if (!results.length) return;
  const values = results.map(({ word, correct }) => [
    userId,
    word,
    language,
    correct ? 1 : 0,
    correct ? 0 : 1,
  ]);
  await db.query(
    `INSERT INTO flashcard_progress (user_id, word, language, correct_count, incorrect_count)
     VALUES ?
     ON DUPLICATE KEY UPDATE
       correct_count = correct_count + VALUES(correct_count),
       incorrect_count = incorrect_count + VALUES(incorrect_count),
       last_reviewed = CURRENT_TIMESTAMP`,
    [values],
  );
};

// ---- Flashcard sessions ----

export const saveFlashcardSession = async (
  userId,
  categoryId,
  language,
  correct,
  total,
  db = pool,
) => {
  await db.query(
    "INSERT INTO flashcard_sessions (user_id, category_id, language, correct, total) VALUES (?, ?, ?, ?, ?)",
    [userId, categoryId, language, correct, total],
  );
};

// ---- Daily activity (streak + XP) ----

// `day` is the user's local date ("YYYY-MM-DD", req.today), so the streak
// follows their calendar, not the database server's.
export const addXp = async (userId, xp, day, db = pool) => {
  await db.query(
    `INSERT INTO activity_days (user_id, day, xp) VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE xp = xp + VALUES(xp)`,
    [userId, day, xp],
  );
};
