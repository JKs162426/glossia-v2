import fs from "node:fs/promises";
import setupDatabase from "../server/tests/integration/globalSetup.js";
import { OUTBOX_FILE } from "./outbox.js";

// Creates the *_test database if needed and applies every migration — the
// same setup the server's integration tests use — and empties the outbox
// left by the previous run.
export default async function globalSetup() {
  await fs.rm(OUTBOX_FILE, { force: true });
  return setupDatabase();
}
