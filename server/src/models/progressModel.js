import pool from "../config/db.js";

// ---- Learning path ----

export const getLessonProgress = async (userId, language) => {
  const [rows] = await pool.query(
    "SELECT lesson_id, best_score, stars, attempts FROM lesson_progress WHERE user_id = ? AND language = ?",
    [userId, language],
  );
  return new Map(rows.map((row) => [row.lesson_id, row]));
};

export const saveLessonResult = async (userId, language, lessonId, score, stars) => {
  await pool.query(
    `INSERT INTO lesson_progress (user_id, language, lesson_id, best_score, stars)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       best_score = GREATEST(best_score, VALUES(best_score)),
       stars = GREATEST(stars, VALUES(stars)),
       attempts = attempts + 1`,
    [userId, language, lessonId, score, stars],
  );
};

// ---- Word progress (shared by flashcards and lessons) ----

export const recordWordResults = async (userId, language, results) => {
  if (!results.length) return;
  const values = results.map(({ word, correct }) => [
    userId,
    word,
    language,
    correct ? 1 : 0,
    correct ? 0 : 1,
  ]);
  await pool.query(
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

export const saveFlashcardSession = async (userId, categoryId, language, correct, total) => {
  await pool.query(
    "INSERT INTO flashcard_sessions (user_id, category_id, language, correct, total) VALUES (?, ?, ?, ?, ?)",
    [userId, categoryId, language, correct, total],
  );
};

// ---- Daily activity (streak + XP) ----

export const addXp = async (userId, xp) => {
  await pool.query(
    `INSERT INTO activity_days (user_id, day, xp) VALUES (?, CURDATE(), ?)
     ON DUPLICATE KEY UPDATE xp = xp + VALUES(xp)`,
    [userId, xp],
  );
};
