function PulseLine({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-lg bg-white/70 ${className}`} />;
}

function SkeletonCard({ children, className = "" }: { children?: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-[22px] border border-line bg-white/80 p-5 sm:p-6 ${className}`}>
      {children}
    </div>
  );
}

export default function DashboardLoading() {
  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-6 px-4 py-6 sm:px-8 sm:py-10" aria-hidden="true">
      <SkeletonCard>
        <div className="grid gap-4 sm:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-3">
            <PulseLine className="h-3 w-28" />
            <PulseLine className="h-12 w-52" />
            <PulseLine className="h-4 w-40" />
            <PulseLine className="h-6 w-20 rounded-full" />
          </div>
          <div className="space-y-3 rounded-xl border border-line bg-frost/60 p-4">
            <PulseLine className="h-3 w-24" />
            <PulseLine className="h-4 w-56" />
          </div>
        </div>
      </SkeletonCard>

      <SkeletonCard>
        <div className="space-y-4">
          <div className="space-y-2">
            <PulseLine className="h-3 w-36" />
            <PulseLine className="h-10 w-16" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-line bg-frost/60 p-4">
              <PulseLine className="h-3 w-24" />
              <PulseLine className="mt-2 h-8 w-24" />
              <PulseLine className="mt-3 h-3 w-40" />
            </div>
            <div className="rounded-2xl border border-line bg-sand/60 p-4">
              <PulseLine className="h-3 w-32" />
              <PulseLine className="mt-2 h-8 w-14" />
              <PulseLine className="mt-3 h-3 w-36" />
            </div>
          </div>
        </div>
      </SkeletonCard>

      <SkeletonCard>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-2">
            <PulseLine className="h-3 w-32" />
            <PulseLine className="h-4 w-64" />
          </div>
          <PulseLine className="h-10 w-40 rounded-full" />
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {[0, 1, 2].map((index) => (
            <div key={index} className="rounded-2xl border border-line bg-frost/60 p-4">
              <PulseLine className="h-3 w-20" />
              <PulseLine className="mt-2 h-8 w-14" />
            </div>
          ))}
        </div>
      </SkeletonCard>

      {[0, 1].map((index) => (
        <SkeletonCard key={index}>
          <div className="space-y-4">
            <PulseLine className="h-3 w-40" />
            <div className="space-y-2">
              <PulseLine className="h-12 w-full" />
              <PulseLine className="h-12 w-full" />
              <PulseLine className="h-12 w-full" />
            </div>
          </div>
        </SkeletonCard>
      ))}
    </div>
  );
}
