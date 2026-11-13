import { test as base, expect } from "@playwright/test";

// Test data goes straight into the test database through the server's own
// helpers (the same ones the integration tests use). NODE_ENV must be set
// first: it makes the server's config read server/.env.test.
process.env.NODE_ENV = "test";
const { createTestUser, uniqueUser } = await import("../server/tests/integration/helpers.js");
const { default: pool } = await import("../server/src/config/db.js");
const { AUTH_COOKIE } = await import("../server/src/utils/authToken.js");

// Before logging in, the app asks "who am I?" and gets a 401; Chrome logs
// that as a console error even though it's expected.
const isExpected401 = (message) =>
  message.text().includes("401") && message.location().url.endsWith("/api/auth/me");

export const test = base.extend({
  // Fails the test if the page throws or logs an error.
  consoleErrors: [
    async ({ page }, use) => {
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("console", (message) => {
        if (message.type() === "error" && !isExpected401(message)) errors.push(message.text());
      });
      await use(errors);
      expect(errors, "errors in the browser console").toEqual([]);
    },
    { auto: true },
  ],

  // Emails of the users a test creates; they're deleted when it ends (their
  // progress and favorites go with them). Only this test's users, so tests
  // can run in parallel.
  usersToDelete: async ({}, use) => {
    const emails = [];
    await use(emails);
    if (emails.length) await pool.query("DELETE FROM users WHERE email IN (?)", [emails]);
  },

  // A new account that isn't logged in anywhere.
  account: async ({ usersToDelete }, use) => {
    const account = await createTestUser();
    usersToDelete.push(account.email);
    await use(account);
  },

  // A new account, already logged in in the browser.
  user: async ({ context, baseURL, account: user }, use) => {
    await context.addCookies([
      {
        name: AUTH_COOKIE,
        value: user.cookie.slice(AUTH_COOKIE.length + 1),
        url: baseURL,
        httpOnly: true,
        sameSite: "Lax",
      },
    ]);
    await use(user);
  },

  // One connection pool per worker, closed when the worker ends.
  dbPool: [
    async ({}, use) => {
      await use(pool);
      await pool.end();
    },
    { scope: "worker", auto: true },
  ],
});

export { expect, uniqueUser, AUTH_COOKIE };
