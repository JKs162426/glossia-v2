// Its own file: once a limit is hit, every request from this IP (or for this
// email) is blocked for the rest of the window. Each test file starts with
// fresh limiters.
import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../../src/app.js";
import { uniqueUser } from "./helpers.js";

const forgot = (email) => request(app).post("/api/auth/forgot-password").send({ email });

describe("forgot-password rate limits", () => {
  it("sends at most 3 emails per hour to the same address", async () => {
    const { email } = uniqueUser();
    for (let i = 0; i < 3; i++) expect((await forgot(email)).status).toBe(202);

    // Different capitals and spaces are still the same address.
    const blocked = await forgot(`  ${email.toUpperCase()} `);
    expect(blocked.status).toBe(429);
    expect(blocked.body.message).toMatch(/for this email/);
  });

  it("allows 5 requests per IP every 15 minutes, whatever the email", async () => {
    // 4 used by the test above, which shares this file's IP limiter.
    expect((await forgot(uniqueUser().email)).status).toBe(202);

    const blocked = await forgot(uniqueUser().email);
    expect(blocked.status).toBe(429);
    expect(blocked.body.message).toMatch(/Too many requests/);
  });
});
