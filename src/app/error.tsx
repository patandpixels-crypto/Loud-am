"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="logo-text gradient-text mb-2 text-5xl">Oops</h1>
      <h2 className="mb-2 text-xl font-bold text-heading">Something went wrong</h2>
      <p className="mb-8 max-w-md text-sm text-subtext">
        An unexpected error occurred. Please try again.
      </p>
      <button
        onClick={reset}
        className="rounded-xl bg-gradient-to-r from-accent to-accent-2 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-accent/20 transition-all hover:shadow-xl hover:shadow-accent/30"
      >
        Try Again
      </button>
    </div>
  );
}
