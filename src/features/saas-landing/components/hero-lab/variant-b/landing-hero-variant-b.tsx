import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import { ArrowRight, CheckCircle2, Clock3, ShieldCheck, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface LandingHeroVariantBProps {
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

export function LandingHeroVariantB({
  kicker,
  title,
  subtitle,
  primaryCta,
  visuals
}: LandingHeroVariantBProps) {
  return (
    <section className="relative overflow-hidden pb-12 pt-2 sm:pb-16 lg:pb-20 lg:pt-4">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[560px] bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.88),_rgba(255,255,255,0)_46%),radial-gradient(circle_at_top_right,_rgba(255,255,255,0.72),_rgba(255,255,255,0)_36%),linear-gradient(180deg,_rgba(255,255,255,0.46),_rgba(255,255,255,0)_68%)]" />
      <div className="pointer-events-none absolute left-[-8%] top-[12%] -z-10 h-72 w-72 rounded-full bg-white/40 blur-3xl" />
      <div className="pointer-events-none absolute right-[-10%] top-[20%] -z-10 h-80 w-80 rounded-full bg-frost/80 blur-3xl" />

      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[minmax(0,1.22fr)_minmax(0,0.78fr)] lg:items-center lg:gap-12 xl:grid-cols-[minmax(0,1.28fr)_minmax(0,0.72fr)] xl:gap-14">
        <div className="order-2 min-w-0 lg:order-1">
          <div className="retro-outline overflow-hidden rounded-[2rem] bg-white/90 p-2 sm:p-3">
            <div className="relative aspect-[0.95/1] min-h-[360px] overflow-hidden rounded-[1.55rem] sm:aspect-[1.08/1] sm:min-h-[460px] lg:aspect-[1.05/1] lg:min-h-[640px]">
              <Image
                src={visuals.primaryImageUrl}
                alt="Creatives RetroMuscle"
                fill
                className="object-cover object-center"
                sizes="(max-width: 1024px) 100vw, 68vw"
                priority
              />

              <div className="absolute inset-0 bg-gradient-to-t from-secondary/60 via-secondary/10 to-transparent" />

              <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full border border-white/35 bg-white/20 px-3 py-1.5 text-[10px] uppercase tracking-[0.14em] text-white backdrop-blur">
                <Sparkles className="h-3.5 w-3.5" />
                Community proof
              </div>

              <div className="absolute bottom-4 left-4 right-4 rounded-[1.35rem] border border-white/30 bg-white/90 px-4 py-4 shadow-[0_18px_42px_-24px_rgba(8,17,66,0.55)] backdrop-blur-sm sm:px-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-[0.14em] text-foreground/55">
                      What matters on the page
                    </p>
                    <p className="mt-1 max-w-xl font-display text-2xl uppercase leading-[0.92] tracking-tight text-secondary sm:text-3xl">
                      One strong image, one clear promise
                    </p>
                  </div>
                  <div className="hidden shrink-0 rounded-full border border-line bg-frost px-3 py-1 text-[11px] uppercase tracking-[0.12em] text-foreground/70 sm:block">
                    High trust
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="order-1 space-y-6 text-center lg:order-2 lg:text-left">
          <div className="flex flex-wrap items-center justify-center gap-2 lg:justify-start">
            <Badge variant="outline" className="bg-white/90 px-4 py-1.5 text-[11px] tracking-[0.14em]">
              {kicker}
            </Badge>
            <div className="inline-flex items-center gap-2 rounded-full border border-line bg-white/80 px-3 py-1.5 text-[11px] uppercase tracking-[0.11em] text-foreground/65">
              <Clock3 className="h-3.5 w-3.5 text-secondary" />
              Reply in 48h
            </div>
          </div>

          <div className="mx-auto flex max-w-xl items-center justify-center gap-3 lg:mx-0 lg:justify-start">
            <div className="relative h-11 w-11 overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
              <Image
                src={visuals.logoUrl}
                alt="RetroMuscle logo"
                fill
                className="object-contain p-1.5"
                sizes="44px"
              />
            </div>
            <p className="text-xs uppercase tracking-[0.18em] text-foreground/60">
              Creator program
            </p>
          </div>

          <div className="space-y-4">
            <h1 className="mx-auto max-w-2xl font-display text-4xl uppercase leading-[0.9] tracking-tight text-secondary sm:text-5xl lg:mx-0 lg:text-6xl xl:text-[4.8rem]">
              {title}
            </h1>
            <p className="mx-auto max-w-2xl text-base leading-relaxed text-foreground/80 sm:text-lg lg:mx-0">
              {subtitle}
            </p>
          </div>

          <div className="flex flex-col items-stretch justify-center gap-3 sm:flex-row lg:justify-start">
            <Button asChild size="lg" className="w-full sm:w-auto sm:min-w-[220px]">
              <Link href={primaryCta.href}>
                {primaryCta.label}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <div className="flex items-center justify-center gap-2 rounded-full border border-line bg-white/80 px-4 py-3 text-xs uppercase tracking-[0.11em] text-foreground/65 sm:w-auto">
              <ShieldCheck className="h-4 w-4 text-mint" />
              No minimum quota
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Card className="border-line bg-white/90 p-4 text-left shadow-[0_10px_24px_-18px_rgba(8,17,66,0.4)]">
              <Clock3 className="h-4 w-4 text-secondary" />
              <p className="mt-3 text-[10px] uppercase tracking-[0.12em] text-foreground/55">
                Validation
              </p>
              <p className="mt-1 font-display text-2xl uppercase leading-none text-secondary">
                48h
              </p>
              <p className="mt-2 text-xs leading-relaxed text-foreground/65">
                Fast response to keep momentum.
              </p>
            </Card>

            <Card className="border-line bg-white/90 p-4 text-left shadow-[0_10px_24px_-18px_rgba(8,17,66,0.4)]">
              <Sparkles className="h-4 w-4 text-secondary" />
              <p className="mt-3 text-[10px] uppercase tracking-[0.12em] text-foreground/55">
                Payout
              </p>
              <p className="mt-1 font-display text-2xl uppercase leading-none text-secondary">
                Monthly
              </p>
              <p className="mt-2 text-xs leading-relaxed text-foreground/65">
                Clear payment rhythm, no noise.
              </p>
            </Card>

            <Card className="border-line bg-white/90 p-4 text-left shadow-[0_10px_24px_-18px_rgba(8,17,66,0.4)]">
              <CheckCircle2 className="h-4 w-4 text-secondary" />
              <p className="mt-3 text-[10px] uppercase tracking-[0.12em] text-foreground/55">
                Scale
              </p>
              <p className="mt-1 font-display text-2xl uppercase leading-none text-secondary">
                No cap
              </p>
              <p className="mt-2 text-xs leading-relaxed text-foreground/65">
                The offer stays simple as volume grows.
              </p>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
