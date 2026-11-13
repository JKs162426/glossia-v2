import { describe, it, expect } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../../src/app.js";
import pool from "../../src/config/db.js";
import config from "../../src/config/env.js";
import { AUTH_COOKIE } from "../../src/utils/authToken.js";
import { createTestUser, setCookie } from "./helpers.js";

const me = (cookie) => request(app).get("/api/auth/me").set("Cookie", cookie);
const logout = (cookie) => request(app).post("/api/auth/logout").set("Cookie", cookie);

// The session cookie a successful login sets, ready for a Cookie header.
const loginCookie = async (user) => {
  const res = await request(app)
    .post("/api/auth/login")
    .send({ email: user.email, password: user.password });
  expect(res.status).toBe(200);
  return setCookie(res, AUTH_COOKIE).split(";")[0];
};

describe("revocable sessions", () => {
  it("a copied session cookie stops working after logout", async () => {
    const user = await createTestUser();
    const copied = user.cookie;
    expect((await me(copied)).status).toBe(200);

    expect((await logout(copied)).status).toBe(200);

    const res = await me(copied);
    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Invalid or expired session");
  });

  it("logging out on one device ends the sessions on every other device", async () => {
    const user = await createTestUser();
    const laptop = await loginCookie(user);
    const phone = await loginCookie(user);

    await logout(laptop);

    expect((await me(phone)).status).toBe(401);
  });

  it("a new login after logging out works", async () => {
    const user = await createTestUser();
    await logout(user.cookie);

    expect((await me(await loginCookie(user))).status).toBe(200);
  });

  it("an old, already revoked token can't end the new session", async () => {
    const user = await createTestUser();
    const old = user.cookie;
    await logout(old);
    const fresh = await loginCookie(user);

    await logout(old);

    expect((await me(fresh)).status).toBe(200);
  });

  it("logout with a forged token still answers 200 and expires the cookie", async () => {
    const res = await logout(`${AUTH_COOKIE}=not.a.real.token`);
    expect(res.status).toBe(200);
    expect(setCookie(res, AUTH_COOKIE)).toMatch(/Expires=Thu, 01 Jan 1970/);
  });

  it("tokens issued before versions existed keep working until a logout", async () => {
    const user = await createTestUser();
    const legacy = jwt.sign({ id: user.id, username: user.username }, config.jwtSecret, {
      algorithm: "HS256",
      expiresIn: "1h",
    });
    const cookie = `${AUTH_COOKIE}=${legacy}`;
    expect((await me(cookie)).status).toBe(200);

    await logout(cookie);
    expect((await me(cookie)).status).toBe(401);
  });

  it("the token of a deleted user answers 401, not 500", async () => {
    const user = await createTestUser();
    await pool.query("DELETE FROM users WHERE id = ?", [user.id]);

    const res = await request(app)
      .post("/api/favorites")
      .set("Cookie", user.cookie)
      .send({ word: "perro", translation: "dog", language: "es" });
    expect(res.status).toBe(401);
  });
});
