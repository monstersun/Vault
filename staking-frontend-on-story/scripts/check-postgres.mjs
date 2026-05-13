#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import pg from "pg";

function loadEnv() {
  const envPath = path.join(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, "utf8");
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const idx = line.indexOf("=");
    if (idx <= 0) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
}

async function main() {
  loadEnv();
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is missing.");
  }

  const target = new URL(connectionString);
  const dbName = decodeURIComponent(target.pathname.replace(/^\//, ""));

  const { Client } = pg;

  const adminUrl = new URL(connectionString);
  adminUrl.pathname = "/postgres";
  const admin = new Client({ connectionString: adminUrl.toString() });
  await admin.connect();
  const dbResult = await admin.query(
    "SELECT 1 FROM pg_database WHERE datname = $1 LIMIT 1",
    [dbName]
  );
  await admin.end();

  const app = new Client({ connectionString });
  await app.connect();
  const tableResult = await app.query(
    "SELECT to_regclass('public.transactions') AS table_name"
  );
  const countResult = await app.query(
    "SELECT count(*)::int AS n FROM transactions"
  );
  await app.end();

  console.log("database:", dbName);
  console.log("database_exists:", dbResult.rowCount > 0);
  console.log("transactions_table:", tableResult.rows[0]?.table_name ?? null);
  console.log("transactions_count:", countResult.rows[0]?.n ?? 0);
}

main().catch((error) => {
  console.error("db:check failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});

