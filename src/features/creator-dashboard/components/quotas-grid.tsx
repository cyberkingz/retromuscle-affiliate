import { CardSection } from "@/components/layout/card-section";

interface QuotasGridProps {
  items: Array<{
    key: string;
    label: string;
    delivered: number;
  }>;
}

export function QuotasGrid({ items }: QuotasGridProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <CardSection key={item.key} padding="sm" className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <p className="font-semibold">{item.label}</p>
              <p className="font-display text-2xl uppercase leading-none text-secondary">
                {item.delivered}
              </p>
            </div>
            <p className="text-xs uppercase tracking-[0.12em] text-foreground/70">
              {item.delivered === 0
                ? "Aucune video livree"
                : `${item.delivered} video${item.delivered > 1 ? "s" : ""} livree${item.delivered > 1 ? "s" : ""}`}
            </p>
          </CardSection>
        ))}
      </div>
    </div>
  );
}
