import { describe, it, expect, vi, afterEach } from "vitest";
import request from "supertest";
import app from "../../src/app.js";
import pool from "../../src/config/db.js";
import { getNodeOrder } from "../../src/services/curriculumService.js";
import { dayIn } from "../../src/middleware/localDay.js";
import { createTestUser, uniqueUser } from "./helpers.js";

const complete = (user, id, body = {}, zone) => {
  const req = request(app).post(`/api/learn/lessons/${id}/complete`).set("Cookie", user.cookie);
  if (zone) req.set("X-Time-Zone", zone);
  return req.send({ language: "es", correct: 12, total: 12, ...body });
};

const saveSession = (user, body) =>
  request(app)
    .post("/api/flashcards/sessions")
    .set("Cookie", user.cookie)
    .send({ language: "es", ...body });

const rows = async (sql, params) => (await pool.query(sql, params))[0];
const totalXp = async (user) =>
  Number((await rows("SELECT COALESCE(SUM(xp), 0) AS xp FROM activity_days WHERE user_id = ?", [user.id]))[0].xp);

// A category deck in Spanish: its cards' terms are the `translation` column.
const spanishDeck = async () => {
  const [{ category_id }] = await rows(
    "SELECT category_id FROM category_words WHERE language = 'es' LIMIT 1",
  );
  const words = await rows(
    "SELECT translation FROM category_words WHERE category_id = ? AND language = 'es' ORDER BY id",
    [category_id],
  );
  return { categoryId: category_id, terms: words.map((w) => w.translation) };
};

// Makes the next transaction fail on the statement matching `pattern`, the
// way a lost connection or a full disk would.
const failOn = (pattern) => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  const getConnection = pool.getConnection.bind(pool);
  vi.spyOn(pool, "getConnection").mockImplementation(async () => {
    const conn = await getConnection();
    const query = conn.query.bind(conn);
    conn.query = (sql, ...args) =>
      pattern.test(sql) ? Promise.reject(new Error("simulated failure")) : query(sql, ...args);
    return conn;
  });
};

afterEach(() => vi.restoreAllMocks());

describe("completing a lesson", () => {
  it("two requests at once give the first-completion XP only once", async () => {
    const user = await createTestUser();

    const results = await Promise.all([complete(user, "a1-u1-l1"), complete(user, "a1-u1-l1")]);

    expect(results.map((r) => r.status)).toEqual([200, 200]);
    expect(results.filter((r) => r.body.firstCompletion)).toHaveLength(1);
    // 15 for the first completion (10 + 5 perfect), 10 for the replay (5 + 5).
    expect(await totalXp(user)).toBe(25);
    const [progress] = await rows(
      "SELECT attempts FROM lesson_progress WHERE user_id = ? AND lesson_id = 'a1-u1-l1'",
      [user.id],
    );
    expect(progress.attempts).toBe(2);
  });

  it("refuses a total that isn't the lesson's number of exercises, and saves nothing", async () => {
    const user = await createTestUser();

    const res = await complete(user, "a1-u1-l1", { correct: 20, total: 20 });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("This result doesn't match the lesson");
    expect(await rows("SELECT 1 FROM lesson_progress WHERE user_id = ?", [user.id])).toHaveLength(0);
    expect(await totalXp(user)).toBe(0);
  });

  it("a checkpoint has 11 exercises", async () => {
    const user = await createTestUser();
    const order = getNodeOrder();
    const unitLessons = order.slice(0, order.indexOf("a1-u1-test"));
    await pool.query(
      "INSERT INTO lesson_progress (user_id, language, lesson_id, best_score, stars) VALUES ?",
      [unitLessons.map((id) => [user.id, "es", id, 100, 3])],
    );

    expect((await complete(user, "a1-u1-test", { correct: 12, total: 12 })).status).toBe(400);
    expect((await complete(user, "a1-u1-test", { correct: 11, total: 11 })).status).toBe(200);
  });

  it("saves all or nothing: if the XP can't be written, the progress isn't either", async () => {
    const user = await createTestUser();
    failOn(/INSERT INTO activity_days/);

    const res = await complete(user, "a1-u1-l1");

    expect(res.status).toBe(500);
    vi.restoreAllMocks();
    expect(await rows("SELECT 1 FROM lesson_progress WHERE user_id = ?", [user.id])).toHaveLength(0);
    expect(await rows("SELECT 1 FROM flashcard_progress WHERE user_id = ?", [user.id])).toHaveLength(0);
    // And the lesson can still be completed normally afterwards.
    expect((await complete(user, "a1-u1-l1")).body.firstCompletion).toBe(true);
  });
});

