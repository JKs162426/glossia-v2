// Runs once before the integration tests: creates the *_test database if it
// doesn't exist and applies every migration, exactly like production.
import mysql from "mysql2/promise";

export default async function setup() {
  process.env.NODE_ENV = "test";
  // Imported here (not at the top) so NODE_ENV is set before env.js loads.
  const { default: config } = await import("../../src/config/env.js");
  const { runMigrations } = await import("../../src/db/runMigrations.js");
  const { database, ...server } = config.db;

  let connection;
  try {
    connection = await mysql.createConnection({ ...server, multipleStatements: true });
  } catch (error) {
    throw new Error(
      `Integration tests need MySQL at ${server.host}:${server.port} (see server/.env.test): ${error.code || error.message}`,
      { cause: error },
    );
  }
  try {
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci`,
    );
    await connection.changeUser({ database });
    await runMigrations(connection);
  } finally {
    await connection.end();
  }
}
