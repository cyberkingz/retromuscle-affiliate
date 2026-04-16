import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/currency";
import type { RateSheetRow } from "@/application/use-cases/get-saas-landing-data";
import { cn } from "@/lib/cn";

interface RatesSectionProps {
  title: string;
  subtitle: string;
  rows: RateSheetRow[];
}

export function RatesSection({ title, subtitle, rows }: RatesSectionProps) {
  const containerWidthClass =
    rows.length <= 2
      ? "max-w-[560px]"
      : rows.length === 3
        ? "max-w-[860px]"
        : rows.length === 4
          ? "max-w-[1120px]"
          : "max-w-[1360px]";

  return (
    <section className="animate-fade-up space-y-6">
      <div className="space-y-3 text-center">
        <h2 className="font-display text-4xl uppercase tracking-tight text-secondary sm:text-5xl">{title}</h2>
        <p className="mx-auto max-w-3xl text-foreground/70">{subtitle}</p>
      </div>

      <div
        className={cn(
          "mx-auto grid w-full justify-center gap-3 grid-cols-[repeat(auto-fit,minmax(220px,250px))]",
          containerWidthClass
        )}
      >
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
