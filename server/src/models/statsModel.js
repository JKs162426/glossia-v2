import pool from "../config/db.js";

// One query (and one pool connection) for the four dashboard counters.
export const getCounts = async (userId, language) => {
  const [[counts]] = await pool.query(
    `SELECT
       (SELECT COUNT(*) FROM favorite_words WHERE user_id = ?) AS favorites,
       (SELECT COUNT(*) FROM flashcard_progress
         WHERE user_id = ? AND language = ? AND correct_count > 0) AS wordsLearned,
       (SELECT COALESCE(SUM(total), 0) FROM flashcard_sessions WHERE user_id = ?) AS flashcardsReviewed,
       (SELECT COALESCE(SUM(xp), 0) FROM activity_days WHERE user_id = ?) AS totalXp`,
    [userId, userId, language, userId, userId],
  );

  return {
    favorites: Number(counts.favorites),
    wordsLearned: Number(counts.wordsLearned),
    flashcardsReviewed: Number(counts.flashcardsReviewed),
    totalXp: Number(counts.totalXp),
  };
};

// Days with activity in the year up to `today`, the user's local date
// (req.today), newest first. Days are stored in that same calendar (addXp).
export const getActivityDays = async (userId, today) => {
  const [rows] = await pool.query(
    `SELECT day, xp FROM activity_days
     WHERE user_id = ? AND day > ? - INTERVAL 1 YEAR
     ORDER BY day DESC`,
    [userId, today],
  );
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
            COALESCE(c.name, 'Favorites') AS category, COALESCE(c.icon, 'star') AS icon
     FROM flashcard_sessions s
     LEFT JOIN categories c ON c.id = s.category_id
     WHERE s.user_id = ?
     ORDER BY s.created_at DESC, s.id DESC
     LIMIT ?`,
    [userId, limit],
  );
  return rows;
};
