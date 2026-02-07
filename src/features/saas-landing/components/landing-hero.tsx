import Link from "next/link";
import type { Route } from "next";
import Image from "next/image";
import { ArrowRight, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface LandingHeroProps {
  kicker: string;
  title: string;
  subtitle: string;
  primaryCta: { label: string; href: Route };
  visuals: {
    logoUrl: string;
    primaryImageUrl: string;
    secondaryImageUrl: string;
    productImageUrls: string[];
  };
}

export function LandingHero({
  kicker,
  title,
  subtitle,
  primaryCta,
  visuals
}: LandingHeroProps) {
  return (
    <section className="relative overflow-visible pb-10 pt-0 sm:pt-2">
      <div className="relative grid items-center gap-10 lg:grid-cols-[minmax(0,1.12fr)_minmax(0,0.88fr)] lg:gap-12">
        <div className="relative z-30 min-w-0 space-y-7 animate-fade-up lg:pr-8 text-center lg:text-left">
          <div className="flex justify-center lg:justify-start">
            <Badge variant="outline" className="bg-white/80">
              {kicker}
            </Badge>
          </div>

          <h1 className="font-display text-lg uppercase leading-[1.04] tracking-tight text-secondary sm:text-xl md:text-2xl lg:text-3xl mx-auto lg:mx-0">
            {title}
          </h1>

          <p className="max-w-[42rem] text-base text-foreground/80 sm:text-lg md:text-xl mx-auto lg:mx-0">
            {subtitle}
          </p>

          <div className="flex max-w-[720px] flex-wrap gap-3 justify-center lg:justify-start mx-auto lg:mx-0">
            <Button asChild size="lg" className="h-14 w-full px-8 text-base sm:w-auto">
              <Link href={primaryCta.href}>
                {primaryCta.label}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>

          <div className="grid gap-3 pt-2 sm:grid-cols-3">
            <div className="glass-panel rounded-2xl px-4 py-3">
              <p className="font-display text-3xl uppercase leading-none text-secondary">48h</p>
              <p className="text-xs uppercase tracking-[0.1em] text-foreground/65">Reponse a ton profil</p>
            </div>
            <div className="glass-panel rounded-2xl px-4 py-3">
              <p className="font-display text-3xl uppercase leading-none text-secondary">Mensuel</p>
              <p className="text-xs uppercase tracking-[0.1em] text-foreground/65">Missions + paiement</p>
            </div>
            <div className="glass-panel rounded-2xl px-4 py-3">
              <p className="font-display text-3xl uppercase leading-none text-secondary">Brief</p>
              <p className="text-xs uppercase tracking-[0.1em] text-foreground/65">Specs claires</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm text-foreground/75">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-mint" />
              <span>Missions regulieres</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-mint" />
              <span>Paiement mensuel clair</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 animate-fade-in lg:justify-self-end">
          <div className="retro-outline relative z-10 mx-auto w-full max-w-[540px] overflow-hidden rounded-[2rem] bg-white lg:mx-0">
            <div className="relative h-[280px] sm:h-[340px]">
              <Image
                src={visuals.primaryImageUrl}
                alt="RetroMuscle creators"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 560px"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-secondary/50 via-transparent to-transparent" />
              <div className="absolute left-4 top-4 rounded-full border border-white/30 bg-white/20 px-3 py-1 text-[11px] uppercase tracking-[0.1em] text-white backdrop-blur">
                Ambiance RetroMuscle
              </div>
            </div>

            <div className="space-y-3 p-4 pb-7 sm:p-5 sm:pb-8">
              <div className="grid gap-3 sm:grid-cols-[0.7fr_1.3fr]">
                <div className="relative h-32 overflow-hidden rounded-2xl border border-line">
                  <Image
                    src={visuals.secondaryImageUrl}
                    alt="RetroMuscle lookbook"
                    fill
                    className="object-cover"
                    sizes="220px"
                  />
                </div>
                <div className="rounded-2xl border border-line bg-frost px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.1em] text-foreground/55">Missions du mois</p>
                  <div className="mt-2 flex items-end justify-between">
                    <p className="font-display text-5xl uppercase leading-none text-secondary">32/40</p>
                    <p className="text-sm text-foreground/70">missions finalisees</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {visuals.productImageUrls.map((imageUrl, index) => (
                  <div key={imageUrl} className="relative h-20 overflow-hidden rounded-xl border border-line">
                    <Image
                      src={imageUrl}
                      alt={`RetroMuscle product ${index + 1}`}
                      fill
                      className="object-cover"
                      sizes="180px"
                    />
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border-2 border-foreground bg-primary px-4 py-3 text-sm text-foreground shadow-xl">
                <p className="font-semibold uppercase tracking-[0.08em]">Revenus plus reguliers</p>
                <p className="text-foreground/80">grace a un volume de missions constant</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
