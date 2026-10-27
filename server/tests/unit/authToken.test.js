import { describe, it, expect, vi } from "vitest";
import jwt from "jsonwebtoken";
import config from "../../src/config/env.js";
import {
  AUTH_COOKIE,
  publicUser,
  setAuthCookie,
  signToken,
  verifyToken,
} from "../../src/utils/authToken.js";

const user = { id: 7, username: "ana", email: "ana@example.com", password: "hash" };

describe("signToken / verifyToken", () => {
  it("signs with HS256 and only the user's id and username", () => {
    const token = signToken(user);
    const { header, payload } = jwt.decode(token, { complete: true });
    expect(header.alg).toBe("HS256");
    expect(payload).toMatchObject({ id: 7, username: "ana" });
    expect(payload).not.toHaveProperty("email");
    expect(payload).not.toHaveProperty("password");
    expect(payload.exp).toBeGreaterThan(payload.iat);
  });

  it("verifies its own tokens", () => {
    expect(verifyToken(signToken(user))).toMatchObject({ id: 7, username: "ana" });
  });

  it("rejects a token signed with another algorithm, even with the right secret", () => {
    const token = jwt.sign({ id: 7 }, config.jwtSecret, { algorithm: "HS512" });
    expect(() => verifyToken(token)).toThrow(/invalid algorithm/);
  });

  it('rejects an unsigned token ("alg": "none")', () => {
    const token = jwt.sign({ id: 7 }, null, { algorithm: "none" });
    expect(() => verifyToken(token)).toThrow(jwt.JsonWebTokenError);
  });

  it("rejects a token signed with another secret", () => {
    const token = jwt.sign({ id: 7 }, "some-other-secret", { algorithm: "HS256" });
    expect(() => verifyToken(token)).toThrow(/invalid signature/);
  });

  it("rejects an expired token", () => {
    const token = jwt.sign({ id: 7 }, config.jwtSecret, {
      algorithm: "HS256",
      expiresIn: -10,
    });
    expect(() => verifyToken(token)).toThrow(jwt.TokenExpiredError);
  });

  it("rejects a token whose payload was edited", () => {
    const [header, , signature] = signToken(user).split(".");
    const forged = Buffer.from(JSON.stringify({ id: 1, username: "admin" })).toString(
      "base64url",
    );
    expect(() => verifyToken(`${header}.${forged}.${signature}`)).toThrow(/invalid signature/);
  });
});

describe("setAuthCookie", () => {
  it("stores the token in an httpOnly, SameSite=Lax cookie", () => {
    const res = { cookie: vi.fn() };
    setAuthCookie(res, user);
    const [name, token, options] = res.cookie.mock.calls[0];
    expect(name).toBe(AUTH_COOKIE);
    expect(verifyToken(token).id).toBe(7);
    expect(options).toMatchObject({ httpOnly: true, sameSite: "lax", path: "/" });
  });
});

describe("publicUser", () => {
  it("never exposes the password hash", () => {
    expect(publicUser(user)).toEqual({
      id: 7,
      username: "ana",
      email: "ana@example.com",
      target_language: "es",
    });
  });
});
