import { Pool } from "pg";

export type DbTransaction = {
  hash: string;
  account: string;
  action: "stake" | "withdraw";
  amountEth: string;
  timestamp: number;
  status: "pending" | "confirmed" | "failed";
};

type DbGlobals = {
  txPool?: Pool;
  txSchemaReady?: Promise<void>;
};

const globalForDb = globalThis as unknown as DbGlobals;

function getPool(): Pool {
  if (globalForDb.txPool) {
    return globalForDb.txPool;
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is missing. Set PostgreSQL connection string in environment."
    );
  }

  const pool = new Pool({ connectionString });
  globalForDb.txPool = pool;
  return pool;
}

function ensureSchema(): Promise<void> {
  if (globalForDb.txSchemaReady) {
    return globalForDb.txSchemaReady;
  }

  const pool = getPool();
  globalForDb.txSchemaReady = pool
    .query(`
      CREATE TABLE IF NOT EXISTS transactions (
        hash TEXT PRIMARY KEY,
        account TEXT NOT NULL,
        action TEXT NOT NULL CHECK(action IN ('stake','withdraw')),
        amount_eth TEXT NOT NULL,
        timestamp BIGINT NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('pending','confirmed','failed'))
      );
    `)
    .then(() =>
      pool.query(`
        CREATE INDEX IF NOT EXISTS idx_transactions_account_time
        ON transactions (lower(account), timestamp DESC);
      `)
    )
    .then(() => undefined);

  return globalForDb.txSchemaReady;
}

export async function upsertTransaction(tx: DbTransaction): Promise<void> {
  await ensureSchema();
  const pool = getPool();
  await pool.query(
    `
      INSERT INTO transactions (hash, account, action, amount_eth, timestamp, status)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT(hash) DO UPDATE SET
        account = EXCLUDED.account,
        action = EXCLUDED.action,
        amount_eth = EXCLUDED.amount_eth,
        timestamp = EXCLUDED.timestamp,
        status = EXCLUDED.status;
    `,
    [tx.hash, tx.account, tx.action, tx.amountEth, tx.timestamp, tx.status]
  );
}

export async function updateTransactionStatus(
  hash: string,
  status: DbTransaction["status"]
): Promise<void> {
  await ensureSchema();
  const pool = getPool();
  await pool.query(
    `
      UPDATE transactions
      SET status = $2
      WHERE hash = $1
    `,
    [hash, status]
  );
}

export async function listTransactions(account?: string): Promise<DbTransaction[]> {
  await ensureSchema();
  const pool = getPool();

  if (account) {
    const { rows } = await pool.query<DbTransaction>(
      `
        SELECT hash, account, action, amount_eth as "amountEth", timestamp, status
        FROM transactions
        WHERE lower(account) = lower($1)
        ORDER BY timestamp DESC
        LIMIT 500
      `,
      [account]
    );
    return rows;
  }

  const { rows } = await pool.query<DbTransaction>(`
    SELECT hash, account, action, amount_eth as "amountEth", timestamp, status
    FROM transactions
    ORDER BY timestamp DESC
    LIMIT 500
  `);
  return rows;
}
