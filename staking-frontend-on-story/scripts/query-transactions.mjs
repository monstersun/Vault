#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { JsonRpcProvider } from "ethers";
import pg from "pg";

function parseArgs(argv) {
  const args = { limit: 20 };
  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i];
    const value = argv[i + 1];
    if (key === "--hash" && value) {
      args.hash = value;
      i += 1;
      continue;
    }
    if (key === "--account" && value) {
      args.account = value.toLowerCase();
      i += 1;
      continue;
    }
    if (key === "--rpc" && value) {
      args.rpc = value;
      i += 1;
      continue;
    }
    if (key === "--limit" && value) {
      const parsed = Number(value);
      if (Number.isFinite(parsed) && parsed > 0) {
        args.limit = Math.floor(parsed);
      }
      i += 1;
    }
  }
  return args;
}

function printUsage() {
  console.log("Usage:");
  console.log("  npm run tx:query -- [--hash <txHash>] [--account <0x...>] [--limit <n>] [--rpc <url>]");
  console.log("");
  console.log("Examples:");
  console.log("  npm run tx:query -- --account 0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266");
  console.log("  npm run tx:query -- --hash 0xabc123...");
  console.log("  npm run tx:query -- --limit 50 --rpc http://127.0.0.1:8545");
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

async function main() {
  loadEnvFromDotenvIfNeeded();
  const args = parseArgs(process.argv.slice(2));
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL is missing.");
    process.exit(1);
  }

  const { Client } = pg;
  const client = new Client({ connectionString });
  await client.connect();

  let rows = [];
  try {
    if (args.hash) {
      const { rows: selected } = await client.query(
        `
          SELECT hash, account, action, amount_eth as "amountEth", timestamp, status
          FROM transactions
          WHERE lower(hash) = lower($1)
          LIMIT 1
        `,
        [args.hash]
      );
      rows = selected;
    } else if (args.account) {
      const { rows: selected } = await client.query(
        `
          SELECT hash, account, action, amount_eth as "amountEth", timestamp, status
          FROM transactions
          WHERE lower(account) = lower($1)
          ORDER BY timestamp DESC
          LIMIT $2
        `,
        [args.account, args.limit]
      );
      rows = selected;
    } else {
      const { rows: selected } = await client.query(
        `
          SELECT hash, account, action, amount_eth as "amountEth", timestamp, status
          FROM transactions
          ORDER BY timestamp DESC
          LIMIT $1
        `,
        [args.limit]
      );
      rows = selected;
    }
  } finally {
    await client.end();
  }

  if (!rows.length) {
    console.log("No transactions found.");
    return;
  }

  const rpcUrl = args.rpc || process.env.RPC_URL || "http://127.0.0.1:8545";
  const provider = new JsonRpcProvider(rpcUrl);

  console.log(`RPC: ${rpcUrl}`);
  console.log(`Found ${rows.length} transaction(s)\n`);

  for (const tx of rows) {
    let chainStatus = "unknown";
    let blockNumber = "-";
    try {
      const receipt = await provider.getTransactionReceipt(tx.hash);
      if (!receipt) {
        chainStatus = "pending";
      } else {
        chainStatus = receipt.status === 1 ? "confirmed" : "failed";
        blockNumber = String(receipt.blockNumber);
      }
    } catch {
      chainStatus = "rpc-error";
    }

    const tsNum =
      typeof tx.timestamp === "number"
        ? tx.timestamp
        : Number.parseInt(String(tx.timestamp ?? ""), 10);
    const time = Number.isFinite(tsNum) ? new Date(tsNum).toISOString() : "invalid-timestamp";
    console.log(`hash       : ${tx.hash}`);
    console.log(`account    : ${tx.account}`);
    console.log(`action     : ${tx.action}`);
    console.log(`amountEth  : ${tx.amountEth}`);
    console.log(`dbStatus   : ${tx.status}`);
    console.log(`chainStatus: ${chainStatus}`);
    console.log(`block      : ${blockNumber}`);
    console.log(`time       : ${time}`);
    console.log("-".repeat(72));
  }
}

if (process.argv.includes("--help") || process.argv.includes("-h")) {
  printUsage();
} else {
  main().catch((error) => {
    console.error("Query failed:", error instanceof Error ? error.message : error);
    process.exit(1);
  });
}

