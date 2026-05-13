"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { MetaMaskProvider } from "@/lib/definition";

type WalletAccountContextValue = {
  account: string;
  setAccount: (value: string) => void;
  provider: MetaMaskProvider | null;
  setProvider: (value: MetaMaskProvider | null) => void;
};

const WalletAccountContext = createContext<WalletAccountContextValue | undefined>(undefined);

export function WalletAccountProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState("");
  const [provider, setProvider] = useState<MetaMaskProvider | null>(null);
  const value = useMemo(
    () => ({ account, setAccount, provider, setProvider }),
    [account, provider]
  );
  return <WalletAccountContext.Provider value={value}>{children}</WalletAccountContext.Provider>;
}

export function useWalletAccount() {
  const ctx = useContext(WalletAccountContext);
  if (!ctx) {
    throw new Error("useWalletAccount must be used inside WalletAccountProvider");
  }
  return ctx;
}
