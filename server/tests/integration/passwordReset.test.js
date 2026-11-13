import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import app from "../../src/app.js";
import pool from "../../src/config/db.js";
import { outbox } from "../../src/services/mailer.js";
import { createPasswordReset } from "../../src/models/passwordResetModel.js";
import { FORGOT_PASSWORD_MESSAGE } from "../../src/controllers/authController.js";
import { INVALID_RESET_LINK } from "../../src/middleware/validators.js";
import { createTestUser, uniqueUser } from "./helpers.js";

const NEW_PASSWORD = "BrandNew456";

const forgot = (email) => request(app).post("/api/auth/forgot-password").send({ email });
const reset = (token, password = NEW_PASSWORD) =>
  request(app).post("/api/auth/reset-password").send({ token, password });
const login = (email, password) => request(app).post("/api/auth/login").send({ email, password });

// The email is sent after the response, so wait for it to arrive.
const emailTo = (to, subject = /Reset your/) =>
  vi.waitFor(() => {
    const mail = outbox.find((m) => m.to === to && subject.test(m.subject));
    if (!mail) throw new Error(`no email to ${to}`);
    return mail;
  });

const tokenIn = (mail) => mail.text.match(/\/reset-password#token=([A-Za-z0-9_-]{43})/)[1];

// Through the API, the way a user gets one. All requests here come from one
// IP and forgot-password allows 5 per IP, so the other tests take the token
// straight from the model.
const requestToken = async (email) => {
  await forgot(email);
  return tokenIn(await emailTo(email));
};
const tokenFor = (user) => createPasswordReset(user.id);

beforeEach(() => {
  outbox.length = 0;
});

describe("POST /api/auth/forgot-password", () => {
  it("answers the same for an account and an unknown email, and only emails the account", async () => {
    const user = await createTestUser();
    const unknown = uniqueUser().email;

    const toUnknown = await forgot(unknown);
    const toUser = await forgot(user.email);

    expect(toUnknown.status).toBe(202);
    expect(toUser.status).toBe(202);
    expect(toUnknown.body).toEqual({ message: FORGOT_PASSWORD_MESSAGE });
    expect(toUser.body).toEqual(toUnknown.body);

    const mail = await emailTo(user.email);
    expect(mail.text).toContain(user.username);
    expect(mail.html).toContain(`#token=${tokenIn(mail)}`);
    expect(outbox).toHaveLength(1);
  });

  it("stores only a hash of the token", async () => {
    const user = await createTestUser();
    const token = await tokenFor(user);

    const [rows] = await pool.query("SELECT token_hash FROM password_resets WHERE user_id = ?", [
      user.id,
    ]);
    expect(rows).toHaveLength(1);
    expect(rows[0].token_hash).toMatch(/^[0-9a-f]{64}$/);
    expect(rows[0].token_hash).not.toContain(token);
  });

  it("rejects an invalid email with 400", async () => {
    const res = await forgot("not-an-email");
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Invalid email format");
  });
});

describe("POST /api/auth/reset-password", () => {
  it("sets the new password, ends every session and emails a notice", async () => {
    const user = await createTestUser();
    const token = await requestToken(user.email);

    const res = await reset(token);
    expect(res.status).toBe(200);
    expect(res.headers["set-cookie"].join()).toMatch(/glossia_token=;/);

    expect((await login(user.email, NEW_PASSWORD)).status).toBe(200);
    expect((await login(user.email, user.password)).status).toBe(401);
    // The session that existed before the reset (another device) is over.
    expect((await request(app).get("/api/auth/me").set("Cookie", user.cookie)).status).toBe(401);

    const notice = await emailTo(user.email, /password was changed/);
    expect(notice.text).toContain("/forgot-password");
  });

  it("works once: the same link a second time is 400", async () => {
    const user = await createTestUser();
    const token = await tokenFor(user);

    expect((await reset(token)).status).toBe(200);
    const again = await reset(token, "Another789");
    expect(again.status).toBe(400);
    expect(again.body.message).toBe(INVALID_RESET_LINK);
    expect((await login(user.email, "Another789")).status).toBe(401);
  });

  it("refuses an expired link with 400", async () => {
    const user = await createTestUser();
    const token = await tokenFor(user);
    await pool.query(
      "UPDATE password_resets SET expires_at = NOW() - INTERVAL 1 MINUTE WHERE user_id = ?",
      [user.id],
    );

    const res = await reset(token);
    expect(res.status).toBe(400);
    expect(res.body.message).toBe(INVALID_RESET_LINK);
    expect((await login(user.email, user.password)).status).toBe(200);
  });

  it("refuses made-up and malformed tokens with the same 400", async () => {
    for (const token of ["A".repeat(43), "short", "", null]) {
      const res = await reset(token);
      expect(res.status, String(token)).toBe(400);
      expect(res.body.message).toBe(INVALID_RESET_LINK);
    }
  });

  it("asking again cancels the previous link", async () => {
    const user = await createTestUser();
    const first = await tokenFor(user);
    const second = await tokenFor(user);

    expect((await reset(first)).status).toBe(400);
    expect((await reset(second)).status).toBe(200);
  });

  it("applies the password rules and keeps the link usable after a rejected password", async () => {
    const user = await createTestUser();
    const token = await tokenFor(user);

    const weak = await reset(token, "nodigits");
    expect(weak.status).toBe(400);
    expect(weak.body.message).toBe("Password must contain at least one number");

    expect((await reset(token)).status).toBe(200);
  });

  it("lets a Google account add a password", async () => {
    const user = await createTestUser({ google: true });
    const token = await tokenFor(user);

    expect((await reset(token)).status).toBe(200);
    const res = await login(user.email, NEW_PASSWORD);
    expect(res.status).toBe(200);
    expect(res.body.user.has_password).toBe(true);
  });

  it("two requests with the same link at once: only one succeeds", async () => {
    const user = await createTestUser();
    const token = await tokenFor(user);

    const results = await Promise.all([reset(token, "RaceOne111"), reset(token, "RaceTwo222")]);
    expect(results.map((r) => r.status).sort()).toEqual([200, 400]);
  });
});
