import type { Metadata } from "next";
import "./globals.css";
import { TopNav } from "@/components/TopNav";
import { WalletAccountProvider } from "@/lib/context/WalletAccountContext";

export const metadata: Metadata = {
  title: "Universal Vault Portal",
  description: "MetaMask powered frontend for multi-chain vault operations",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <WalletAccountProvider>
          <TopNav />
          {children}
        </WalletAccountProvider>
      </body>
    </html>
  );
}
