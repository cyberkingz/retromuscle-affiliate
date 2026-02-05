import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/currency";

interface PackagesGridProps {
  packages: Array<{
    tier: number;
    monthlyVideoQuota: number;
    monthlyCredits: number;
  }>;
}

export function PackagesGrid({ packages }: PackagesGridProps) {
  return (
    <section className="space-y-4">
      <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-foreground/60">Packs mensuels</h3>
      <div className="grid gap-3 xs:grid-cols-2 lg:grid-cols-4">
        {packages.map((pkg, index) => {
          const featured = index === 1;

          return (
            <Card key={pkg.tier} className={`space-y-3 bg-white p-5 ${featured ? "border-foreground shadow-xl" : ""}`}>
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.15em] text-foreground/55">Pack {pkg.tier}</p>
                {featured ? (
                  <span className="rounded-full border border-foreground bg-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.11em]">
                    recommande
                  </span>
                ) : null}
              </div>
              <p className="font-display text-5xl uppercase leading-none">{pkg.monthlyVideoQuota}</p>
              <p className="text-sm text-foreground/70">videos / mois</p>
              <p className="rounded-lg border border-line bg-frost/70 px-3 py-2 text-sm text-foreground/80">
                Credits: {formatCurrency(pkg.monthlyCredits)}
              </p>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
