export default function ContractLoading() {
  return (
    <div className="mx-auto max-w-[980px] space-y-6">
      {/* Heading skeleton */}
      <div className="space-y-2">
        <div className="h-4 w-24 animate-pulse rounded-lg bg-white/60" />
        <div className="h-10 w-72 animate-pulse rounded-lg bg-white/70" />
        <div className="h-4 w-80 animate-pulse rounded-lg bg-white/50" />
      </div>
      {/* Two-column: highlights + contract text */}
      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="h-[360px] animate-pulse rounded-[22px] border border-line bg-white/80" />
        <div className="h-[360px] animate-pulse rounded-[22px] border border-line bg-white/75" />
      </div>
      {/* Signature section */}
      <div className="h-[280px] animate-pulse rounded-[22px] border border-line bg-white/80" />
    </div>
  );
}
