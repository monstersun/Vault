"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { requestDiscoveredWallets } from "../lib/wallet";
import {
  EIP6963_ANNOUNCE_EVENT,
  type Eip6963AnnounceDetail,
  type WalletOption,
} from "../lib/definition";
import { useWalletAccount } from "@/lib/context/WalletAccountContext";

export function WalletConnectButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [walletOptions, setWalletOptions] = useState<WalletOption[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [brokenIconIds, setBrokenIconIds] = useState<string[]>([]);
  const rootRef = useRef<HTMLDivElement>(null);
  const { account, setAccount, setProvider } = useWalletAccount();

  const buttonText = useMemo(() => {
    if (isConnecting) return "Connecting...";
    if (!account) return "Connect Wallet";
    return `Welcome, ${account.slice(0, 6)}...${account.slice(-4)}`;
  }, [account, isConnecting]);

  useEffect(() => {
    function handleEip6963Announce(event: Event) {
      const announceEvent = event as CustomEvent<Eip6963AnnounceDetail>;
      const detail = announceEvent.detail;
      if (!detail?.info || !detail?.provider) return;
      const walletOption = {
        id: detail.info.uuid,
        name: detail.info.name,
        icon: detail.info.icon,
        rdns: detail.info.rdns,
        provider: detail.provider,
        source: "eip6963",
      } as WalletOption;

      setWalletOptions((wallets) => {
        if (wallets.some((w) => w.id === walletOption.id)) {
          return wallets;
        }
        return [...wallets, walletOption];
      });
    }

    window.addEventListener(EIP6963_ANNOUNCE_EVENT, handleEip6963Announce as EventListener);

    requestDiscoveredWallets();
    return () => {
      window.removeEventListener(EIP6963_ANNOUNCE_EVENT, handleEip6963Announce as EventListener);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const onWindowClick = (event: MouseEvent) => {
      if (!rootRef.current) return;
      if (rootRef.current.contains(event.target as Node)) return;
      setIsOpen(false);
    };
    window.addEventListener("click", onWindowClick);
    return () => window.removeEventListener("click", onWindowClick);
  }, [isOpen]);

  const onConnectWallet = async (option: WalletOption) => {
    setIsConnecting(true);
    try {
      const accounts = (await option.provider.request?.({
        method: "eth_requestAccounts",
      })) as string[] | undefined;
      console.log("accounts", accounts);
      setAccount(accounts?.[0] ?? "");
      setProvider(option.provider);
      setIsOpen(false);
    } catch (error) {
      console.error("Wallet connect failed:", error);
      const code =
        typeof error === "object" && error !== null && "code" in error
          ? (error as { code?: number | string }).code
          : undefined;
      if (code === 4001 || code === "4001") {
        console.log("User rejected the request.");
        setAccount("");
        setProvider(null);
        setIsOpen(false);
      }
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div ref={rootRef} className="relative z-[1000] inline-block">
      <button
        onClick={() => setIsOpen((open) => !open)}
        disabled={isConnecting}
        className="rounded-lg bg-cyan-400 px-5 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-cyan-300 disabled:opacity-60"
      >
        {buttonText}
      </button>

      {isOpen && (
        // to-do: don't use the magic number z-[1100]
        <div className="absolute right-0 top-full z-[1100] mt-2 w-72 rounded-xl border border-slate-700 bg-slate-900 p-2 shadow-2xl">
          {walletOptions.length === 0 ? (
            <p className="rounded-lg px-3 py-2 text-sm text-slate-300">No wallet detected</p>
          ) : (
            walletOptions.map((option) => {
              const iconBroken = brokenIconIds.includes(option.id);
              return (
                <button
                  key={option.id}
                  onClick={() => void onConnectWallet(option)}
                  disabled={isConnecting}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-slate-100 transition hover:bg-slate-800 disabled:opacity-60"
                >
                  {option.icon && !iconBroken ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={option.icon}
                      alt={`${option.name} icon`}
                      className="h-6 w-6 rounded-full"
                      onError={() =>
                        setBrokenIconIds((ids) => (ids.includes(option.id) ? ids : [...ids, option.id]))
                      }
                    />
                  ) : (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-500/20 text-xs font-semibold text-cyan-300">
                      {option.name.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  <span>{option.name}</span>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
