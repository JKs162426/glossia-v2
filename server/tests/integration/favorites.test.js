import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../../src/app.js";
import pool from "../../src/config/db.js";
import { createTestUser } from "./helpers.js";

const favorite = { word: "perro", translation: "dog", language: "es" };

const addFavorite = (user, body = favorite) =>
  request(app).post("/api/favorites").set("Cookie", user.cookie).send(body);

const listFavorites = (user) =>
  request(app).get("/api/favorites").set("Cookie", user.cookie);

describe("favorites", () => {
  it("require a session (401)", async () => {
    expect((await request(app).get("/api/favorites")).status).toBe(401);
    expect((await request(app).post("/api/favorites").send(favorite)).status).toBe(401);
  });

  it("are saved once; saving the same word again answers 409 with its id", async () => {
    const user = await createTestUser();
    const first = await addFavorite(user);
    expect(first.status).toBe(201);
    expect(first.body).toMatchObject({ id: expect.any(Number), ...favorite });

    const again = await addFavorite(user);
    expect(again.status).toBe(409);
    expect(again.body.id).toBe(first.body.id);
  });

  it("are listed only to their owner", async () => {
    const ana = await createTestUser();
    const ben = await createTestUser();
    await addFavorite(ana);

    expect((await listFavorites(ana)).body.map((f) => f.word)).toEqual(["perro"]);
    expect((await listFavorites(ben)).body).toEqual([]);
  });

  it("can't be deleted by another user (404, and it's still there)", async () => {
    const ana = await createTestUser();
    const ben = await createTestUser();
    const { id } = (await addFavorite(ana)).body;

    const res = await request(app).delete(`/api/favorites/${id}`).set("Cookie", ben.cookie);
    // 404, not 403, so ben can't even tell that the id exists.
    expect(res.status).toBe(404);
    const [rows] = await pool.query("SELECT id FROM favorite_words WHERE id = ?", [id]);
    expect(rows).toHaveLength(1);
  });

  it("can be deleted by their owner", async () => {
    const ana = await createTestUser();
    const { id } = (await addFavorite(ana)).body;

    const res = await request(app).delete(`/api/favorites/${id}`).set("Cookie", ana.cookie);
    expect(res.status).toBe(200);
    expect((await listFavorites(ana)).body).toEqual([]);
  });

  it.each([
    ["an invalid id", "/api/favorites/abc"],
    ["id 0", "/api/favorites/0"],
  ])("reject %s with 400", async (_case, path) => {
    const user = await createTestUser();
    expect((await request(app).delete(path).set("Cookie", user.cookie)).status).toBe(400);
  });

  it("reject an unsupported language with 400", async () => {
    const user = await createTestUser();
    const res = await addFavorite(user, { ...favorite, language: "xx" });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Unsupported language");
  });
});