describe("the user's own calendar day", () => {
  // UTC+14 and UTC-11: 25 hours apart, so they're always on different dates.
  const EAST = "Pacific/Kiritimati";
  const WEST = "Pacific/Pago_Pago";

  it("stores XP on the date in the user's time zone", async () => {
    const east = await createTestUser();
    const west = await createTestUser();

    await complete(east, "a1-u1-l1", {}, EAST);
    await complete(west, "a1-u1-l1", {}, WEST);

    const [eastDay] = await rows("SELECT day FROM activity_days WHERE user_id = ?", [east.id]);
    const [westDay] = await rows("SELECT day FROM activity_days WHERE user_id = ?", [west.id]);
    expect(eastDay.day).toBe(dayIn(EAST));
    expect(westDay.day).toBe(dayIn(WEST));
    expect(eastDay.day).not.toBe(westDay.day);
  });

  it("the dashboard counts the streak and the week from the user's today", async () => {
    const user = await createTestUser();
    await complete(user, "a1-u1-l1", {}, EAST);

    const stats = await request(app)
      .get("/api/stats/overview?language=es")
      .set("Cookie", user.cookie)
      .set("X-Time-Zone", EAST);

    expect(stats.body.streak).toBe(1);
    expect(stats.body.week.at(-1)).toEqual({ day: dayIn(EAST), xp: 15 });
  });

  it("an invalid or missing zone falls back to UTC", async () => {
    const user = await createTestUser();
    await complete(user, "a1-u1-l1", {}, "Not/A_Zone");

    const [row] = await rows("SELECT day FROM activity_days WHERE user_id = ?", [user.id]);
    expect(row.day).toBe(dayIn("UTC"));
  });
});

describe("flashcard sessions", () => {
  it("saves a session of cards from the deck", async () => {
    const user = await createTestUser();
    const { categoryId, terms } = await spanishDeck();

    const res = await saveSession(user, {
      categoryId,
      results: [
        { word: terms[0], correct: true },
        { word: terms[1], correct: false },
      ],
    });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ correct: 1, total: 2, xp: 1 });
  });

  it("refuses made-up or repeated words, and saves nothing", async () => {
    const user = await createTestUser();
    const { categoryId, terms } = await spanishDeck();

    for (const results of [
      [{ word: "not-in-this-deck", correct: true }],
      [
        { word: terms[0], correct: true },
        { word: terms[0], correct: true },
      ],
    ]) {
      const res = await saveSession(user, { categoryId, results });
      expect(res.status).toBe(400);
      expect(res.body.message).toBe("These cards aren't in this deck");
    }
    expect(await rows("SELECT 1 FROM flashcard_sessions WHERE user_id = ?", [user.id])).toHaveLength(0);
    expect(await totalXp(user)).toBe(0);
  });

  it("the favorites deck only takes the user's favorites in that language", async () => {
    const user = await createTestUser();
    await pool.query(
      "INSERT INTO favorite_words (user_id, word, translation, language) VALUES (?, 'gato', 'cat', 'es'), (?, 'chat', 'cat', 'fr')",
      [user.id, user.id],
    );

    expect((await saveSession(user, { results: [{ word: "gato", correct: true }] })).status).toBe(201);
    expect((await saveSession(user, { results: [{ word: "chat", correct: true }] })).status).toBe(400);
  });

  it("saves all or nothing: if the XP can't be written, the session isn't either", async () => {
    const user = await createTestUser();
    const { categoryId, terms } = await spanishDeck();
    failOn(/INSERT INTO activity_days/);

    const res = await saveSession(user, { categoryId, results: [{ word: terms[0], correct: true }] });

    expect(res.status).toBe(500);
    vi.restoreAllMocks();
    expect(await rows("SELECT 1 FROM flashcard_sessions WHERE user_id = ?", [user.id])).toHaveLength(0);
    expect(await rows("SELECT 1 FROM flashcard_progress WHERE user_id = ?", [user.id])).toHaveLength(0);
  });
});

describe("duplicates sent at the same time", () => {
  it("two sign-ups with one email: one account, and 409 (not 500) for the other", async () => {
    const { username, email, password } = uniqueUser();
    const register = (name) =>
      request(app).post("/api/auth/register").send({ username: name, email, password });

    const results = await Promise.all([register(username), register(`${username}_2`)]);

    expect(results.map((r) => r.status).sort()).toEqual([201, 409]);
    expect(results.find((r) => r.status === 409).body.message).toBe("Email already in use");
  });

  it("two sign-ups with one username: 409 says the username is taken", async () => {
    const a = uniqueUser();
    const b = uniqueUser();
    const register = (user) =>
      request(app)
        .post("/api/auth/register")
        .send({ username: a.username, email: user.email, password: user.password });

    const results = await Promise.all([register(a), register(b)]);

    expect(results.map((r) => r.status).sort()).toEqual([201, 409]);
    expect(results.find((r) => r.status === 409).body.message).toBe("Username already taken");
  });

  it("saving one favorite twice at once keeps one, and the other gets 409 with its id", async () => {
    const user = await createTestUser();
    const add = () =>
      request(app)
        .post("/api/favorites")
        .set("Cookie", user.cookie)
        .send({ word: "perro", translation: "dog", language: "es" });

    const results = await Promise.all([add(), add()]);

    expect(results.map((r) => r.status).sort()).toEqual([201, 409]);
    const saved = results.find((r) => r.status === 201).body.id;
    expect(results.find((r) => r.status === 409).body.id).toBe(saved);
    expect(await rows("SELECT 1 FROM favorite_words WHERE user_id = ?", [user.id])).toHaveLength(1);
  });
});
