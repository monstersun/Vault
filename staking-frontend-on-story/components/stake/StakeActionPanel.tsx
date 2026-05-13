"use client";
import { useState } from "react";
import { useWalletAccount } from "@/lib/context/WalletAccountContext";

type StakeActionPanelProps = {
  onSubmit: (isStake: boolean, amount: string) => void;
};

export default function StakeActionPanel({ onSubmit }: StakeActionPanelProps) {
  const [isStake, setIsStake] = useState(true);
  const [amount, setAmount] = useState("0.1");
  const { account } = useWalletAccount();
  return (
    <section className="rounded-2xl border border-slate-700/70 bg-slate-900/70 p-6 shadow-xl">
      <h1 className="mb-2 text-2xl font-semibold">Vault Operations</h1>
      <p className="mb-8 text-sm text-slate-300">
        Temporary unlocked mode for component debugging.
      </p>

      <div className="mb-5 flex gap-3">
        <button
          onClick={() => setIsStake(true)}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
            isStake
              ? "bg-emerald-400 text-slate-900"
              : "bg-slate-800 text-slate-200 hover:bg-slate-700"
          }`}
        >
          Stake
        </button>
        <button
          onClick={() => setIsStake(false)}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
            !isStake
              ? "bg-amber-400 text-slate-900"
              : "bg-slate-800 text-slate-200 hover:bg-slate-700"
          }`}
        >
          Withdraw
        </button>
      </div>

      <div className="space-y-4 rounded-xl bg-slate-950/50 p-4">
        <h2 className="text-lg font-semibold">
          {isStake ? "Stake ETH" : "Withdraw ETH"}
        </h2>
        <label className="block text-sm">
          Amount (ETH)
          <input
            value={amount}
            onChange={(e) => {
              const next = e.target.value;
              if (/^\d*\.?\d*$/.test(next)) {
                setAmount(next);
              }
            }}
            inputMode="decimal"
            className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-950 px-4 py-3 outline-none ring-cyan-400 focus:ring-2"
          />
        </label>
        <button
          onClick={() => onSubmit(isStake, amount)}
          className={`w-full rounded-xl px-4 py-3 font-semibold text-slate-900 transition disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400 disabled:opacity-70 ${
            isStake
              ? "bg-emerald-400 hover:bg-emerald-300"
              : "bg-amber-400 hover:bg-amber-300"
          }`}
        disabled={!account || !amount || Number(amount) <= 0}
        >
          {isStake ? "Stake Now" : "Withdraw Now"}
        </button>
      </div>
    </section>
  );
}
