import { formatCurrency } from "@/lib/currency";
import { CardSection } from "@/components/layout/card-section";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface EarningsSectionProps {
  title: string;
  subtitle: string;
  scenarios: Array<{
    tier: number;
    videos: number;
    credits: number;
    mixLabel: string;
    estimatedAmount: number;
    breakdown: Array<{ label: string; delivered: number; rate: number; subtotal: number }>;
    assumptions: string[];
  }>;
}

export function EarningsSection({ title, subtitle, scenarios }: EarningsSectionProps) {
  return (
    <section className="space-y-10 animate-fade-up [animation-delay:220ms]">
      <div className="text-center space-y-4">
        <h2 className="font-display text-4xl uppercase tracking-tight text-secondary sm:text-5xl">
          {title}
        </h2>
        <p className="mx-auto max-w-2xl text-foreground/70">{subtitle}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {scenarios.map((scenario) => (
          <CardSection key={scenario.tier} className="flex flex-col">
            <p className="text-xs uppercase tracking-[0.12em] text-foreground/55">Pack {scenario.tier}</p>
            <p className="mt-2 font-display text-5xl uppercase leading-none text-secondary">
              {formatCurrency(scenario.estimatedAmount)}
            </p>
            <p className="mt-2 text-sm text-foreground/75">
              Scenario sur {scenario.videos} videos (mix {scenario.mixLabel}).
            </p>

            <div className="mt-4 grid gap-2 rounded-2xl border border-line bg-frost/60 p-4 text-sm text-foreground/75">
              {scenario.breakdown.slice(0, 3).map((row) => (
                <div key={row.label} className="flex items-center justify-between gap-3">
                  <span className="truncate">{row.label}</span>
                  <span className="font-medium">{row.delivered}x</span>
                </div>
              ))}
              <p className="text-xs text-foreground/55">
                Credits inclus: {formatCurrency(scenario.credits)}
              </p>
            </div>

            <div className="mt-4 space-y-1 text-xs text-foreground/60">
              {scenario.assumptions.slice(0, 3).map((line) => (
                <p key={line}>• {line}</p>
              ))}
            </div>
          </CardSection>
        ))}
      </div>

      <div className="flex justify-center">
        <Button asChild size="lg" className="h-14 px-8">
          <Link href="/apply">Je postule au programme</Link>
        </Button>
      </div>
    </section>
  );
}

