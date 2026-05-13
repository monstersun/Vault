"use client";

type TransactionPreviewCardProps = {
  status: string;
  vaultAddress: string;
};

export default function TransactionPreviewCard({
  status,
  vaultAddress,
}: TransactionPreviewCardProps) {
  return (
    <div className="rounded-2xl border border-slate-700/70 bg-slate-900/70 p-6 shadow-xl">
      <h2 className="mb-4 text-xl font-semibold">Transaction Preview</h2>
      <p className="text-sm text-slate-300">Shows current transaction execution status.</p>
      <div className="mt-5 rounded-xl bg-slate-950/60 p-4 text-sm text-slate-300">
        <p className="font-medium text-slate-100">Status</p>
        <p className="mt-1 wrap-break-word">{status}</p>
        <p className="mt-2 text-xs text-slate-400 break-all">
          Vault Address: {vaultAddress || "Missing NEXT_PUBLIC_VAULT_ADDRESS"}
        </p>
      </div>
    </div>
  );
}
