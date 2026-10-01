// Applies db/migrations/*.sql in order, once each. Usage: npm run migrate
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mysql from "mysql2/promise";
import config from "../config/env.js";

const dir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../db/migrations",
);

const connection = await mysql.createConnection({
  ...config.db,
  charset: "utf8mb4",
  multipleStatements: true,
});

try {
  await connection.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
    name VARCHAR(255) PRIMARY KEY,
    applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);
  const [rows] = await connection.query("SELECT name FROM schema_migrations");
  const applied = new Set(rows.map((row) => row.name));

  const files = (await fs.readdir(dir)).filter((f) => f.endsWith(".sql")).sort();
  const pending = files.filter((f) => !applied.has(f));

  for (const file of pending) {
    console.log(`→ ${file}`);
    await connection.query(await fs.readFile(path.join(dir, file), "utf8"));
    await connection.query("INSERT INTO schema_migrations (name) VALUES (?)", [file]);
  }
  console.log(pending.length ? "Migrations applied." : "Database is up to date.");
} finally {
  await connection.end();
}
