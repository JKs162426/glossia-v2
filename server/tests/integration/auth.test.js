import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../../src/app.js";
import pool from "../../src/config/db.js";
import { AUTH_COOKIE } from "../../src/utils/authToken.js";
import { createTestUser, setCookie, uniqueUser } from "./helpers.js";

// POST /register allows 10 requests per hour per IP; this file makes 7.
const register = (body) => request(app).post("/api/auth/register").send(body);
const login = (body) => request(app).post("/api/auth/login").send(body);

describe("POST /api/auth/register", () => {
  it("creates the account (201) and starts a session in an httpOnly cookie", async () => {
    const user = uniqueUser();
    const res = await register(user);

    expect(res.status).toBe(201);
    expect(res.body.user).toEqual({
      id: expect.any(Number),
      username: user.username,
      email: user.email,
      target_language: "es",
    });
    const cookie = setCookie(res, AUTH_COOKIE);
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Lax/i);
    expect(cookie).toMatch(/Path=\//);
  });

  it("stores a bcrypt hash, never the password itself", async () => {
    const user = uniqueUser();
    await register(user);
    const [[row]] = await pool.query("SELECT password FROM users WHERE email = ?", [
      user.email,
    ]);
    expect(row.password).not.toContain(user.password);
    expect(row.password).toMatch(/^\$2[aby]\$12\$/);
  });

  it.each([
    ["too short", "abc1234", /at least 8/],
    ["without a number", "onlyletters", /number/],
    ["without a letter", "12345678", /letter/],
  ])("rejects a weak password (%s) with 400", async (_case, password, message) => {
    const user = uniqueUser();
    const res = await register({ ...user, password });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(message);
    expect(setCookie(res, AUTH_COOKIE)).toBeUndefined();
  });

  it("rejects an email that is already registered, in any case, with 409", async () => {
    const existing = await createTestUser();
    const res = await register({ ...uniqueUser(), email: existing.email.toUpperCase() });
    expect(res.status).toBe(409);
    expect(res.body.message).toBe("Email already in use");
  });

  it("rejects a username that is already taken with 409", async () => {
    const existing = await createTestUser();
    const res = await register({ ...uniqueUser(), username: existing.username });
    expect(res.status).toBe(409);
    expect(res.body.message).toBe("Username already taken");
  });
});

describe("POST /api/auth/login", () => {
  it("logs in with the right password (200) and sets the session cookie", async () => {
    const user = await createTestUser();
    const res = await login({ email: user.email, password: user.password });

    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({ id: user.id, username: user.username });
    expect(res.body.user).not.toHaveProperty("password");
    expect(setCookie(res, AUTH_COOKIE)).toMatch(/HttpOnly/i);
  });

  it("answers 401 with the same message for a wrong password or an unknown email", async () => {
    // A different message would tell an attacker which emails are registered.
    const user = await createTestUser();
    const wrongPassword = await login({ email: user.email, password: "WrongPassword1" });
    const unknownEmail = await login({ email: `nobody.${user.email}`, password: user.password });

    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    expect(wrongPassword.body).toEqual({ message: "Invalid email or password" });
    expect(unknownEmail.body).toEqual(wrongPassword.body);
    expect(setCookie(wrongPassword, AUTH_COOKIE)).toBeUndefined();
  });

  it("sends Google accounts to Google sign-in (400)", async () => {
    const user = await createTestUser({ google: true });
    const res = await login({ email: user.email, password: "Anything123" });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Google/);
  });
});

describe("GET /api/auth/me", () => {
  it("answers 401 without a session cookie", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Not authenticated");
  });

  it("answers 401 with a forged token", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Cookie", `${AUTH_COOKIE}=not.a.real.token`);
    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Invalid or expired session");
  });

  it("returns the logged-in user without the password hash", async () => {
    const user = await createTestUser();
    const res = await request(app).get("/api/auth/me").set("Cookie", user.cookie);
    expect(res.status).toBe(200);
    expect(res.body.user).toEqual({
      id: user.id,
      username: user.username,
      email: user.email,
      target_language: "es",
    });
  });
});

describe("POST /api/auth/logout", () => {
  it("expires the session cookie", async () => {
    const res = await request(app).post("/api/auth/logout");
    expect(res.status).toBe(200);
    const cookie = setCookie(res, AUTH_COOKIE);
    expect(cookie).toMatch(new RegExp(`^${AUTH_COOKIE}=;`));
    expect(cookie).toMatch(/Expires=Thu, 01 Jan 1970/);
  });

  it("ends the session in the browser: /me answers 401 afterwards", async () => {
    // request.agent keeps cookies between requests, like a browser.
    const user = await createTestUser();
    const browser = request.agent(app);
    await browser.post("/api/auth/login").send({ email: user.email, password: user.password });
    expect((await browser.get("/api/auth/me")).status).toBe(200);

    await browser.post("/api/auth/logout");
    expect((await browser.get("/api/auth/me")).status).toBe(401);
  });
});
