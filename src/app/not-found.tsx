import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="logo-text gradient-text mb-2 text-7xl">404</h1>
      <h2 className="mb-2 text-xl font-bold text-heading">Page not found</h2>
      <p className="mb-8 max-w-md text-sm text-subtext">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <div className="flex gap-3">
        <Link
          href="/"
          className="rounded-xl bg-gradient-to-r from-accent to-accent-2 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-accent/20 transition-all hover:shadow-xl hover:shadow-accent/30"
        >
          Go Home
        </Link>
        <Link
          href="/feed"
          className="rounded-xl border border-card-border bg-card-bg px-6 py-3 text-sm font-bold text-heading transition-colors hover:border-accent/30"
        >
          Browse Feed
        </Link>
      </div>
    </div>
  );
}
