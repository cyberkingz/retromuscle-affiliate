export default function AdminApplicationsLoading() {
  return (
    <div className="space-y-6">
      {/* Heading skeleton */}
      <div className="space-y-2">
        <div className="h-4 w-16 animate-pulse rounded-lg bg-white/60" />
        <div className="h-10 w-64 animate-pulse rounded-lg bg-white/70" />
        <div className="h-4 w-80 animate-pulse rounded-lg bg-white/50" />
      </div>
      {/* Filter buttons */}
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-9 w-28 animate-pulse rounded-full border border-line bg-white/70" />
        ))}
      </div>
      {/* Search bar */}
      <div className="h-10 w-full animate-pulse rounded-xl border border-line bg-white/70 sm:w-[320px]" />
      {/* Two-column: table + detail panel */}
      <div className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="h-[420px] animate-pulse rounded-[22px] border border-line bg-white/80" />
        <div className="h-[420px] animate-pulse rounded-[22px] border border-line bg-white/75" />
      </div>
    </div>
  );
}
