export default function SectionsLoading() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-card-border" />
        <div className="h-10 w-36 animate-pulse rounded-xl bg-card-border" />
      </div>

      <div className="mb-6 h-11 w-full animate-pulse rounded-xl bg-card-border" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-card-border bg-card-bg p-5">
            <div className="mb-4 flex items-start gap-3">
              <div className="h-12 w-12 animate-pulse rounded-xl bg-card-border" />
              <div className="flex-1">
                <div className="mb-2 h-5 w-2/3 animate-pulse rounded bg-card-border" />
                <div className="h-3 w-16 animate-pulse rounded bg-card-border" />
              </div>
            </div>
            <div className="mb-2 h-4 w-full animate-pulse rounded bg-card-border" />
            <div className="mb-4 h-4 w-3/4 animate-pulse rounded bg-card-border" />
            <div className="flex gap-3">
              <div className="h-6 w-16 animate-pulse rounded-lg bg-card-border" />
              <div className="h-6 w-16 animate-pulse rounded-lg bg-card-border" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
