import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { expect } from "@playwright/test";

// The test server has no SMTP provider: it appends every email it sends to
// this file, one JSON object per line (server/src/services/mailer.js).
export const OUTBOX_FILE = path.join(os.tmpdir(), "glossia-e2e-outbox.jsonl");

const readOutbox = async () => {
  const text = await fs.readFile(OUTBOX_FILE, "utf8").catch(() => "");
  return text.split("\n").filter(Boolean).map((line) => JSON.parse(line));
};

// The latest email to `to` whose subject matches, waiting for it to arrive.
export async function emailTo(to, subject) {
  let mail;
  await expect
    .poll(async () => {
      mail = (await readOutbox()).findLast((m) => m.to === to && subject.test(m.subject));
      return Boolean(mail);
    }, { message: `an email to ${to} matching ${subject}` })
    .toBe(true);
  return mail;
}
