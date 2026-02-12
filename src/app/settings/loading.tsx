export default function SettingsLoading() {
  return (
    <div className="space-y-6">
      {/* Heading skeleton */}
      <div className="space-y-2">
        <div className="h-4 w-28 animate-pulse rounded-lg bg-white/60" />
        <div className="h-10 w-64 animate-pulse rounded-lg bg-white/70" />
        <div className="h-4 w-80 animate-pulse rounded-lg bg-white/50" />
      </div>
      {/* Two-column: profile + payout settings */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="h-[260px] animate-pulse rounded-[22px] border border-line bg-white/80" />
        <div className="h-[400px] animate-pulse rounded-[22px] border border-line bg-white/75" />
      </div>
    </div>
  );
}
