export default function DashboardLoading() {
  return (
    <div className="space-y-4">
      <div className="h-28 animate-pulse rounded-[22px] border border-line bg-white/80" />
      <div className="h-40 animate-pulse rounded-[22px] border border-line bg-white/75" />
      <div className="grid gap-4 lg:grid-cols-[1.4fr_0.6fr]">
        <div className="h-[360px] animate-pulse rounded-[22px] border border-line bg-white/75" />
        <div className="h-[360px] animate-pulse rounded-[22px] border border-line bg-white/75" />
      </div>
    </div>
  );
}
