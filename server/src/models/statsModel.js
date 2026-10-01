import pool from "../config/db.js";

const one = async (sql, params) => (await pool.query(sql, params))[0][0];

export const getCounts = async (userId, language) => {
  const [favorites, words, flashcards, xp] = await Promise.all([
    one("SELECT COUNT(*) AS n FROM favorite_words WHERE user_id = ?", [userId]),
    one(
      "SELECT COUNT(*) AS n FROM flashcard_progress WHERE user_id = ? AND language = ? AND correct_count > 0",
      [userId, language],
    ),
    one(
      "SELECT COALESCE(SUM(total), 0) AS n FROM flashcard_sessions WHERE user_id = ?",
      [userId],
    ),
    one("SELECT COALESCE(SUM(xp), 0) AS n FROM activity_days WHERE user_id = ?", [
      userId,
    ]),
  ]);

  return {
    favorites: Number(favorites.n),
    wordsLearned: Number(words.n),
    flashcardsReviewed: Number(flashcards.n),
    totalXp: Number(xp.n),
  };
};

// Days with activity in the last year, newest first, plus "today" from the
// DB clock so the streak math uses the same timezone as the stored dates.
export const getActivityDays = async (userId) => {
  const [rows] = await pool.query(
    `SELECT day, xp FROM activity_days
     WHERE user_id = ? AND day > CURDATE() - INTERVAL 1 YEAR
     ORDER BY day DESC`,
    [userId],
  );
  const [[{ today }]] = await pool.query("SELECT CURDATE() AS today");
  return { rows, today };
};

export const getRecentFavorites = async (userId, limit = 4) => {
  const [rows] = await pool.query(
    "SELECT id, word, translation, language FROM favorite_words WHERE user_id = ? ORDER BY created_at DESC, id DESC LIMIT ?",
    [userId, limit],
  );
  return rows;
};

export const getRecentSessions = async (userId, limit = 4) => {
  const [rows] = await pool.query(
    `SELECT s.id, s.language, s.correct, s.total, s.created_at,
            COALESCE(c.name, 'Favorites') AS category, COALESCE(c.icon, '⭐') AS icon
     FROM flashcard_sessions s
     LEFT JOIN categories c ON c.id = s.category_id
     WHERE s.user_id = ?
     ORDER BY s.created_at DESC, s.id DESC
     LIMIT ?`,
    [userId, limit],
  );
  return rows;
};
