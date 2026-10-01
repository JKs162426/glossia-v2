-- Baseline schema (as it existed before migrations were introduced).
-- Idempotent: safe to run against a database that already has these tables.

CREATE TABLE IF NOT EXISTS users (
  id INT NOT NULL AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL,
  email VARCHAR(100) NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  target_language VARCHAR(10) DEFAULT 'es',
  PRIMARY KEY (id),
  UNIQUE KEY username (username),
  UNIQUE KEY email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS favorite_words (
  id INT NOT NULL AUTO_INCREMENT,
  user_id INT NOT NULL,
  word VARCHAR(100) NOT NULL,
  translation VARCHAR(100) NOT NULL,
  language VARCHAR(10) NOT NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY user_id (user_id),
  CONSTRAINT favorite_words_ibfk_1 FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS categories (
  id INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL,
  icon VARCHAR(10) NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- word = reference language (English), translation = the language being learned
CREATE TABLE IF NOT EXISTS category_words (
  id INT NOT NULL AUTO_INCREMENT,
  category_id INT NOT NULL,
  language VARCHAR(10) NOT NULL,
  word VARCHAR(100) NOT NULL,
  translation VARCHAR(100) NOT NULL,
  PRIMARY KEY (id),
  KEY category_id (category_id),
  CONSTRAINT category_words_ibfk_1 FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS flashcard_progress (
  id INT NOT NULL AUTO_INCREMENT,
  user_id INT NOT NULL,
  word VARCHAR(100) NOT NULL,
  language VARCHAR(10) NOT NULL,
  correct_count INT DEFAULT 0,
  incorrect_count INT DEFAULT 0,
  last_reviewed TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY user_id (user_id),
  CONSTRAINT flashcard_progress_ibfk_1 FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT IGNORE INTO categories (id, name, icon) VALUES
  (1, 'Greetings', '👋'),
  (2, 'Food', '🍽');

INSERT IGNORE INTO category_words (id, category_id, language, word, translation) VALUES
  (1, 1, 'es', 'Hello', 'Hola'),
  (2, 1, 'es', 'Goodbye', 'Adiós'),
  (3, 1, 'es', 'Good morning', 'Buenos días'),
  (4, 1, 'es', 'Thank you', 'Gracias'),
  (5, 1, 'es', 'Please', 'Por favor'),
  (6, 1, 'es', 'Sorry', 'Lo siento'),
  (7, 1, 'fr', 'Hello', 'Bonjour'),
  (8, 1, 'fr', 'Goodbye', 'Au revoir'),
  (9, 1, 'fr', 'Good morning', 'Bonjour'),
  (10, 1, 'fr', 'Thank you', 'Merci'),
  (11, 1, 'fr', 'Please', 'S''il vous plaît'),
  (12, 1, 'fr', 'Sorry', 'Pardon'),
  (13, 1, 'ru', 'Hello', 'Привет'),
  (14, 1, 'ru', 'Goodbye', 'До свидания'),
  (15, 1, 'ru', 'Good morning', 'Доброе утро'),
  (16, 1, 'ru', 'Thank you', 'Спасибо'),
  (17, 1, 'ru', 'Please', 'Пожалуйста'),
  (18, 1, 'ru', 'Sorry', 'Извините'),
  (19, 2, 'es', 'Bread', 'Pan'),
  (20, 2, 'es', 'Water', 'Agua'),
  (21, 2, 'es', 'Apple', 'Manzana'),
  (22, 2, 'es', 'Chicken', 'Pollo'),
  (23, 2, 'es', 'Rice', 'Arroz'),
  (24, 2, 'es', 'Coffee', 'Café'),
  (25, 2, 'fr', 'Bread', 'Pain'),
  (26, 2, 'fr', 'Water', 'Eau'),
  (27, 2, 'fr', 'Apple', 'Pomme'),
  (28, 2, 'fr', 'Chicken', 'Poulet'),
  (29, 2, 'fr', 'Rice', 'Riz'),
  (30, 2, 'fr', 'Coffee', 'Café'),
  (31, 2, 'ru', 'Bread', 'Хлеб'),
  (32, 2, 'ru', 'Water', 'Вода'),
  (33, 2, 'ru', 'Apple', 'Яблоко'),
  (34, 2, 'ru', 'Chicken', 'Курица'),
  (35, 2, 'ru', 'Rice', 'Рис'),
  (36, 2, 'ru', 'Coffee', 'Кофе');
