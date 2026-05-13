"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useWalletAccount } from "@/lib/context/WalletAccountContext";

type TransactionItem = {
  hash: string;
  account: string;
  action: "stake" | "withdraw";
  amountEth: string;
  timestamp: number | string;
  status: "pending" | "confirmed" | "failed";
};

function formatTimestamp(value: number | string) {
  const ms = typeof value === "number" ? value : Number.parseInt(value, 10);
  if (!Number.isFinite(ms)) {
    return "-";
  }
  return new Date(ms).toLocaleString();
}

export default function InfoClient() {
  const { account } = useWalletAccount();
  const [items, setItems] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const queryString = useMemo(() => {
    if (!account) return "";
    return `?account=${encodeURIComponent(account)}`;
  }, [account]);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/transactions${queryString}`, {
        method: "GET",
        cache: "no-store",
      });
      if (!res.ok) {
        throw new Error(`Request failed: ${res.status}`);
      }
      const data = (await res.json()) as { items?: TransactionItem[] };
      setItems(Array.isArray(data.items) ? data.items : []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load transactions.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [queryString]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      void fetchTransactions();
    }, 0);
    return () => window.clearTimeout(id);
  }, [fetchTransactions]);

  return (
    <main className="mx-auto w-full max-w-7xl px-6 pb-12">
      <section className="mb-6 rounded-2xl border border-slate-700/70 bg-slate-900/70 p-6 shadow-xl backdrop-blur">
        <h1 className="text-3xl font-semibold">Info Hall</h1>
        <p className="mt-2 text-sm text-slate-300">
          Browse transaction history from PostgreSQL.{" "}
          {account
            ? "Currently filtered by your connected wallet."
            : "Connect wallet to filter by your account, or view all records now."}
        </p>
        <button
          onClick={() => void fetchTransactions()}
          disabled={loading}
          className="mt-4 rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </section>

      {error ? (
        <section className="mb-6 rounded-2xl border border-rose-700/60 bg-rose-900/20 p-4 text-sm text-rose-200">
          Failed to load transactions: {error}
        </section>
      ) : null}

      <section className="overflow-hidden rounded-2xl border border-slate-700/70 bg-slate-900/70 shadow-xl">
        <div className="border-b border-slate-700/70 px-4 py-3 text-sm text-slate-300">
          {loading ? "Loading..." : `Total: ${items.length}`}
        </div>
        {items.length === 0 && !loading ? (
          <div className="px-4 py-8 text-center text-sm text-slate-400">No transactions found.</div>
        ) : (
          <div className="max-h-[60vh] overflow-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-950/50 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-4 py-3">Tx Hash</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Amount (ETH)</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Account</th>
                  <th className="px-4 py-3">Time</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.hash} className="border-t border-slate-800/70">
                    <td className="px-4 py-3">
                      <span className="inline-block max-w-[220px] truncate align-bottom">
                        {item.hash}
                      </span>
                    </td>
                    <td className="px-4 py-3 capitalize">{item.action}</td>
                    <td className="px-4 py-3">{item.amountEth}</td>
                    <td className="px-4 py-3 capitalize">{item.status}</td>
                    <td className="px-4 py-3">
                      <span className="inline-block max-w-[220px] truncate align-bottom">
                        {item.account}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-300">{formatTimestamp(item.timestamp)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
