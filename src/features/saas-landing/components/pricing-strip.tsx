import Link from "next/link";
import { formatCurrency } from "@/lib/currency";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface PricingStripProps {
  plans: Array<{ tier: number; videos: number; credits: number }>;
}

export function PricingStrip({ plans }: PricingStripProps) {
  return (
    <section className="space-y-12 animate-fade-up [animation-delay:260ms]">
      <div className="text-center space-y-4">
        <h2 className="font-display text-4xl uppercase tracking-tight text-secondary sm:text-5xl">
          Packs de missions
        </h2>
        <p className="mx-auto max-w-2xl text-foreground/70">
          Un quota clair, des credits inclus, et des missions qui arrivent chaque mois. Tu choisis ton rythme.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {plans.map((plan, index) => {
          const featured = index === 1;

          return (
            <Card
              key={plan.tier} 
              className={`relative flex flex-col border-line bg-white ${
                featured ? "md:scale-[1.03] border-foreground bg-frost shadow-xl" : "hover:border-foreground/40"
              }`}
            >
              {featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge variant="default">Populaire</Badge>
                </div>
              )}

              <CardHeader className="text-center pb-2">
                <CardTitle className="text-xs uppercase tracking-[0.12em] text-foreground/55">
                  Pack {plan.tier}
                </CardTitle>
                <div className="flex items-baseline justify-center gap-1 pt-2">
                  <span className="font-display text-5xl uppercase text-secondary">{plan.videos}</span>
                  <span className="text-sm text-foreground/65">videos/mois</span>
                </div>
              </CardHeader>

              <CardContent className="flex-1 text-center space-y-4">
                <div className="rounded-2xl border border-line bg-white/70 px-4 py-3 text-sm text-foreground/75">
                  <p className="text-xs uppercase tracking-[0.12em] text-foreground/55">Credits inclus</p>
                  <p className="mt-1 font-medium">{formatCurrency(plan.credits)}</p>
                </div>
                <p className="text-xs text-foreground/60">
                  Brief clair, upload simple, validation rapide, paiement mensuel.
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex flex-col items-center gap-3 text-center">
        <Button asChild size="lg" className="h-14 px-8">
          <Link href="/apply">Je m&apos;inscris au programme</Link>
        </Button>
        <p className="text-sm text-foreground/70">
          Tu hesites sur le pack ? Pas grave. On ajuste apres validation de ton dossier.
        </p>
      </div>
    </section>
  );
}
