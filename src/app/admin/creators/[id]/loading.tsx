export default function AdminCreatorDetailLoading() {
  return (
    <div className="space-y-6">
      {/* Heading skeleton */}
      <div className="space-y-2">
        <div className="h-4 w-16 animate-pulse rounded-lg bg-white/60" />
        <div className="h-10 w-56 animate-pulse rounded-lg bg-white/70" />
        <div className="h-4 w-72 animate-pulse rounded-lg bg-white/50" />
      </div>
      {/* Profile + contract row */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="h-[260px] animate-pulse rounded-[22px] border border-line bg-white/80 lg:col-span-2" />
        <div className="h-[260px] animate-pulse rounded-[22px] border border-line bg-white/75" />
      </div>
      {/* Payout + contract history */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="h-[280px] animate-pulse rounded-[22px] border border-line bg-white/80" />
        <div className="h-[280px] animate-pulse rounded-[22px] border border-line bg-white/75" />
      </div>
      {/* Trackings table */}
      <div className="h-[320px] animate-pulse rounded-[22px] border border-line bg-white/75" />
      {/* Videos + rushes row */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="h-[280px] animate-pulse rounded-[22px] border border-line bg-white/80" />
        <div className="h-[280px] animate-pulse rounded-[22px] border border-line bg-white/75" />
      </div>
    </div>
  );
}
