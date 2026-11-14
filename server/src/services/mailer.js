import fs from "node:fs/promises";
import nodemailer from "nodemailer";
import config from "../config/env.js";

const transport = config.mail.smtp ? nodemailer.createTransport(config.mail.smtp) : null;

// Without an SMTP provider (development and tests), emails land here instead:
// the integration tests read this array, the e2e tests read outboxFile.
export const outbox = [];

export async function sendMail({ to, subject, text, html }) {
  const message = { from: config.mail.from, to, subject, text, html };
  if (transport) {
    await transport.sendMail(message);
    return;
  }

  outbox.push(message);
  if (config.mail.outboxFile) {
    await fs.appendFile(config.mail.outboxFile, `${JSON.stringify(message)}\n`);
  }
  // In development the link is right there in the terminal.
  if (!config.isTest) console.log(`[mail] to ${to}: ${subject}\n${text}`);
}
