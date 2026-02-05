import { Card } from "@/components/ui/card";
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
    <Card className="space-y-4 bg-white p-5 sm:p-6">
      <p className="text-xs uppercase tracking-[0.15em] text-foreground/50">Progression mensuelle</p>
      <p className="font-display text-4xl uppercase leading-none">
        {deliveredTotal}/{quotaTotal}
      </p>
      <ProgressBar percent={completionPercent} label="Completion" />
      <div className="grid gap-2 text-sm text-foreground/75 sm:grid-cols-2">
        <p>Remuneration estimee: {estimatedPayoutLabel}</p>
        <p>Deadline: {deadlineLabel}</p>
      </div>
      <p className="rounded-lg bg-sand px-3 py-2 text-sm">Reste: {remainingDetails}</p>
    </Card>
  );
}
