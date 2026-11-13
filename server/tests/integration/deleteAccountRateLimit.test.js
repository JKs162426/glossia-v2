// Its own file because, once the limit is hit, this IP can't delete an
// account for 15 minutes. Each test file starts with a fresh limiter.
import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../../src/app.js";
import { createTestUser } from "./helpers.js";

describe("delete account rate limit", () => {
  it("blocks the 11th wrong password with 429, so a stolen session can't guess it", async () => {
    const user = await createTestUser();
    const attempt = (password) =>
      request(app).delete("/api/users/me").set("Cookie", user.cookie).send({ password });

    for (let i = 0; i < 10; i++) expect((await attempt("WrongPassword1")).status).toBe(403);

    const blocked = await attempt(user.password);
    expect(blocked.status).toBe(429);
    expect(blocked.body.message).toMatch(/Too many attempts/);
  });
});
