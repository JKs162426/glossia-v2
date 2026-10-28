// Its own file because, once the limit is hit, every login from this IP is
// blocked for 15 minutes. Each test file starts with a fresh limiter.
import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../../src/app.js";
import { createTestUser } from "./helpers.js";

describe("login rate limit", () => {
  it("blocks the 11th failed attempt with 429 and doesn't count successful logins", async () => {
    const user = await createTestUser();
    const login = (password) =>
      request(app).post("/api/auth/login").send({ email: user.email, password });

    for (let i = 0; i < 3; i++) expect((await login(user.password)).status).toBe(200);
    for (let i = 0; i < 10; i++) expect((await login("WrongPassword1")).status).toBe(401);

    const blocked = await login("WrongPassword1");
    expect(blocked.status).toBe(429);
    expect(blocked.body.message).toMatch(/Too many login attempts/);

    // Even the right password is refused until the window ends.
    expect((await login(user.password)).status).toBe(429);
  });
});
