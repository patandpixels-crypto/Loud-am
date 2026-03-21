export default function FeedLoading() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Header skeleton */}
      <div className="mb-6 flex items-center justify-between">
        <div className="h-8 w-32 animate-pulse rounded-lg bg-card-border" />
        <div className="h-10 w-28 animate-pulse rounded-xl bg-card-border" />
      </div>

      {/* Tab bar skeleton */}
      <div className="mb-6 flex gap-2">
        <div className="h-9 w-20 animate-pulse rounded-lg bg-card-border" />
        <div className="h-9 w-24 animate-pulse rounded-lg bg-card-border" />
        <div className="h-9 w-20 animate-pulse rounded-lg bg-card-border" />
      </div>

      {/* Post card skeletons */}
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-card-border bg-card-bg p-5">
            <div className="mb-3 flex items-center gap-2">
              <div className="h-8 w-8 animate-pulse rounded-full bg-card-border" />
              <div className="h-4 w-24 animate-pulse rounded bg-card-border" />
              <div className="h-3 w-12 animate-pulse rounded bg-card-border" />
            </div>
            <div className="mb-2 h-5 w-3/4 animate-pulse rounded bg-card-border" />
            <div className="mb-1 h-4 w-full animate-pulse rounded bg-card-border" />
            <div className="mb-4 h-4 w-2/3 animate-pulse rounded bg-card-border" />
            <div className="flex gap-4">
              <div className="h-8 w-16 animate-pulse rounded-lg bg-card-border" />
              <div className="h-8 w-16 animate-pulse rounded-lg bg-card-border" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
