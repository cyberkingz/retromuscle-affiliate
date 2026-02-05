import Link from "next/link";
import type { Route } from "next";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";
import { BRAND_ASSETS } from "@/domain/constants/brand-assets";

interface HeroSectionProps {
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaHref: Route;
}

export function HeroSection({ title, subtitle, ctaLabel, ctaHref }: HeroSectionProps) {
  return (
    <Card className="grid gap-8 bg-gradient-to-br from-white to-frost/60 p-6 sm:p-8 lg:grid-cols-[1.08fr_0.92fr] lg:p-10">
      <div className="space-y-6">
        <SectionHeading eyebrow="Revenus createur" title={title} subtitle={subtitle} />
        <div className="flex flex-wrap gap-3">
          <Button asChild size="pill">
            <Link href={ctaHref}>{ctaLabel}</Link>
          </Button>
          <Button asChild variant="outline" size="pill">
            <Link href="/apply">Je candidate en 2 minutes</Link>
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl border border-line bg-white/85 p-4">
            <p className="text-xs uppercase tracking-[0.15em] text-foreground/55">Missions</p>
            <p className="mt-1 font-display text-3xl uppercase">10-40</p>
          </div>
          <div className="rounded-xl border border-line bg-white/85 p-4">
            <p className="text-xs uppercase tracking-[0.15em] text-foreground/55">Paiement</p>
            <p className="mt-1 font-display text-3xl uppercase">Mensuel</p>
          </div>
          <div className="rounded-xl border border-line bg-white/85 p-4">
            <p className="text-xs uppercase tracking-[0.15em] text-foreground/55">Validation cible</p>
            <p className="mt-1 font-display text-3xl uppercase">90%</p>
          </div>
          <div className="rounded-xl border border-line bg-white/85 p-4">
            <p className="text-xs uppercase tracking-[0.15em] text-foreground/55">Reponse</p>
            <p className="mt-1 font-display text-3xl uppercase">&lt;48h</p>
          </div>
        </div>
      </div>

      <div className="relative h-[340px] overflow-hidden rounded-[1.6rem] border border-line bg-white sm:h-[390px]">
        <Image
          src={BRAND_ASSETS.heroLifestyle}
          alt="Createurs RetroMuscle"
          fill
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 560px"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-secondary/55 via-secondary/10 to-transparent" />
        <div className="absolute right-4 top-4 rounded-full border border-white/35 bg-white/15 px-3 py-1 text-[11px] uppercase tracking-[0.12em] text-white backdrop-blur">
          Programme affilie
        </div>
        <div className="absolute bottom-4 left-4 rounded-xl border border-white/30 bg-white/90 px-4 py-3 text-sm">
          <p className="text-xs uppercase tracking-[0.11em] text-foreground/55">Objectif du mois</p>
          <p className="mt-1 font-display text-4xl uppercase leading-none text-secondary">32/40</p>
          <p className="text-foreground/70">missions finalisees</p>
        </div>
      </div>
    </Card>
  );
}
