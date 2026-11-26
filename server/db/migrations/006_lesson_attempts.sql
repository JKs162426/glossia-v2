-- One row each time a learner opens a lesson. The server keeps the exercises
-- it built (with their answers) and grades the answers sent back against
-- them, so a score can't be made up in the browser. `result` is the response
-- of the completion, kept so a repeated request gets the same answer.
CREATE TABLE IF NOT EXISTS lesson_attempts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  language VARCHAR(10) NOT NULL,
  lesson_id VARCHAR(20) NOT NULL,
  exercises JSON NOT NULL,
  result JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  KEY idx_lesson_attempts_user (user_id, created_at),
  CONSTRAINT fk_lesson_attempts_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
