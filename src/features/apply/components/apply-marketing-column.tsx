import Image from "next/image";

import { Card } from "@/components/ui/card";
import type { ApplyMarketingData } from "@/features/apply/types";

interface ApplyMarketingColumnProps {
  data: ApplyMarketingData;
  authenticated: boolean;
}

export function ApplyMarketingColumn({ data, authenticated }: ApplyMarketingColumnProps) {
  return (
    <section className="space-y-4">
      <section className="relative overflow-hidden rounded-[28px] border border-line bg-secondary p-5 text-white shadow-panel sm:p-6 md:p-7">
        {data.heroImageUrl ? (
          <div className="relative mb-5 h-40 overflow-hidden rounded-2xl border border-white/20 sm:h-48">
            <Image
              src={data.heroImageUrl}
              alt="RetroMuscle creator program"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 420px"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-secondary/65 via-secondary/20 to-transparent" />
          </div>
        ) : null}

        <p className="inline-flex rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.14em] text-white/85">
          {data.attention.badge}
        </p>
        <h1 className="mt-3 font-display text-4xl uppercase leading-[0.92] sm:text-5xl">{data.attention.headline}</h1>
        <p className="mt-2 text-sm text-white/80">{data.attention.supportingText}</p>

        <div className="mt-4 grid grid-cols-3 gap-2 sm:max-w-lg">
          {data.socialProof.stats.map((stat) => (
            <div key={stat.label} className="rounded-xl border border-white/20 bg-white/10 px-2 py-2 text-center backdrop-blur">
              <p className="font-display text-3xl uppercase leading-none">{stat.value}</p>
              <p className="text-[10px] uppercase tracking-[0.1em] text-white/65">{stat.label}</p>
            </div>
          ))}
        </div>

        <p className="mt-4 text-xs uppercase tracking-[0.13em] text-white/70">
          {authenticated ? "Tu es connecte. Finalise ton onboarding." : "Inscription rapide par email + mot de passe"}
        </p>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-5">
          <p className="text-xs uppercase tracking-[0.12em] text-foreground/55">Ce que tu gagnes</p>
          <ul className="mt-3 space-y-2 text-sm text-foreground/80">
            {data.interestPoints.map((point) => (
              <li key={point} className="flex gap-2">
                <span className="mt-0.5 text-secondary">✓</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="space-y-3 p-5 md:col-span-1">
          <p className="text-xs uppercase tracking-[0.12em] text-foreground/55">Temoignages</p>
          <div className="space-y-2">
            {data.socialProof.creators.map((creator) => (
              <div key={creator.name} className="rounded-xl border border-line/70 bg-white/90 px-3 py-2">
                <p className="text-sm font-semibold">{creator.name}</p>
                <p className="text-[11px] uppercase tracking-[0.1em] text-foreground/55">{creator.niche}</p>
                <p className="mt-1 text-sm text-foreground/75">&ldquo;{creator.quote}&rdquo;</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <p className="text-xs uppercase tracking-[0.12em] text-foreground/55">Pourquoi agir maintenant</p>
          <p className="mt-2 font-semibold text-foreground">{data.desire.title}</p>
          <ul className="mt-2 space-y-1 text-sm text-foreground/75">
            {data.desire.bullets.map((bullet) => (
              <li key={bullet}>- {bullet}</li>
            ))}
          </ul>
          <p className="mt-3 text-sm font-semibold text-secondary">{data.action.urgencyText}</p>
          <p className="text-xs text-foreground/70">{data.action.reassurance}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {data.socialProof.trustedBy.map((brand) => (
              <span
                key={brand}
                className="rounded-full border border-line bg-frost px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.11em] text-foreground/65"
              >
                {brand}
              </span>
            ))}
          </div>
        </Card>
      </div>
    </section>
  );
}
