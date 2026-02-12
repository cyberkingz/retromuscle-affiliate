export default function AdminLoading() {
  return (
    <div className="space-y-4">
      <div className="h-24 animate-pulse rounded-[22px] border border-line bg-white/80" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="h-24 animate-pulse rounded-[18px] border border-line bg-white/75" />
        ))}
      </div>
      <div className="h-[420px] animate-pulse rounded-[22px] border border-line bg-white/75" />
    </div>
  );
}
