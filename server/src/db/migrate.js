// Applies pending database migrations. Usage: npm run migrate
import mysql from "mysql2/promise";
import config from "../config/env.js";
import { runMigrations } from "./runMigrations.js";

const { host, port, user, database, ssl } = config.db;

let connection;
try {
  connection = await mysql.createConnection({
    ...config.db,
    charset: "utf8mb4",
    multipleStatements: true,
    connectTimeout: 15000,
  });
} catch (error) {
  // Say where we tried to connect (never the password) so misconfigured
  // DB_HOST / DB_PORT / DB_SSL_CA values are obvious in deploy logs.
  console.error(
    `Could not connect to MySQL at ${host}:${port} as "${user}" ` +
      `(database "${database}", TLS ${ssl ? "on" : "off"}): ${error.code || error.message}`,
  );
  process.exit(1);
}

try {
  const { applied } = await runMigrations(connection, { log: console.log });
  console.log(applied.length ? "Migrations applied." : "Database is up to date.");
} finally {
  await connection.end();
}
