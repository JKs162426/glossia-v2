import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../../src/app.js";
import pool from "../../src/config/db.js";
import { createTestUser } from "./helpers.js";

const getPath = (user, language = "es") =>
  request(app).get(`/api/learn/path?language=${language}`).set("Cookie", user.cookie);

const getLesson = (user, id, language = "es") =>
  request(app).get(`/api/learn/lessons/${id}?language=${language}`).set("Cookie", user.cookie);

const complete = (user, id, body) =>
  request(app)
    .post(`/api/learn/lessons/${id}/complete`)
    .set("Cookie", user.cookie)
    .send({ language: "es", correct: 12, total: 12, ...body });

const firstUnitNodes = async (user, language) =>
  (await getPath(user, language)).body.levels[0].units[0].nodes;

const lessonRow = async (user, id) =>
  (
    await pool.query(
      "SELECT best_score, stars, attempts FROM lesson_progress WHERE user_id = ? AND lesson_id = ?",
      [user.id, id],
    )
  )[0][0];

describe("learning path", () => {
  it("opens only the first lesson for a new user", async () => {
    const user = await createTestUser();
    const [first, second] = await firstUnitNodes(user);
    expect(first).toMatchObject({ id: "a1-u1-l1", status: "current", stars: 0 });
    expect(second).toMatchObject({ id: "a1-u1-l2", status: "locked" });

    const lesson = await getLesson(user, "a1-u1-l1");
    expect(lesson.status).toBe(200);
    expect(lesson.body.cards).toHaveLength(6);
  });

  it("refuses a locked lesson with 403, to open or to complete, and saves nothing", async () => {
    const user = await createTestUser();
    expect((await getLesson(user, "a1-u1-l2")).status).toBe(403);

    const res = await complete(user, "a1-u1-l2");
    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/Finish the previous lessons/);
    expect(await lessonRow(user, "a1-u1-l2")).toBeUndefined();
  });

  it("saves progress, stars and XP when a lesson is completed, and unlocks the next one", async () => {
    const user = await createTestUser();
    const res = await complete(user, "a1-u1-l1", { correct: 12, total: 12 });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      score: 100,
      stars: 3,
      xp: 15,
      firstCompletion: true,
      levelCompleted: false,
      nextLessonId: "a1-u1-l2",
    });
    expect(await lessonRow(user, "a1-u1-l1")).toEqual({ best_score: 100, stars: 3, attempts: 1 });

    const [first, second] = await firstUnitNodes(user);
    expect(first).toMatchObject({ status: "completed", stars: 3 });
    expect(second).toMatchObject({ status: "current" });
    expect((await getLesson(user, "a1-u1-l2")).status).toBe(200);

    const stats = await request(app)
      .get("/api/stats/overview?language=es")
      .set("Cookie", user.cookie);
    expect(stats.body).toMatchObject({ totalXp: 15, streak: 1, wordsLearned: 6 });
    expect(stats.body.nextLesson.id).toBe("a1-u1-l2");
  });

  it("keeps the best score and stars on a worse replay, and pays replay XP", async () => {
    const user = await createTestUser();
    await complete(user, "a1-u1-l1", { correct: 12, total: 12 });
    const replay = await complete(user, "a1-u1-l1", { correct: 6, total: 12 });

    expect(replay.body).toMatchObject({ score: 50, stars: 1, xp: 5, firstCompletion: false });
    expect(await lessonRow(user, "a1-u1-l1")).toEqual({ best_score: 100, stars: 3, attempts: 2 });
    const [[{ xp }]] = await pool.query(
      "SELECT SUM(xp) AS xp FROM activity_days WHERE user_id = ?",
      [user.id],
    );
    expect(Number(xp)).toBe(20);
  });

  it("keeps progress separate for each language", async () => {
    const user = await createTestUser();
    await complete(user, "a1-u1-l1");
    const [frFirst] = await firstUnitNodes(user, "fr");
    expect(frFirst).toMatchObject({ id: "a1-u1-l1", status: "current" });
  });

  it("answers 404 for a lesson that doesn't exist", async () => {
    const user = await createTestUser();
    expect((await getLesson(user, "a1-u99-l1")).status).toBe(404);
  });

  it.each([
    ["more correct answers than the total", { correct: 13, total: 12 }, /can't exceed/],
    ["a total of 0", { correct: 0, total: 0 }, /.+/],
    ["an unsupported language", { language: "xx" }, /Unsupported language/],
  ])("rejects %s with 400", async (_case, body, message) => {
    const user = await createTestUser();
    const res = await complete(user, "a1-u1-l1", body);
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(message);
    expect(await lessonRow(user, "a1-u1-l1")).toBeUndefined();
  });

  it("rejects an invalid lesson id or language in the URL with 400", async () => {
    const user = await createTestUser();
    expect((await getLesson(user, "a3-u1-l1")).status).toBe(400);
    expect((await getLesson(user, encodeURIComponent("a1-u1-l1' OR '1'='1"))).status).toBe(400);
    expect((await getPath(user, "xx")).status).toBe(400);
  });
});
