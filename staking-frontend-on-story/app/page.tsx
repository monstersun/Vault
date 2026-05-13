import Link from "next/link";
import { TypewriterText } from "@/components/TypewriterText";

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#05070f] text-slate-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,#22d3ee33_0%,transparent_35%),radial-gradient(circle_at_80%_20%,#a855f733_0%,transparent_30%),radial-gradient(circle_at_50%_85%,#3b82f633_0%,transparent_30%)]" />
      <div className="absolute -left-20 top-24 h-56 w-56 animate-pulse rounded-full bg-cyan-500/20 blur-3xl" />
      <div className="absolute -right-10 top-40 h-48 w-48 animate-pulse rounded-full bg-purple-500/20 blur-3xl [animation-delay:500ms]" />
      <div className="absolute bottom-10 left-1/2 h-60 w-60 -translate-x-1/2 animate-pulse rounded-full bg-blue-500/20 blur-3xl [animation-delay:900ms]" />

      <div className="relative z-10">
        <main className="mx-auto flex min-h-[80vh] w-full max-w-7xl flex-col items-center justify-center px-6 text-center">
          <h1 className="max-w-4xl text-5xl font-extrabold leading-tight tracking-tight sm:text-6xl">
            Universal Vault Realm
          </h1>
          <TypewriterText
            text="Enter the portal, connect MetaMask, and manage your vault position with real-time previews and on-chain actions."
            speedMs={42}
            className="mt-6 max-w-2xl text-base text-slate-300 sm:text-lg"
          />
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/stake"
              className="rounded-full bg-cyan-400 px-8 py-3 text-sm font-semibold text-slate-900 transition hover:bg-cyan-300"
            >
              Enter Stake
            </Link>
            <Link
              href="/info"
              className="rounded-full border border-white/20 bg-slate-900/50 px-8 py-3 text-sm font-semibold text-slate-100 transition hover:bg-slate-800"
            >
              Open Info Hall
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}
