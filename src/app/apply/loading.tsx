export default function ApplyLoading() {
  return (
    <div className="mx-auto max-w-[1280px]">
      <div className="grid gap-8 lg:grid-cols-[1fr_400px] lg:items-stretch xl:grid-cols-[1fr_420px]">
        {/* Left: form skeleton */}
        <div className="space-y-4">
          <div className="h-[380px] animate-pulse rounded-[22px] border border-line bg-white/80" />
        </div>
        {/* Right: marketing column skeleton */}
        <div className="h-[380px] animate-pulse rounded-[22px] border border-line bg-white/75" />
      </div>
    </div>
  );
}
