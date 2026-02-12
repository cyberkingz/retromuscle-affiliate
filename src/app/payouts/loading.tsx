export default function PayoutsLoading() {
  return (
    <div className="space-y-6">
      {/* Heading skeleton */}
      <div className="space-y-2">
        <div className="h-4 w-24 animate-pulse rounded-lg bg-white/60" />
        <div className="h-10 w-56 animate-pulse rounded-lg bg-white/70" />
        <div className="h-4 w-72 animate-pulse rounded-lg bg-white/50" />
      </div>
      {/* Current month payout */}
      <div className="h-[160px] animate-pulse rounded-[22px] border border-line bg-white/80" />
      {/* Stats row */}
      <div className="grid gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-20 animate-pulse rounded-2xl border border-line bg-white/75" />
        ))}
      </div>
      {/* Breakdown table */}
      <div className="h-[240px] animate-pulse rounded-[22px] border border-line bg-white/75" />
      {/* History table */}
      <div className="h-[240px] animate-pulse rounded-[22px] border border-line bg-white/75" />
    </div>
  );
}
