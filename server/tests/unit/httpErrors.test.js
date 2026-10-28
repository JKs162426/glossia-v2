// Bad requests are rejected by the JSON parser before any route or database
// code runs, so these tests don't need MySQL.
import { describe, it, expect, vi, afterEach } from "vitest";
import request from "supertest";
import app from "../../src/app.js";
import { errorHandler } from "../../src/middleware/errorHandler.js";

const postJson = (raw) =>
  request(app).post("/api/auth/login").set("Content-Type", "application/json").send(raw);

describe("malformed requests", () => {
  it("answers invalid JSON with 400 and no internal details", async () => {
    const res = await postJson('{"email": ');
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Invalid JSON body" });
    expect(res.text).not.toMatch(/SyntaxError|at .*\.js/);
  });

  it("answers a body over 20 KB with 413", async () => {
    const res = await postJson(JSON.stringify({ email: "a@b.co", password: "x".repeat(21_000) }));
    expect(res.status).toBe(413);
    expect(res.body).toEqual({ message: "Request body too large" });
  });
});

describe("errorHandler", () => {
  afterEach(() => vi.restoreAllMocks());

  const run = (err) => {
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    vi.spyOn(console, "error").mockImplementation(() => {});
    errorHandler(err, {}, res, () => {});
    return res;
  };

  it("hides the details of unexpected errors (they are only logged)", () => {
    const res = run(new Error("ER_PARSE_ERROR near 'SELECT * FROM users'"));
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: "Something went wrong" });
    expect(console.error).toHaveBeenCalled();
  });

  it("keeps the message of errors marked as safe to show", () => {
    // Like the error Express's JSON parser raises for an unsupported charset.
    const err = Object.assign(new Error('unsupported charset "UTF-7"'), {
      status: 415,
      expose: true,
    });
    const res = run(err);
    expect(res.status).toHaveBeenCalledWith(415);
    expect(res.json).toHaveBeenCalledWith({ message: 'unsupported charset "UTF-7"' });
  });
});
