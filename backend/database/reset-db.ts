import * as path from "path";
import { Pool } from "pg";
import * as dotenv from "dotenv";
import { execSync } from "child_process";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

async function resetDB() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();
  try {
    console.log("[reset] dropping schema...");
    await client.query("DROP SCHEMA public CASCADE");
    await client.query("CREATE SCHEMA public");
    await client.query("GRANT ALL ON SCHEMA public TO public");
    console.log("[reset] schema cleared");
  } finally {
    client.release();
    await pool.end();
  }

  console.log("[reset] running migrations...");
  execSync("npm run migrate", {
    stdio: "inherit",
    cwd: path.resolve(__dirname, ".."),
  });
  console.log("[reset] done");
}

resetDB().catch((err) => {
  console.error(err);
  process.exit(1);
});
