// Runs inside every integration test file: after each test it deletes the
// users that test created (their favorites and progress go with them through
// ON DELETE CASCADE), and at the end it closes the file's connection pool.
import { afterEach, afterAll } from "vitest";
import pool from "../../src/config/db.js";
import { deleteTestUsers } from "./helpers.js";

afterEach(deleteTestUsers);
afterAll(() => pool.end());
