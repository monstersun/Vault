"use client";

import { useState } from "react";
import { ethers } from "ethers";
import StakeActionPanel from "@/components/stake/StakeActionPanel";
import WalletSnapshotCard from "@/components/stake/WalletSnapshotCard";
import TransactionPreviewCard from "@/components/stake/TransactionPreviewCard";
import { useWalletAccount } from "@/lib/context/WalletAccountContext";
import {
  createTransactionAction,
  updateTransactionStatusAction,
} from "@/app/actions/transactions";

export default function StakeClient() {
  const [status, setStatus] = useState("Ready");
  const { account, provider } = useWalletAccount();

  const vaultAddress = process.env.NEXT_PUBLIC_VAULT_ADDRESS ?? "";
  const vaultAbi = [
    "function depositEth(address receiver) payable returns (uint256 shares)",
    "function withdrawEth(uint256 assets, address receiver) returns (uint256 shares)",
  ];

  const onSubmit = async (isStake: boolean, amount: string) => {
    if (!provider || !account) {
      setStatus("Please connect wallet first.");
      return;
    }
    if (!vaultAddress) {
      setStatus("Missing NEXT_PUBLIC_VAULT_ADDRESS.");
      return;
    }

    let txHash: string | undefined;
    try {
      const amountWei = ethers.parseEther(amount || "0");
      if (amountWei <= 0n) {
        setStatus("Please enter a valid amount.");
        return;
      }

      setStatus("Preparing transaction...");
      const browserProvider = new ethers.BrowserProvider(provider);
      const signer = await browserProvider.getSigner();
      const contract = new ethers.Contract(vaultAddress, vaultAbi, signer);

      const txRequest = isStake
        ? await contract.depositEth.populateTransaction(account, {
            value: amountWei,
          })
        : await contract.withdrawEth.populateTransaction(amountWei, account);
      txRequest.from = account;
      const estimatedGas = await browserProvider.estimateGas(txRequest);
      const gasPriceHex = (await browserProvider.send(
        "eth_gasPrice",
        [],
      )) as string;

      const legacyTx = {
        ...txRequest,
        type: 0,
        gasLimit: (estimatedGas * 120n) / 100n,
        gasPrice: BigInt(gasPriceHex),
      };
      setStatus("Open wallet and confirm the transaction...");
      const sentTx = await signer.sendTransaction(legacyTx);
      txHash = sentTx.hash;
      await createTransactionAction({
        hash: sentTx.hash,
        account,
        action: isStake ? "stake" : "withdraw",
        amountEth: amount,
        status: "pending",
        timestamp: Date.now(),
      });

      setStatus(`Pending: ${sentTx.hash}`);
      await sentTx.wait();
      await updateTransactionStatusAction(sentTx.hash, "confirmed");
      setStatus(`Confirmed: ${sentTx.hash}`);
    } catch (error) {
      console.error(error);
      if (txHash) {
        await updateTransactionStatusAction(txHash, "failed");
      }
      const message =
        typeof error === "object" &&
        error !== null &&
        "message" in error &&
        typeof (error as { message?: unknown }).message === "string"
          ? (error as { message: string }).message
          : "";
      if (
        message.includes("missing revert data") ||
        message.includes("CALL_EXCEPTION")
      ) {
        setStatus("Transaction execution failed. Check vault address and amount.");
        return;
      }
      setStatus("Transaction failed or cancelled.");
    }
  };

  return (
    <main className="mx-auto grid w-full max-w-7xl gap-6 px-6 pb-12 lg:grid-cols-[1.4fr_1fr]">
      <StakeActionPanel onSubmit={onSubmit} />

      <aside className="space-y-6">
        <WalletSnapshotCard />
        <TransactionPreviewCard status={status} vaultAddress={vaultAddress} />
      </aside>
    </main>
  );
}
