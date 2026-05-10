import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const isSupabase = process.env.DATABASE_URL?.includes("supabase.com");
const connectionString = isSupabase
  ? process.env.DATABASE_URL?.replace(/[?&]sslmode=[^&]+/, "").replace(/\?$/, "")
  : process.env.DATABASE_URL;

const pool = new Pool({
  connectionString,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  ssl: isSupabase ? { rejectUnauthorized: false } : false,
});

pool.on("error", (err) => {
  console.error("Erro inesperado no pool do PostgreSQL:", err);
});

export default pool;
