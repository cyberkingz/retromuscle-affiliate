import Link from "next/link";
import { Check } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from "@/components/ui/card";
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
          Choisis ton rythme de revenus
        </h2>
        <p className="mx-auto max-w-2xl text-foreground/70">
          Plus tu prends de missions, plus ton potentiel de revenu mensuel augmente.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {plans.map((plan, index) => {
          const featured = index === 1;

          return (
            <Card
              key={plan.tier} 
              className={`relative flex flex-col border-line bg-white ${
                featured ? "scale-[1.03] border-foreground bg-frost shadow-xl" : "hover:border-foreground/40"
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
                <div className="flex items-center justify-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-mint" />
                  <span>{formatCurrency(plan.credits)} credits</span>
                </div>
                <p className="text-xs text-foreground/60">Briefs prets + accompagnement + paiement mensuel</p>
              </CardContent>

              <CardFooter>
                <Button asChild className="w-full" variant={featured ? "default" : "outline"}>
                  <Link href="/apply">Choisir ce pack</Link>
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      <div className="flex justify-center">
        <p className="rounded-full border border-line bg-white/70 px-4 py-2 text-sm text-foreground/70">
          Tu hesites ?{" "}
          <Link href="/apply" className="font-semibold underline underline-offset-4 hover:text-secondary">
            Commence avec une inscription rapide
          </Link>
        </p>
      </div>
    </section>
  );
}
