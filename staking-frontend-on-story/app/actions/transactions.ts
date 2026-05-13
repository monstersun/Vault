"use server";

import { listTransactions, updateTransactionStatus, upsertTransaction } from "@/lib/server/postgres";
import type { DbTransaction } from "@/lib/server/postgres";

type CreateTxInput = {
  hash: string;
  account: string;
  action: "stake" | "withdraw";
  amountEth: string;
  status: "pending" | "confirmed" | "failed";
  timestamp: number;
};

export async function createTransactionAction(input: CreateTxInput): Promise<void> {
  await upsertTransaction({
    hash: input.hash,
    account: input.account,
    action: input.action,
    amountEth: input.amountEth,
    timestamp: input.timestamp,
    status: input.status,
  });
}

export async function updateTransactionStatusAction(
  hash: string,
  status: DbTransaction["status"]
): Promise<void> {
  await updateTransactionStatus(hash, status);
}

export async function listTransactionsAction(account?: string): Promise<DbTransaction[]> {
  return await listTransactions(account);
}
