import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../../src/app.js";
import pool from "../../src/config/db.js";
import { createTestUser } from "./helpers.js";
import { answersFor, finishLesson, playLesson, startLesson } from "./lessonHelpers.js";

const getPath = (user, language = "es") =>
  request(app).get(`/api/learn/path?language=${language}`).set("Cookie", user.cookie);

const getLesson = (user, id, language = "es") =>
  request(app).get(`/api/learn/lessons/${id}?language=${language}`).set("Cookie", user.cookie);

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

  it("refuses a locked lesson with 403, to open, to start or to complete, and saves nothing", async () => {
    const user = await createTestUser();
    expect((await getLesson(user, "a1-u1-l2")).status).toBe(403);
    expect((await startLesson(user, "a1-u1-l2")).status).toBe(403);

    // Even with an attempt of another lesson: the lock is checked first.
    const open = await startLesson(user, "a1-u1-l1");
    const res = await finishLesson(user, "a1-u1-l2", {
      attemptId: open.body.attemptId,
      answers: answersFor(open.body.exercises),
    });
    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/Finish the previous lessons/);
    expect(await lessonRow(user, "a1-u1-l2")).toBeUndefined();
  });

  it("saves progress, stars and XP when a lesson is completed, and unlocks the next one", async () => {
    const user = await createTestUser();
    const res = await playLesson(user, "a1-u1-l1");

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
    await playLesson(user, "a1-u1-l1");
    const replay = await playLesson(user, "a1-u1-l1", { wrong: 6 });

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
    await playLesson(user, "a1-u1-l1");
    const [frFirst] = await firstUnitNodes(user, "fr");
    expect(frFirst).toMatchObject({ id: "a1-u1-l1", status: "current" });
  });

  it("answers 404 for a lesson that doesn't exist", async () => {
    const user = await createTestUser();
    expect((await getLesson(user, "a1-u99-l1")).status).toBe(404);
  });

  it.each([
    ["no answers", { answers: [] }, /Answers must be a list/],
    ["a number instead of answers", { correct: 12, total: 12, answers: undefined }, /Answers must be a list/],
    ["an answer that isn't text or match tries", { answers: [{ correct: true }] }, /Invalid answer/],
    ["a missing attempt", { attemptId: undefined }, /Invalid attempt/],
    ["an unsupported language", { language: "xx" }, /Unsupported language/],
  ])("rejects %s with 400", async (_case, body, message) => {
    const user = await createTestUser();
    const attempt = await startLesson(user, "a1-u1-l1");
    const res = await finishLesson(user, "a1-u1-l1", {
      attemptId: attempt.body.attemptId,
      answers: answersFor(attempt.body.exercises),
      ...body,
    });
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

describe("lesson attempts: the server grades the answers", () => {
  const attemptRow = async (id) =>
    (await pool.query("SELECT user_id, completed_at FROM lesson_attempts WHERE id = ?", [id]))[0][0];

  it("builds the exercises and keeps them for grading", async () => {
    const user = await createTestUser();
    const res = await startLesson(user, "a1-u1-l1");

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ id: "a1-u1-l1", type: "lesson", language: "es" });
    expect(res.body.exercises).toHaveLength(12);
    expect(await attemptRow(res.body.attemptId)).toMatchObject({ user_id: user.id, completed_at: null });
  });

  it("scores the answers sent: 3 wrong out of 12 is 75, whatever the browser claims", async () => {
    const user = await createTestUser();
    const attempt = await startLesson(user, "a1-u1-l1");
    const res = await finishLesson(user, "a1-u1-l1", {
      attemptId: attempt.body.attemptId,
      answers: answersFor(attempt.body.exercises, { wrong: 3 }),
      correct: 12,
      total: 12,
    });

    expect(res.body).toMatchObject({ score: 75, stars: 2, xp: 10 });
    expect(await lessonRow(user, "a1-u1-l1")).toMatchObject({ best_score: 75, stars: 2 });
  });

  it("refuses a result with a different number of answers, and saves nothing", async () => {
    const user = await createTestUser();
    const attempt = await startLesson(user, "a1-u1-l1");
    const answers = answersFor(attempt.body.exercises);

    for (const sent of [answers.slice(1), [...answers, answers[0]]]) {
      const res = await finishLesson(user, "a1-u1-l1", { attemptId: attempt.body.attemptId, answers: sent });
      expect(res.status).toBe(400);
      expect(res.body.message).toBe("This result doesn't match the lesson");
    }
    expect(await lessonRow(user, "a1-u1-l1")).toBeUndefined();
    expect((await attemptRow(attempt.body.attemptId)).completed_at).toBeNull();
  });

  it("only finishes the user's own attempt, for its lesson and language", async () => {
    const owner = await createTestUser();
    const other = await createTestUser();
    const attempt = await startLesson(owner, "a1-u1-l1");
    const body = { attemptId: attempt.body.attemptId, answers: answersFor(attempt.body.exercises) };

    expect((await finishLesson(other, "a1-u1-l1", body)).status).toBe(404);
    expect((await finishLesson(owner, "a1-u1-l1", { ...body, language: "fr" })).status).toBe(404);
    expect(await lessonRow(other, "a1-u1-l1")).toBeUndefined();
    expect((await finishLesson(owner, "a1-u1-l1", body)).status).toBe(200);
  });

  it("finishing the same attempt again answers the same, without more XP", async () => {
    const user = await createTestUser();
    const attempt = await startLesson(user, "a1-u1-l1");
    const body = { attemptId: attempt.body.attemptId, answers: answersFor(attempt.body.exercises) };

    const first = await finishLesson(user, "a1-u1-l1", body);
    const again = await finishLesson(user, "a1-u1-l1", body);

    expect(again.status).toBe(200);
    expect(again.body).toEqual(first.body);
    expect(await lessonRow(user, "a1-u1-l1")).toMatchObject({ attempts: 1 });
    const [[{ xp }]] = await pool.query("SELECT SUM(xp) AS xp FROM activity_days WHERE user_id = ?", [user.id]);
    expect(Number(xp)).toBe(15);
  });

  it("an attempt opened more than a day ago can't be finished, and is cleaned up", async () => {
    const user = await createTestUser();
    const old = await startLesson(user, "a1-u1-l1");
    await pool.query("UPDATE lesson_attempts SET created_at = NOW() - INTERVAL 25 HOUR WHERE id = ?", [
      old.body.attemptId,
    ]);

    const res = await finishLesson(user, "a1-u1-l1", {
      attemptId: old.body.attemptId,
      answers: answersFor(old.body.exercises),
    });
    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/Start it again/);

    await startLesson(user, "a1-u1-l1");
    expect(await attemptRow(old.body.attemptId)).toBeUndefined();
  });

  it("refuses a canSpeak that isn't true or false", async () => {
    const user = await createTestUser();
    expect((await startLesson(user, "a1-u1-l1", { canSpeak: "yes" })).status).toBe(400);
  });
});
