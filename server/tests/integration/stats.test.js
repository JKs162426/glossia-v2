import { describe, it, expect, vi, afterEach } from "vitest";
import request from "supertest";
import app from "../../src/app.js";
import pool from "../../src/config/db.js";
import { createTestUser } from "./helpers.js";

const overview = (user) =>
  request(app).get("/api/stats/overview?language=es").set("Cookie", user.cookie);

// Activity for `user`: 2 favorites, 3 Spanish words (2 answered right at
// least once) plus 1 French word, 2 flashcard sessions and 2 days of XP.
const seed = async (user) => {
  const id = user.id;
  await pool.query(
    "INSERT INTO favorite_words (user_id, word, translation, language) VALUES (?, 'perro', 'dog', 'es'), (?, 'chat', 'cat', 'fr')",
    [id, id],
  );
  await pool.query(
    `INSERT INTO flashcard_progress (user_id, word, language, correct_count, incorrect_count) VALUES
     (?, 'el perro', 'es', 2, 0), (?, 'el gato', 'es', 1, 3), (?, 'la casa', 'es', 0, 2), (?, 'le chat', 'fr', 4, 0)`,
    [id, id, id, id],
  );
  await pool.query(
    "INSERT INTO flashcard_sessions (user_id, language, correct, total) VALUES (?, 'es', 8, 10), (?, 'fr', 5, 5)",
    [id, id],
  );
  await pool.query(
    "INSERT INTO activity_days (user_id, day, xp) VALUES (?, '2026-01-01', 15), (?, '2026-01-02', 10)",
    [id, id],
  );
};

describe("GET /api/stats/overview", () => {
  afterEach(() => vi.restoreAllMocks());

  it("counts only the user's own activity, and words in the chosen language", async () => {
    const user = await createTestUser();
    await seed(user);
    await seed(await createTestUser()); // someone else's activity must not count

    const res = await overview(user);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      favorites: 2,
      wordsLearned: 2,
      flashcardsReviewed: 15,
      totalXp: 25,
    });
  });

  it("answers with zeros for a new user", async () => {
    const res = await overview(await createTestUser());
    expect(res.body).toMatchObject({
      favorites: 0,
      wordsLearned: 0,
      flashcardsReviewed: 0,
      totalXp: 0,
      streak: 0,
    });
  });

  // Each query takes a connection from the pool of 10 at the same time, so a
  // dashboard that used 9 left room for barely one user at once.
  it("uses at most 6 queries, counting the session check", async () => {
    const user = await createTestUser();
    const query = vi.spyOn(pool, "query");
    await overview(user);
    expect(query.mock.calls.length).toBeLessThanOrEqual(6);
  });
});
