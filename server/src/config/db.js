import mysql from "mysql2/promise";
import config from "./env.js";

const pool = mysql.createPool({
  ...config.db,
  charset: "utf8mb4",
  connectionLimit: 10,
  dateStrings: ["DATE"],
});

export default pool;
