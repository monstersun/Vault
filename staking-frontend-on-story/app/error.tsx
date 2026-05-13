"use client";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-16 text-slate-100">
      <div className="rounded-2xl border border-rose-700/50 bg-rose-950/30 p-6">
        <h1 className="text-2xl font-semibold">Something went wrong</h1>
        <p className="mt-3 text-sm text-slate-300">
          {error.message || "Unknown error"}
        </p>
        <button
          onClick={reset}
          className="mt-5 rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-cyan-300"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
