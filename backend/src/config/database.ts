import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  ssl: process.env.DATABASE_URL?.includes("supabase.com")
    ? { rejectUnauthorized: false }
    : false,
});

pool.on("error", (err) => {
  console.error("Erro inesperado no pool do PostgreSQL:", err);
});

export default pool;
