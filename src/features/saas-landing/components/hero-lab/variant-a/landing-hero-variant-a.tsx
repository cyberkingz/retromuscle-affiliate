import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import { ArrowRight, BadgeCheck, Clock3, ShieldCheck, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type HeroCta = {
  label: string;
  href: Route;
};

type HeroStat = {
  label: string;
  value: string;
  helper?: string;
};

export interface LandingHeroVariantAProps {
  kicker?: string;
  title?: string;
  subtitle?: string;
  primaryCta?: HeroCta;
  secondaryCta?: HeroCta;
  imageSrc?: string;
  imageAlt?: string;
  stats?: HeroStat[];
}

const DEFAULT_STATS: HeroStat[] = [
  { label: "Validation", value: "48h", helper: "réponse rapide" },
  { label: "Paiement", value: "Mensuel", helper: "sortie claire" },
  { label: "Quota", value: "Libre", helper: "pas de plafond" },
];

export function LandingHeroVariantA({
  kicker = "Programme créateur",
  title = "Un cadre simple pour monétiser des vidéos validées.",
  subtitle = "Une hero plus lisible, plus large et plus crédible: un seul visuel fort, un message direct et des repères concrets pour comprendre la promesse en quelques secondes.",
  primaryCta = { label: "Candidater", href: "/apply" },
  secondaryCta = { label: "Voir les tarifs", href: "/#tarifs" },
  imageSrc = "/images/community/community-hero-client-89c9.jpg",
  imageAlt = "Créateurs RetroMuscle en salle de sport",
  stats = DEFAULT_STATS,
}: LandingHeroVariantAProps) {
  return (
    <section className="relative overflow-hidden py-8 sm:py-10 lg:py-14">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[540px] bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.7),rgba(255,255,255,0)_42%),radial-gradient(circle_at_right,rgba(255,255,255,0.55),rgba(255,255,255,0)_28%),linear-gradient(180deg,rgba(255,255,255,0.34),rgba(255,255,255,0)_70%)]" />
      <div className="pointer-events-none absolute -left-20 top-16 -z-10 h-52 w-52 rounded-full bg-secondary/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 top-44 -z-10 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />

      <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 sm:px-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.35fr)] lg:gap-10 lg:px-8 xl:gap-12">
        <div className="order-2 space-y-6 text-center lg:order-1 lg:text-left">
          <div className="flex flex-wrap items-center justify-center gap-2 lg:justify-start">
            <Badge variant="outline" className="bg-white/80 backdrop-blur">
              {kicker}
            </Badge>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white/75 px-3 py-1.5 text-[11px] uppercase tracking-[0.11em] text-foreground/70 backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-secondary" />
              plus large, plus clair, plus premium
            </div>
          </div>

          <div className="space-y-4">
            <h1 className="mx-auto max-w-3xl font-display text-4xl uppercase leading-[0.92] tracking-tight text-secondary sm:text-5xl lg:mx-0 lg:max-w-[12ch] lg:text-6xl xl:text-[4.5rem]">
              {title}
            </h1>
            <p className="mx-auto max-w-2xl text-base leading-relaxed text-foreground/78 sm:text-lg lg:mx-0">
              {subtitle}
            </p>
          </div>

          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
            <Button asChild size="lg" className="h-12 w-full px-8 sm:w-auto">
              <Link href={primaryCta.href}>
                {primaryCta.label}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-12 w-full px-8 sm:w-auto">
              <Link href={secondaryCta.href}>{secondaryCta.label}</Link>
            </Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-line bg-white/80 px-4 py-3 text-left shadow-[0_10px_30px_rgba(18,37,72,0.08)] backdrop-blur"
              >
                <p className="text-[10px] uppercase tracking-[0.12em] text-foreground/55">
                  {stat.label}
                </p>
                <p className="mt-1 font-display text-2xl uppercase leading-none text-secondary">
                  {stat.value}
                </p>
                {stat.helper ? (
                  <p className="mt-1 text-xs uppercase tracking-[0.08em] text-foreground/55">
                    {stat.helper}
                  </p>
                ) : null}
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-foreground/70 lg:justify-start">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white/75 px-3 py-1.5">
              <BadgeCheck className="h-4 w-4 text-mint" />
              <span>Un seul visuel principal</span>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white/75 px-3 py-1.5">
              <Clock3 className="h-4 w-4 text-secondary" />
              <span>Lecture claire sur mobile</span>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white/75 px-3 py-1.5">
              <ShieldCheck className="h-4 w-4 text-secondary" />
              <span>Plus de hiérarchie, moins de bruit</span>
            </div>
          </div>
        </div>

        <div className="order-1 lg:order-2">
          <div className="relative mx-auto w-full max-w-[920px]">
            <div className="absolute -inset-5 rounded-[2.25rem] bg-secondary/10 blur-3xl" />
            <div className="relative overflow-hidden rounded-[2rem] border-2 border-foreground bg-white shadow-[0_18px_0_0_hsl(var(--foreground)/0.12)]">
              <div className="relative aspect-[4/3] min-h-[440px] lg:aspect-[5/4] lg:min-h-[620px]">
                <Image
                  src={imageSrc}
                  alt={imageAlt}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 920px"
                  className="object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-secondary/55 via-secondary/10 to-transparent" />
                <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full border border-white/35 bg-white/20 px-3 py-1.5 text-[10px] uppercase tracking-[0.12em] text-white backdrop-blur">
                  <div className="h-2 w-2 rounded-full bg-mint shadow-[0_0_0_4px_rgba(111,224,171,0.18)]" />
                  image unique
                </div>
                <div className="absolute inset-x-4 bottom-4 rounded-[1.25rem] border border-white/20 bg-white/14 p-3 text-white backdrop-blur-md sm:inset-x-5 sm:bottom-5 sm:p-4">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-xl border border-white/15 bg-white/10 px-3 py-2">
                      <p className="text-[10px] uppercase tracking-[0.12em] text-white/65">Rythme</p>
                      <p className="mt-1 font-display text-2xl uppercase leading-none">Libre</p>
                    </div>
                    <div className="rounded-xl border border-white/15 bg-white/10 px-3 py-2">
                      <p className="text-[10px] uppercase tracking-[0.12em] text-white/65">Validation</p>
                      <p className="mt-1 font-display text-2xl uppercase leading-none">48h</p>
                    </div>
                    <div className="rounded-xl border border-white/15 bg-white/10 px-3 py-2">
                      <p className="text-[10px] uppercase tracking-[0.12em] text-white/65">Paiement</p>
                      <p className="mt-1 font-display text-2xl uppercase leading-none">Mensuel</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-line bg-white px-4 py-4 sm:px-5 sm:py-5">
                <div className="grid gap-3 sm:grid-cols-3">
                  {stats.map((stat) => (
                    <div
                      key={`footer-${stat.label}`}
                      className="rounded-xl border border-line bg-frost/70 px-3 py-2.5"
                    >
                      <p className="text-[10px] uppercase tracking-[0.12em] text-foreground/55">
                        {stat.label}
                      </p>
                      <p className="mt-1 font-display text-xl uppercase leading-none text-secondary">
                        {stat.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

