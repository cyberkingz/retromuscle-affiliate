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
    <Card className="mt-4 grid gap-8 bg-gradient-to-br from-white to-frost/60 p-5 sm:p-8 lg:grid-cols-[1.08fr_0.92fr] lg:p-10">
      <div className="flex flex-col justify-center space-y-6">
        <SectionHeading eyebrow="Programme cr&eacute;ateur RetroMuscle" title={title} subtitle={subtitle} />
        <div className="flex flex-col gap-3 xs:flex-row">
          <Button asChild size="pill" className="w-full xs:w-auto">
            <Link href={ctaHref}>{ctaLabel}</Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-2 text-sm xs:grid-cols-2 sm:gap-3">
          <div className="rounded-xl border border-line bg-white/85 p-3 sm:p-4">
            <p className="text-[10px] uppercase tracking-[0.15em] text-foreground/55 sm:text-xs">Quota minimum</p>
            <p className="mt-1 font-display text-2xl uppercase sm:text-3xl">Zero</p>
          </div>
          <div className="rounded-xl border border-line bg-white/85 p-3 sm:p-4">
            <p className="text-[10px] uppercase tracking-[0.15em] text-foreground/55 sm:text-xs">Par vid&eacute;o valid&eacute;e</p>
            <p className="mt-1 font-display text-2xl uppercase sm:text-3xl">95-180&euro;</p>
          </div>
          <div className="rounded-xl border border-line bg-white/85 p-3 sm:p-4">
            <p className="text-[10px] uppercase tracking-[0.15em] text-foreground/55 sm:text-xs">Plafond de gains</p>
            <p className="mt-1 font-display text-2xl uppercase sm:text-3xl">Illimit&eacute;</p>
          </div>
          <div className="rounded-xl border border-line bg-white/85 p-3 sm:p-4">
            <p className="text-[10px] uppercase tracking-[0.15em] text-foreground/55 sm:text-xs">Validation sous</p>
            <p className="mt-1 font-display text-2xl uppercase sm:text-3xl">48h</p>
          </div>
        </div>
      </div>

      <div className="relative h-[280px] overflow-hidden rounded-[1.6rem] border border-line bg-white sm:h-[390px]">
        <Image
          src={BRAND_ASSETS.heroLifestyle}
          alt="Cr&eacute;ateurs RetroMuscle"
          fill
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 560px"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-secondary/55 via-secondary/10 to-transparent" />
        <div className="absolute right-3 top-3 rounded-full border border-white/35 bg-white/15 px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-white backdrop-blur sm:right-4 sm:top-4 sm:px-3 sm:py-1 sm:text-[11px]">
          Open bar
        </div>
        <div className="absolute bottom-3 left-3 rounded-xl border border-white/30 bg-white/90 px-3 py-2 text-sm sm:bottom-4 sm:left-4 sm:px-4 sm:py-3">
          <p className="text-[10px] uppercase tracking-[0.11em] text-foreground/55 sm:text-xs">Ce mois-ci</p>
          <p className="mt-0.5 font-display text-3xl uppercase leading-none text-secondary sm:mt-1 sm:text-4xl">2 450&euro;</p>
          <p className="text-xs text-foreground/70 sm:text-sm">14 vid&eacute;os valid&eacute;es</p>
        </div>
      </div>
    </Card>
  );
}
