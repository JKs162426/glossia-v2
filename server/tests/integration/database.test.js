import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import pool from "../../src/config/db.js";

const migrationFiles = fs
  .readdirSync(path.resolve(import.meta.dirname, "../../db/migrations"))
  .filter((f) => f.endsWith(".sql"));

describe("test database", () => {
  it("is a *_test database", async () => {
    const [[{ db }]] = await pool.query("SELECT DATABASE() AS db");
    expect(db).toMatch(/_test$/);
  });

  it("has every migration applied", async () => {
    const [rows] = await pool.query("SELECT name FROM schema_migrations ORDER BY name");
    expect(rows.map((r) => r.name)).toEqual(migrationFiles.sort());
  });

  it("has the seeded flashcard decks with icon names (migration 003)", async () => {
    const [rows] = await pool.query("SELECT name, icon FROM categories ORDER BY id");
    expect(rows).toEqual([
      { name: "Greetings", icon: "chat" },
      { name: "Food", icon: "utensils" },
      { name: "Animals", icon: "paw" },
      { name: "Clothes", icon: "shirt" },
    ]);
  });
});
