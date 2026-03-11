import Image from "next/image";
import { CheckCircle2, XCircle } from "lucide-react";
import type { QualifierData } from "@/application/use-cases/get-saas-landing-data";

interface QualifierSectionProps {
  qualifier: QualifierData;
}

export function QualifierSection({ qualifier }: QualifierSectionProps) {
  return (
    <section className="animate-fade-up">
      <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-16">
        {/* Image */}
        <div className="relative overflow-hidden rounded-[1.5rem] border-2 border-foreground shadow-xl">
          <div className="relative aspect-[4/3]">
            <Image
              src={qualifier.imageUrl}
              alt={qualifier.imageAlt}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
        </div>

        {/* For who / Not for who */}
        <div className="space-y-8">
          <h2 className="font-display text-4xl uppercase tracking-tight text-secondary sm:text-5xl">
            {qualifier.sectionTitle}
          </h2>

          {/* For who */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-mint">
              {qualifier.forWhoLabel}
            </p>
            <ul className="space-y-2.5">
              {qualifier.forWho.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-foreground/80">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-mint" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Divider */}
          <div className="h-px bg-foreground/10" />

          {/* Not for who */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-destructive/70">
              {qualifier.notForWhoLabel}
            </p>
            <ul className="space-y-2.5">
              {qualifier.notForWho.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-foreground/60">
                  <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive/50" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
