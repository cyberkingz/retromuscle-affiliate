import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/currency";
import type { RateSheetRow } from "@/application/use-cases/get-saas-landing-data";

interface RatesSectionProps {
  title: string;
  subtitle: string;
  rows: RateSheetRow[];
}

export function RatesSection({ title, subtitle, rows }: RatesSectionProps) {
  return (
    <section className="animate-fade-up space-y-6">
      <div className="space-y-3 text-center">
        <h2 className="font-display text-4xl uppercase tracking-tight text-secondary sm:text-5xl">{title}</h2>
        <p className="mx-auto max-w-3xl text-foreground/70">{subtitle}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {rows.map((row) => (
          <Card key={row.key} className="border-line bg-white">
            <CardContent className="space-y-2 p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-foreground/55">{row.label}</p>
              <p className="font-display text-3xl uppercase leading-none text-secondary">{formatCurrency(row.ratePerVideo)}</p>
              <p className="text-xs text-foreground/60">par video validee</p>
              {row.isPlaceholder ? <p className="text-[11px] text-amber-700">Tarif en cours d&apos;ajustement</p> : null}
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
