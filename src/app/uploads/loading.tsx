export default function UploadsLoading() {
  return (
    <div className="space-y-6">
      {/* Heading skeleton */}
      <div className="space-y-2">
        <div className="h-4 w-20 animate-pulse rounded-lg bg-white/60" />
        <div className="h-10 w-60 animate-pulse rounded-lg bg-white/70" />
        <div className="h-4 w-80 animate-pulse rounded-lg bg-white/50" />
      </div>
      {/* Status summary row */}
      <div className="grid gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-20 animate-pulse rounded-2xl border border-line bg-white/75" />
        ))}
      </div>
      {/* Upload card skeleton */}
      <div className="h-[300px] animate-pulse rounded-[22px] border border-line bg-white/80" />
      {/* Video list skeleton */}
      <div className="h-[260px] animate-pulse rounded-[22px] border border-line bg-white/75" />
    </div>
  );
}
