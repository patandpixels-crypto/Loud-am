export default function ProfileLoading() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Profile header skeleton */}
      <div className="mb-6 rounded-2xl border border-card-border bg-card-bg p-6">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 animate-pulse rounded-full bg-card-border" />
          <div className="flex-1">
            <div className="mb-2 h-6 w-40 animate-pulse rounded bg-card-border" />
            <div className="h-4 w-24 animate-pulse rounded bg-card-border" />
          </div>
        </div>
      </div>

      {/* Stats skeleton */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-card-border bg-card-bg p-4 text-center">
            <div className="mx-auto mb-2 h-6 w-12 animate-pulse rounded bg-card-border" />
            <div className="mx-auto h-3 w-16 animate-pulse rounded bg-card-border" />
          </div>
        ))}
      </div>

      {/* Content skeleton */}
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-2xl border border-card-border bg-card-bg" />
        ))}
      </div>
    </div>
  );
}
