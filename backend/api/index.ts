import "dotenv/config";

// Supabase pooler uses self-signed cert in chain
if (process.env.DATABASE_URL?.includes("supabase.com")) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

import app from "../src/app";

export default app;
