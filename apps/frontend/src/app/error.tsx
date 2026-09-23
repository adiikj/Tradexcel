"use client";
import { useEffect } from "react";
import Link from "next/link";

// Route-level error boundary: a crash in one page shows this instead of a
// blank screen, and "Try again" re-renders the segment without a full reload.
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div role="alert" className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center font-pop">
      <h1 className="text-3xl font-bold text-red-500">Something went wrong</h1>
      <p className="text-gray-500 max-w-md">
        This page hit an unexpected error. Your portfolio and trades are safe - try again, or head back to the dashboard.
      </p>
      <div className="flex gap-3">
        <button onClick={reset} className="px-5 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors">
          Try again
        </button>
        <Link href="/dashboard" className="px-5 py-2 rounded-lg border border-blue-500 text-blue-500 hover:bg-blue-500/10 transition-colors">
          Dashboard
        </Link>
      </div>
    </div>
  );
}
