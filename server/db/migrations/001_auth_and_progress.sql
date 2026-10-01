-- Google accounts have no password (previously the literal 'google_oauth').
ALTER TABLE users MODIFY password VARCHAR(255) NULL;
UPDATE users SET password = NULL WHERE password = 'google_oauth';

-- Translator favorites can be longer than 100 chars; no duplicates per user.
DELETE f1 FROM favorite_words f1
JOIN favorite_words f2
  ON f1.user_id = f2.user_id AND f1.language = f2.language
 AND f1.word = f2.word AND f1.id > f2.id;
ALTER TABLE favorite_words
  MODIFY word VARCHAR(255) NOT NULL,
  MODIFY translation VARCHAR(255) NOT NULL,
  ADD UNIQUE KEY uq_favorite (user_id, language, word);

-- One progress row per user/language/word so results can be upserted.
DELETE p1 FROM flashcard_progress p1
JOIN flashcard_progress p2
  ON p1.user_id = p2.user_id AND p1.language = p2.language
 AND p1.word = p2.word AND p1.id > p2.id;
ALTER TABLE flashcard_progress
  MODIFY word VARCHAR(255) NOT NULL,
  ADD UNIQUE KEY uq_word_progress (user_id, language, word);

CREATE TABLE IF NOT EXISTS flashcard_sessions (
  id INT NOT NULL AUTO_INCREMENT,
  user_id INT NOT NULL,
  category_id INT NULL, -- NULL = favorites deck
  language VARCHAR(10) NOT NULL,
  correct INT NOT NULL,
  total INT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_sessions_user (user_id, created_at),
  CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_sessions_category FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS lesson_progress (
  user_id INT NOT NULL,
  language VARCHAR(10) NOT NULL,
  lesson_id VARCHAR(20) NOT NULL,
  best_score TINYINT UNSIGNED NOT NULL,
  stars TINYINT UNSIGNED NOT NULL,
  attempts INT NOT NULL DEFAULT 1,
  completed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, language, lesson_id),
  CONSTRAINT fk_lessons_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- One row per active day: drives the streak and XP on the dashboard.
CREATE TABLE IF NOT EXISTS activity_days (
  user_id INT NOT NULL,
  day DATE NOT NULL,
  xp INT NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, day),
  CONSTRAINT fk_activity_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
