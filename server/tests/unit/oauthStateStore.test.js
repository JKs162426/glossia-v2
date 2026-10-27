import { describe, it, expect, vi } from "vitest";
import { cookieStateStore } from "../../src/utils/oauthStateStore.js";

const COOKIE = "glossia_oauth_state";

// The minimum of req/res that passport-oauth2 hands to the store.
const fakeReq = (cookies = {}) => ({
  cookies,
  res: { cookie: vi.fn(), clearCookie: vi.fn() },
});

const verify = (req, state) =>
  new Promise((resolve, reject) => {
    cookieStateStore.verify(req, state, (err, ok, info) =>
      err ? reject(err) : resolve({ ok, info }),
    );
  });

describe("cookieStateStore.store", () => {
  it("creates a random state and saves it in a short-lived httpOnly cookie", () => {
    const req = fakeReq();
    let state;
    cookieStateStore.store(req, (err, value) => {
      state = value;
    });

    expect(state).toMatch(/^[0-9a-f]{48}$/);
    expect(req.res.cookie).toHaveBeenCalledWith(
      COOKIE,
      state,
      expect.objectContaining({ httpOnly: true, sameSite: "lax", maxAge: 10 * 60 * 1000 }),
    );
  });

  it("never repeats a state", () => {
    const states = new Set();
    for (let i = 0; i < 50; i++) {
      cookieStateStore.store(fakeReq(), (err, value) => states.add(value));
    }
    expect(states.size).toBe(50);
  });
});

describe("cookieStateStore.verify", () => {
  const state = "a".repeat(48);

  it("accepts the state saved in the cookie", async () => {
    expect((await verify(fakeReq({ [COOKIE]: state }), state)).ok).toBe(true);
  });

  it.each([
    ["a different state", { [COOKIE]: state }, "b".repeat(48)],
    ["no cookie", {}, state],
    ["no state in the callback", { [COOKIE]: state }, undefined],
    ["a state of a different length", { [COOKIE]: state }, "a".repeat(47)],
    // Same number of characters but more bytes: "é" takes 2 bytes in UTF-8.
    ["a same-length state with a multibyte character", { [COOKIE]: state }, `é${"a".repeat(47)}`],
    ["a non-string state", { [COOKIE]: state }, ["a".repeat(48)]],
  ])("rejects %s without throwing", async (_case, cookies, received) => {
    const { ok, info } = await verify(fakeReq(cookies), received);
    expect(ok).toBe(false);
    expect(info.message).toMatch(/state/i);
  });

  it("clears the cookie whether the state is valid or not (one use only)", async () => {
    const valid = fakeReq({ [COOKIE]: state });
    const invalid = fakeReq({ [COOKIE]: state });
    await verify(valid, state);
    await verify(invalid, "nope");
    expect(valid.res.clearCookie).toHaveBeenCalledWith(COOKIE, expect.any(Object));
    expect(invalid.res.clearCookie).toHaveBeenCalledWith(COOKIE, expect.any(Object));
  });
});
