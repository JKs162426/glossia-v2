import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const MIGRATIONS_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../db/migrations",
);

// Applies db/migrations/*.sql in name order, each one only once, and records
// it in schema_migrations. Shared by `npm run migrate` and the test setup so
// the test database always has exactly the production schema.
// `connection` must be opened with multipleStatements: true.
export async function runMigrations(connection, { log = () => {} } = {}) {
  await connection.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
    name VARCHAR(255) PRIMARY KEY,
    applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);
  const [rows] = await connection.query("SELECT name FROM schema_migrations");
  const applied = new Set(rows.map((row) => row.name));

  const files = (await fs.readdir(MIGRATIONS_DIR)).filter((f) => f.endsWith(".sql")).sort();
  const pending = files.filter((f) => !applied.has(f));

  for (const file of pending) {
    log(`→ ${file}`);
    await connection.query(await fs.readFile(path.join(MIGRATIONS_DIR, file), "utf8"));
    await connection.query("INSERT INTO schema_migrations (name) VALUES (?)", [file]);
  }
  return { applied: pending, total: files.length };
}
