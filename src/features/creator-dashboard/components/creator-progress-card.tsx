import { CardSection } from "@/components/layout/card-section";
import { ProgressBar } from "@/components/ui/progress-bar";

interface CreatorProgressCardProps {
  deliveredTotal: number;
  quotaTotal: number;
  completionPercent: number;
  remainingDetails: string;
  estimatedPayoutLabel: string;
  deadlineLabel: string;
}

export function CreatorProgressCard({
  deliveredTotal,
  quotaTotal,
  completionPercent,
  remainingDetails,
  estimatedPayoutLabel,
  deadlineLabel
}: CreatorProgressCardProps) {
  return (
    <CardSection className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.15em] text-foreground/50">Progression mensuelle</p>
          <p className="mt-3 font-display text-4xl uppercase leading-none text-secondary">
            {deliveredTotal}/{quotaTotal}
          </p>
        </div>
        <div className="rounded-2xl border border-line bg-frost/70 px-4 py-3 text-sm text-foreground/75">
          <p className="text-[11px] uppercase tracking-[0.12em] text-foreground/55">Deadline</p>
          <p className="mt-1 font-semibold">{deadlineLabel}</p>
        </div>
      </div>

      <ProgressBar percent={completionPercent} label="Completion" />

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-line bg-frost/70 px-4 py-3">
          <p className="text-[11px] uppercase tracking-[0.12em] text-foreground/55">Remuneration estimee</p>
          <p className="mt-1 font-display text-2xl uppercase leading-none text-secondary">
            {estimatedPayoutLabel}
          </p>
          <p className="mt-2 text-xs text-foreground/60">Estimation basee sur les livrables deja valides.</p>
        </div>
        <div className="rounded-2xl border border-line bg-sand/70 px-4 py-3">
          <p className="text-[11px] uppercase tracking-[0.12em] text-foreground/55">Reste a livrer</p>
          <p className="mt-1 text-sm text-foreground/80">{remainingDetails}</p>
          <p className="mt-2 text-xs text-foreground/60">
            Astuce: priorise les formats a plus forte remuneration si tu peux.
          </p>
        </div>
      </div>
    </CardSection>
  );
}
