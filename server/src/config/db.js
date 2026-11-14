import mysql from "mysql2/promise";
import config from "./env.js";

const pool = mysql.createPool({
  ...config.db,
  charset: "utf8mb4",
  connectionLimit: 10,
  dateStrings: ["DATE"],
});

export default pool;

// Runs fn(connection) inside a transaction: everything it writes is saved if
// it finishes, and nothing is if it throws.
export const withTransaction = async (fn) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};
