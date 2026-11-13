import { describe, it, expect } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../../src/app.js";
import pool from "../../src/config/db.js";
import config from "../../src/config/env.js";
import { AUTH_COOKIE } from "../../src/utils/authToken.js";
import { createTestUser, setCookie } from "./helpers.js";

// Wrong passwords count towards a 10-per-15-minutes limit; this file makes 3.
const deleteAccount = (cookie, body = {}) =>
  request(app).delete("/api/users/me").set("Cookie", cookie).send(body);

const userExists = async (id) =>
  (await pool.query("SELECT 1 FROM users WHERE id = ?", [id]))[0].length > 0;

// A session cookie as if the user had signed in `minutesAgo` minutes ago.
const cookieSignedInAgo = (user, minutesAgo) => {
  const iat = Math.floor(Date.now() / 1000) - minutesAgo * 60;
  const token = jwt.sign({ id: user.id, username: user.username, ver: 0, iat }, config.jwtSecret, {
    algorithm: "HS256",
    expiresIn: "7d",
  });
  return `${AUTH_COOKIE}=${token}`;
};

describe("GET /api/auth/me", () => {
  it("says whether the account has a password", async () => {
    const withPassword = await createTestUser();
    const google = await createTestUser({ google: true });

    const a = await request(app).get("/api/auth/me").set("Cookie", withPassword.cookie);
    const b = await request(app).get("/api/auth/me").set("Cookie", google.cookie);
    expect(a.body.user.has_password).toBe(true);
    expect(b.body.user.has_password).toBe(false);
  });
});

describe("DELETE /api/users/me", () => {
  it("requires a session (401)", async () => {
    expect((await request(app).delete("/api/users/me")).status).toBe(401);
  });

  it("refuses a wrong or missing password with 403 and keeps the account", async () => {
    const user = await createTestUser();

    const wrong = await deleteAccount(user.cookie, { password: "WrongPassword1" });
    expect(wrong.status).toBe(403);
    expect(wrong.body).toEqual({ message: "Incorrect password" });

    expect((await deleteAccount(user.cookie)).status).toBe(403);
    expect(await userExists(user.id)).toBe(true);
    // A wrong password isn't a dead session: the user stays logged in.
    expect((await request(app).get("/api/auth/me").set("Cookie", user.cookie)).status).toBe(200);
  });

  it("deletes the account and all its data with the right password (204)", async () => {
    const user = await createTestUser();
    await request(app)
      .post("/api/favorites")
      .set("Cookie", user.cookie)
      .send({ word: "perro", translation: "dog", language: "es" });

    const res = await deleteAccount(user.cookie, { password: user.password });

    expect(res.status).toBe(204);
    expect(setCookie(res, AUTH_COOKIE)).toMatch(/Expires=Thu, 01 Jan 1970/);
    expect(await userExists(user.id)).toBe(false);
    const [favorites] = await pool.query("SELECT 1 FROM favorite_words WHERE user_id = ?", [
      user.id,
    ]);
    expect(favorites).toHaveLength(0);
    // The old cookie is dead too.
    expect((await request(app).get("/api/auth/me").set("Cookie", user.cookie)).status).toBe(401);
  });

  it("deletes a Google account right after signing in with Google", async () => {
    const user = await createTestUser({ google: true });

    const res = await deleteAccount(cookieSignedInAgo(user, 2));

    expect(res.status).toBe(204);
    expect(await userExists(user.id)).toBe(false);
  });

  it("asks a Google account to sign in again when the session is older than 10 minutes", async () => {
    const user = await createTestUser({ google: true });

    const res = await deleteAccount(cookieSignedInAgo(user, 11), { password: "Anything123" });

    expect(res.status).toBe(403);
    expect(res.body).toEqual({
      message: "Sign in with Google again to delete your account.",
      reauth: true,
    });
    expect(await userExists(user.id)).toBe(true);
  });

  it("rejects a password that isn't a string (400)", async () => {
    const user = await createTestUser();
    const res = await deleteAccount(user.cookie, { password: ["Password123"] });
    expect(res.status).toBe(400);
    expect(await userExists(user.id)).toBe(true);
  });
});
