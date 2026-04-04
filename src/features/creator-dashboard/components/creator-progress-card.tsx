import { CardSection } from "@/components/layout/card-section";

interface CreatorProgressCardProps {
  deliveredTotal: number;
  estimatedPayoutLabel: string;
  pendingReviewCount: number;
}

export function CreatorProgressCard({
  deliveredTotal,
  estimatedPayoutLabel,
  pendingReviewCount
}: CreatorProgressCardProps) {
  return (
    <CardSection className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.15em] text-foreground/50">Tes videos ce mois</p>
          <p className="mt-3 font-display text-4xl uppercase leading-none text-secondary">
            {deliveredTotal}
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-line bg-frost/70 px-4 py-3">
          <p className="text-[11px] uppercase tracking-[0.12em] text-foreground/55">Tes gains estimes</p>
          <p className="mt-1 font-display text-2xl uppercase leading-none text-secondary">
            {estimatedPayoutLabel}
          </p>
          <p className="mt-2 text-xs text-foreground/60">Base sur tes videos deja validees.</p>
        </div>
        <div className="rounded-2xl border border-line bg-sand/70 px-4 py-3">
          <p className="text-[11px] uppercase tracking-[0.12em] text-foreground/55">En attente de validation</p>
          <p className="mt-1 font-display text-2xl uppercase leading-none text-foreground/80">
            {pendingReviewCount}
          </p>
          <p className="mt-2 text-xs text-foreground/60">
            Uploads soumis au staff RetroMuscle.
          </p>
        </div>
      </div>
    </CardSection>
  );
}
