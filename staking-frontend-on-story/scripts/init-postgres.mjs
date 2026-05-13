#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import pg from "pg";

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i];
    const value = argv[i + 1];
    if (key === "--url" && value) {
      args.url = value;
      i += 1;
    }
  }
  return args;
}

function quoteIdentifier(identifier) {
  return `"${identifier.replaceAll("\"", "\"\"")}"`;
}

function printUsage() {
  console.log("Usage:");
  console.log("  npm run db:init");
  console.log("  npm run db:init -- --url postgresql://user:pass@host:5432/dbname");
  console.log("");
  console.log("This script will:");
  console.log("  1) Create the target database if it does not exist");
  console.log("  2) Create the transactions table and index");
}

function loadEnvFromDotenvIfNeeded() {
  if (process.env.DATABASE_URL) {
    return;
  }

  const envPath = path.join(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) {
    return;
  }

  const content = fs.readFileSync(envPath, "utf8");
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }
    const eqIndex = line.indexOf("=");
    if (eqIndex <= 0) {
      continue;
    }
    const key = line.slice(0, eqIndex).trim();
    let value = line.slice(eqIndex + 1).trim();
    if (
      (value.startsWith("\"") && value.endsWith("\"")) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

async function ensureDatabaseExists(targetUrl) {
  const databaseName = decodeURIComponent(targetUrl.pathname.replace(/^\//, ""));
  if (!databaseName) {
    throw new Error("DATABASE_URL must include a database name in the path.");
  }

  const adminUrl = new URL(targetUrl.toString());
  adminUrl.pathname = "/postgres";

  const { Client } = pg;
  const adminClient = new Client({ connectionString: adminUrl.toString() });
  await adminClient.connect();

  try {
    const existing = await adminClient.query(
      "SELECT 1 FROM pg_database WHERE datname = $1 LIMIT 1",
      [databaseName]
    );

    if (existing.rowCount && existing.rowCount > 0) {
      console.log(`Database already exists: ${databaseName}`);
      return;
    }

    await adminClient.query(`CREATE DATABASE ${quoteIdentifier(databaseName)}`);
    console.log(`Database created: ${databaseName}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    // Some managed/cloud PostgreSQL roles cannot create databases.
    // We still continue and let the next connection step validate the DB.
    console.warn(`Create database step warning: ${message}`);
  } finally {
    await adminClient.end();
  }
}

async function ensureSchema(connectionString) {
  const { Client } = pg;
  const client = new Client({ connectionString });
  await client.connect();

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        hash TEXT PRIMARY KEY,
        account TEXT NOT NULL,
        action TEXT NOT NULL CHECK(action IN ('stake','withdraw')),
        amount_eth TEXT NOT NULL,
        timestamp BIGINT NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('pending','confirmed','failed'))
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_transactions_account_time
      ON transactions (lower(account), timestamp DESC);
    `);

    console.log("Schema ready: transactions table + index");
  } finally {
    await client.end();
  }
}

async function main() {
  loadEnvFromDotenvIfNeeded();
  const args = parseArgs(process.argv.slice(2));
  const connectionString = args.url || process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is missing. Set it in .env or pass --url.");
  }

  const targetUrl = new URL(connectionString);
  await ensureDatabaseExists(targetUrl);
  await ensureSchema(connectionString);
  console.log("PostgreSQL initialization complete.");
}

if (process.argv.includes("--help") || process.argv.includes("-h")) {
  printUsage();
} else {
  main().catch((error) => {
    console.error("db:init failed:", error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
