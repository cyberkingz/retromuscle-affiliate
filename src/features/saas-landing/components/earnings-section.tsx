import Link from "next/link";
import { formatCurrency } from "@/lib/currency";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { EarningsScenario } from "@/application/use-cases/get-saas-landing-data";

interface EarningsSectionProps {
  title: string;
  subtitle: string;
  scenarios: EarningsScenario[];
  packages: Array<{ tier: number; videos: number; credits: number }>;
  cta: { label: string; href: "/apply" };
  hint: string;
}

export function EarningsSection({
  title,
  subtitle,
  scenarios,
  packages,
  cta,
  hint
}: EarningsSectionProps) {
  return (
    <section className="animate-fade-up">
      <div className="text-center space-y-4">
        <h2 className="font-display text-4xl uppercase tracking-tight text-secondary sm:text-5xl">
          {title}
        </h2>
        <p className="mx-auto max-w-2xl text-foreground/70">{subtitle}</p>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {scenarios.map((scenario, index) => {
          const pkg = packages[index];
          const featured = index === 1;

          return (
            <Card
              key={scenario.tier}
              className={`relative flex flex-col border-line ${
                featured
                  ? "border-foreground bg-frost shadow-xl md:scale-[1.02]"
                  : "bg-white hover:border-foreground/40"
              }`}
            >
              {featured ? (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge variant="default">Populaire</Badge>
                </div>
              ) : null}

              <CardContent className="flex flex-1 flex-col p-5">
                <p className="text-xs uppercase tracking-[0.12em] text-foreground/55">
                  Pack {scenario.tier}
                </p>

                {/* Video count */}
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="font-display text-4xl uppercase text-secondary">
                    {pkg?.videos ?? scenario.videos}
                  </span>
                  <span className="text-sm text-foreground/60">vidéos/mois</span>
                </div>

                {/* Estimated earnings */}
                <div className="mt-4 rounded-xl border border-line bg-frost/60 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.12em] text-foreground/50">
                    Estimation mensuelle
                  </p>
                  <p className="mt-1 font-display text-3xl uppercase leading-none text-secondary">
                    {formatCurrency(scenario.estimatedAmount)}
                  </p>
                </div>

                {/* Breakdown */}
                <div className="mt-3 flex-1 space-y-1.5 text-xs text-foreground/65">
                  {scenario.breakdown.slice(0, 3).map((row) => (
                    <div key={row.label} className="flex justify-between">
                      <span className="truncate">{row.label}</span>
                      <span className="font-medium">{row.delivered}×</span>
                    </div>
                  ))}
                  {pkg ? (
                    <p className="pt-1 text-foreground/50">
                      {"Bonus fixe\u00a0: "}{formatCurrency(pkg.credits)}
                    </p>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-8 flex flex-col items-center gap-3 text-center">
        <Button asChild size="lg" className="h-14 px-8">
          <Link href={cta.href}>{cta.label}</Link>
        </Button>
        <p className="text-sm text-foreground/60">{hint}</p>
      </div>
    </section>
  );
}
