"use client";

import { useCallback, useEffect, useState } from "react";
import { ethers } from "ethers";
import { useWalletAccount } from "@/lib/context/WalletAccountContext";

const vaultAbi = [
  "function balanceOf(address owner) view returns (uint256)",
  "function totalAssets() view returns (uint256)",
  "function convertToAssets(uint256 shares) view returns (uint256)",
];

export default function WalletSnapshotCard() {
  const { account, provider } = useWalletAccount();
  const [sharesText, setSharesText] = useState("0.000000");
  const [myAssetsText, setMyAssetsText] = useState("0.000000");
  const [totalAssetsText, setTotalAssetsText] = useState("0.000000");

  const vaultAddress = process.env.NEXT_PUBLIC_VAULT_ADDRESS ?? "";

  const loadSnapshot = useCallback(async () => {
    if (!provider || !vaultAddress) {
      setSharesText("0.000000");
      setMyAssetsText("0.000000");
      setTotalAssetsText("0.000000");
      return;
    }

    try {
      const browserProvider = new ethers.BrowserProvider(provider);
      const contract = new ethers.Contract(vaultAddress, vaultAbi, browserProvider);
      const sharesRaw = account ? await contract.balanceOf(account) : 0n;
      const [myAssetsRaw, totalAssetsRaw] = await Promise.all([
        contract.convertToAssets(sharesRaw),
        contract.totalAssets(),
      ]);
      setSharesText(Number(ethers.formatUnits(sharesRaw, 18)).toFixed(6));
      setMyAssetsText(Number(ethers.formatUnits(myAssetsRaw, 18)).toFixed(6));
      setTotalAssetsText(Number(ethers.formatUnits(totalAssetsRaw, 18)).toFixed(6));
    } catch {
      setSharesText("0.000000");
      setMyAssetsText("0.000000");
      setTotalAssetsText("0.000000");
    }
  }, [account, provider, vaultAddress]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      void loadSnapshot();
    }, 0);
    const intervalId = window.setInterval(() => {
      void loadSnapshot();
    }, 10000);

    return () => {
      window.clearTimeout(id);
      window.clearInterval(intervalId);
    };
  }, [loadSnapshot]);

  return (
    <div className="rounded-2xl border border-slate-700/70 bg-slate-900/70 p-6 shadow-xl">
      <h2 className="mb-4 text-xl font-semibold">Wallet Snapshot</h2>
      <div className="space-y-3 text-sm">
        <p className="text-slate-300">Connected Account</p>
        <p className="break-all">{account || "Not connected"}</p>
        <p className="text-slate-300">Your Vault Shares</p>
        <p>{sharesText}</p>
        <p className="text-slate-300">My Assets (WETH)</p>
        <p>{myAssetsText}</p>
        <p className="text-slate-300">Vault Total Assets (WETH)</p>
        <p>{totalAssetsText}</p>
      </div>
    </div>
  );
}
