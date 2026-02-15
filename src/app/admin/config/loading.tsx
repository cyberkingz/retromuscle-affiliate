export default function AdminConfigLoading() {
  return (
    <div className="space-y-6">
      <div className="h-16 animate-pulse rounded-[22px] border border-line bg-white/80" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-40 animate-pulse rounded-[18px] border border-line bg-white/75" />
        ))}
      </div>
      <div className="h-[300px] animate-pulse rounded-[22px] border border-line bg-white/75" />
      <div className="h-[300px] animate-pulse rounded-[22px] border border-line bg-white/75" />
    </div>
  );
}
