import { NextRequest, NextResponse } from "next/server";
import { listTransactions, updateTransactionStatus, upsertTransaction } from "@/lib/server/postgres";
import type { DbTransaction } from "@/lib/server/postgres";

function isValidAction(v: unknown): v is DbTransaction["action"] {
  return v === "stake" || v === "withdraw";
}

function isValidStatus(v: unknown): v is DbTransaction["status"] {
  return v === "pending" || v === "confirmed" || v === "failed";
}

export async function GET(request: NextRequest) {
  const account = request.nextUrl.searchParams.get("account") ?? undefined;
  const items = await listTransactions(account);
  return NextResponse.json({ items });
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as Partial<DbTransaction>;
  if (
    !body.hash ||
    !body.account ||
    !body.amountEth ||
    !body.timestamp ||
    !isValidAction(body.action) ||
    !isValidStatus(body.status)
  ) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  await upsertTransaction({
    hash: body.hash,
    account: body.account,
    action: body.action,
    amountEth: body.amountEth,
    timestamp: body.timestamp,
    status: body.status,
  });

  return NextResponse.json({ ok: true });
}

export async function PATCH(request: NextRequest) {
  const body = (await request.json()) as { hash?: string; status?: DbTransaction["status"] };
  if (!body.hash || !isValidStatus(body.status)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  await updateTransactionStatus(body.hash, body.status);
  return NextResponse.json({ ok: true });
}
