import { CardSection } from "@/components/layout/card-section";
import { ProgressBar } from "@/components/ui/progress-bar";

interface QuotasGridProps {
  items: Array<{
    key: string;
    label: string;
    required: number;
    delivered: number;
    remaining: number;
    completionPercent: number;
  }>;
}

export function QuotasGrid({ items }: QuotasGridProps) {
  return (
    <section className="space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-foreground/60">Quotas par type</h2>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <CardSection key={item.key} padding="sm" className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <p className="font-semibold">{item.label}</p>
              <p className="text-xs text-foreground/60">
                {item.delivered}/{item.required}
              </p>
            </div>
            <ProgressBar percent={item.completionPercent} />
            <p className="text-xs uppercase tracking-[0.12em] text-foreground/55">Reste: {item.remaining}</p>
          </CardSection>
        ))}
      </div>
    </section>
  );
}
