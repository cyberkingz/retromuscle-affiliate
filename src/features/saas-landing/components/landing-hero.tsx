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

export function LandingHero({ kicker, title, subtitle, primaryCta, visuals }: LandingHeroProps) {
  const { primaryImageUrl } = visuals;

  return (
    <section className="relative overflow-x-clip overflow-y-visible pb-12 pt-4 sm:pb-16 sm:pt-6">
      <div className="absolute inset-x-0 top-0 -z-10 h-[420px] bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.7),transparent_42%),radial-gradient(circle_at_top_right,rgba(255,255,255,0.45),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.34),transparent_70%)]" />
      <div className="absolute right-[-8rem] top-24 -z-10 h-72 w-72 rounded-full bg-secondary/10 blur-3xl" />
      <div className="absolute left-[-9rem] top-56 -z-10 h-80 w-80 rounded-full bg-white/45 blur-3xl" />

      <div className="relative grid items-center gap-8 lg:grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)] lg:gap-12 xl:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)]">
        <div className="min-w-0 space-y-8 animate-fade-up text-center lg:text-left">
          <div className="flex justify-center lg:justify-start">
            <Badge variant="outline" className="bg-white/85">
              {kicker}
            </Badge>
          </div>

          <div className="mx-auto max-w-3xl space-y-4 lg:mx-0">
            <h1 className="font-display text-4xl uppercase leading-[0.88] tracking-tight text-secondary sm:text-5xl lg:text-6xl xl:text-[4.8rem]">
              {title}
            </h1>
            <p className="max-w-xl text-base text-foreground/75 sm:text-lg">{subtitle}</p>
          </div>

          <div className="flex justify-center lg:justify-start">
            <Button asChild size="lg" className="h-12 w-full px-8 sm:w-auto">
              <Link href={primaryCta.href}>
                {primaryCta.label}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-foreground/70 lg:justify-start">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white/70 px-3 py-1.5">
              <CheckCircle2 className="h-4 w-4 text-mint" />
              <span>Aucun quota</span>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white/70 px-3 py-1.5">
              <CheckCircle2 className="h-4 w-4 text-mint" />
              <span>Valid&eacute; en 48h</span>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white/70 px-3 py-1.5">
              <CheckCircle2 className="h-4 w-4 text-mint" />
              <span>Petit compte OK</span>
            </div>
          </div>
        </div>

        <div className="relative min-w-0 animate-fade-in lg:justify-self-stretch">
          <div className="absolute -inset-4 hidden rounded-[2.4rem] bg-secondary/10 blur-2xl lg:block" />
          <div className="relative mx-auto w-full max-w-[940px] overflow-hidden rounded-[2rem] border-2 border-foreground bg-white shadow-none sm:shadow-[0_14px_32px_-18px_rgba(6,13,56,0.46)] lg:ml-auto">
            <div className="relative aspect-[4/3] min-h-[360px] lg:aspect-[5/4] lg:min-h-[580px]">
              <Image
                src={primaryImageUrl}
                alt="Cr&eacute;ateurs RetroMuscle"
                fill
                className="object-cover object-center"
                sizes="(max-width: 1024px) 100vw, 900px"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-secondary/65 via-secondary/18 to-transparent" />
              <div className="absolute left-4 top-4 rounded-full border border-white/35 bg-white/20 px-3 py-1.5 text-[10px] uppercase tracking-[0.12em] text-white backdrop-blur">
                Programme cr&eacute;ateur
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
