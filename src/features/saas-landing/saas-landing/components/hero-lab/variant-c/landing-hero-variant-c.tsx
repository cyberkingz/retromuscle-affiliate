import Link from "next/link";
import type { Route } from "next";
import Image from "next/image";
import { ArrowRight, CheckCircle2, Clock3, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface LandingHeroVariantCProps {
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

export function LandingHeroVariantC({
  kicker,
  title,
  subtitle,
  primaryCta,
  visuals
}: LandingHeroVariantCProps) {
  const { primaryImageUrl } = visuals;

  return (
    <section className="relative overflow-hidden pb-12 pt-0 sm:pb-16">
      <div className="absolute inset-x-0 top-0 -z-10 h-[420px] bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.7),transparent_42%),radial-gradient(circle_at_top_right,rgba(255,255,255,0.45),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.34),transparent_70%)]" />
      <div className="absolute right-[-8rem] top-24 -z-10 h-72 w-72 rounded-full bg-secondary/10 blur-3xl" />
      <div className="absolute left-[-9rem] top-56 -z-10 h-80 w-80 rounded-full bg-white/45 blur-3xl" />

      <div className="relative grid items-center gap-8 lg:grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)] lg:gap-12 xl:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)]">
        <div className="min-w-0 space-y-6 animate-fade-up text-center lg:text-left">
          <div className="flex flex-wrap items-center justify-center gap-2 lg:justify-start">
            <Badge variant="outline" className="bg-white/85">
              {kicker}
            </Badge>
            <p className="rounded-full border border-line bg-white/70 px-3 py-1 text-[11px] uppercase tracking-[0.11em] text-foreground/70">
              Rythme libre, paiement r&eacute;el
            </p>
          </div>

          <div className="mx-auto max-w-3xl space-y-4 lg:mx-0">
            <h1 className="font-display text-4xl uppercase leading-[0.9] tracking-tight text-secondary sm:text-5xl lg:text-6xl xl:text-[4.55rem]">
              {title}
            </h1>
            <p className="max-w-2xl text-base text-foreground/80 sm:text-lg lg:max-w-xl">
              {subtitle}
            </p>
          </div>

          <div className="flex flex-col items-center gap-3 sm:flex-row sm:flex-wrap sm:justify-center lg:items-start lg:justify-start">
            <Button asChild size="lg" className="h-12 w-full px-8 text-sm sm:w-auto sm:text-base">
              <Link href={primaryCta.href}>
                {primaryCta.label}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <p className="text-xs uppercase tracking-[0.1em] text-foreground/60">Inscription valid&eacute;e en 48h</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[1.4rem] border border-white/75 bg-white/70 p-4 text-left shadow-[0_10px_30px_rgba(16,23,43,0.06)] backdrop-blur">
              <Clock3 className="h-4 w-4 text-secondary" />
              <p className="mt-3 font-display text-2xl uppercase leading-none text-secondary">48h max</p>
              <p className="mt-1 text-sm text-foreground/65">Retour rapide sur ta candidature</p>
            </div>
            <div className="rounded-[1.4rem] border border-white/75 bg-white/70 p-4 text-left shadow-[0_10px_30px_rgba(16,23,43,0.06)] backdrop-blur">
              <ShieldCheck className="h-4 w-4 text-secondary" />
              <p className="mt-3 font-display text-2xl uppercase leading-none text-secondary">Paiement mensuel</p>
              <p className="mt-1 text-sm text-foreground/65">IBAN, PayPal ou Stripe selon ton setup</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-foreground/75 lg:justify-start">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white/70 px-3 py-1.5">
              <CheckCircle2 className="h-4 w-4 text-mint" />
              <span>Pas de quota impos&eacute;</span>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white/70 px-3 py-1.5">
              <CheckCircle2 className="h-4 w-4 text-mint" />
              <span>Tarifs visibles avant upload</span>
            </div>
          </div>
        </div>

        <div className="relative animate-fade-in lg:justify-self-stretch">
          <div className="absolute -inset-4 hidden rounded-[2.4rem] bg-secondary/10 blur-2xl lg:block" />
          <div className="retro-outline relative mx-auto w-full max-w-[940px] overflow-hidden rounded-[2rem] bg-white shadow-[0_24px_70px_rgba(16,23,43,0.14)] lg:ml-auto">
            <div className="relative h-[380px] sm:h-[500px] lg:h-[640px]">
              <Image
                src={primaryImageUrl}
                alt="Cr&eacute;ateurs RetroMuscle"
                fill
                className="object-cover object-center"
                sizes="(max-width: 1024px) 100vw, 920px"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-secondary/65 via-secondary/18 to-transparent" />
              <div className="absolute left-4 top-4 rounded-full border border-white/35 bg-white/18 px-3 py-1.5 text-[10px] uppercase tracking-[0.12em] text-white backdrop-blur">
                Programme cr&eacute;ateur
              </div>
              <div className="absolute bottom-4 left-4 right-4 rounded-[1.25rem] border border-white/28 bg-white/18 p-4 text-white backdrop-blur-md sm:left-5 sm:right-5">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.12em] text-white/75">Cadre de paiement</p>
                    <p className="mt-1 font-display text-2xl uppercase leading-none">Large stage, clear signal</p>
                  </div>
                  <p className="max-w-[16rem] text-sm text-white/85">
                    Une seule image dominante, plus de largeur visuelle, moins de distraction.
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-line bg-white px-4 py-4 sm:px-5">
              <div className="grid gap-2.5 sm:grid-cols-2">
                <div className="rounded-2xl border border-line bg-frost/70 px-4 py-3">
                  <p className="text-[10px] uppercase tracking-[0.1em] text-foreground/60">Validation</p>
                  <p className="mt-1 font-display text-2xl uppercase leading-none text-secondary">Sous 48h</p>
                </div>
                <div className="rounded-2xl border border-line bg-frost/70 px-4 py-3">
                  <p className="text-[10px] uppercase tracking-[0.1em] text-foreground/60">Vision</p>
                  <p className="mt-1 font-display text-2xl uppercase leading-none text-secondary">Plus large</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
