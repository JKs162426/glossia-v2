import bcrypt from "bcryptjs";
import pool from "../../src/config/db.js";
import { createUser } from "../../src/models/userModel.js";
import { AUTH_COOKIE, signToken } from "../../src/utils/authToken.js";

// Every user a test creates has an email on this domain, so the cleanup in
// setup.js deletes exactly those users (and, by cascade, their data).
const TEST_EMAIL_DOMAIN = "tests.glossia.dev";
export const PASSWORD = "Password123";

let counter = 0;

// Credentials that are unique per call and fit the 3–30 character username rule.
export const uniqueUser = () => {
  const username = `it_${Date.now().toString(36)}_${counter++}`;
  return { username, email: `${username}@${TEST_EMAIL_DOMAIN}`, password: PASSWORD };
};

export const authCookie = (user) => `${AUTH_COOKIE}=${signToken(user)}`;

// Inserts a user straight into the database: faster than POST /register and
// not counted by its rate limit (10 per hour). `google: true` creates an
// account without a password, like Google sign-in does.
export const createTestUser = async ({ google = false } = {}) => {
  const user = uniqueUser();
  // Cost 4 instead of 12 keeps the tests fast; bcrypt.compare works the same.
  const hash = google ? null : await bcrypt.hash(user.password, 4);
  const id = await createUser(user.username, user.email, hash);
  return { ...user, id, cookie: authCookie({ id, username: user.username }) };
};

export const deleteTestUsers = () =>
  pool.query("DELETE FROM users WHERE email LIKE ?", [`%@${TEST_EMAIL_DOMAIN}`]);

// The raw Set-Cookie line for one cookie, e.g. "glossia_token=…; Path=/; HttpOnly".
export const setCookie = (res, name) =>
  (res.headers["set-cookie"] || []).find((line) => line.startsWith(`${name}=`));
