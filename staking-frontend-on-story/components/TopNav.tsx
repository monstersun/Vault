"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { WalletConnectButton } from "@/components/WalletConnectButton";

export function TopNav() {
  const currentPath = usePathname();
  const links = [
    { href: "/", label: "Home" },
    { href: "/stake", label: "Stake" },
    { href: "/info", label: "Info" },
  ] as const;

  return (
    <header className="sticky top-0 z-[900] w-full border-b border-white/10 bg-black">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-6 py-4">
        <div className="hidden min-w-[180px] text-lg font-semibold tracking-wide text-slate-100 sm:block">
          Vault Portal
        </div>

        <nav className="flex flex-1 items-center justify-center gap-2">
          {links.map((item) => {
            const isActive = currentPath === item.href;
            return (
              <Link
                key={item.href}
                className={`min-w-[96px] rounded-lg px-5 py-2.5 text-center text-sm font-semibold transition ${
                  isActive
                    ? "bg-cyan-400 text-slate-900"
                    : "text-slate-100 hover:bg-white/10"
                }`}
                href={item.href}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="min-w-[220px] text-right">
          <WalletConnectButton />
        </div>
      </div>
    </header>
  );
}
