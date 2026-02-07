import { CheckCircle2, XCircle } from "lucide-react";

import { CardSection } from "@/components/layout/card-section";

interface QualifierSectionProps {
  title: string;
  subtitle: string;
  forWho: string[];
  notForWho: string[];
}

export function QualifierSection({ title, subtitle, forWho, notForWho }: QualifierSectionProps) {
  return (
    <section className="space-y-10 animate-fade-up [animation-delay:240ms]">
      <div className="space-y-4 text-center">
        <h2 className="font-display text-4xl uppercase tracking-tight text-secondary sm:text-5xl">
          {title}
        </h2>
        <p className="mx-auto max-w-2xl text-foreground/70">{subtitle}</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <CardSection className="relative overflow-hidden">
          <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-mint/15 blur-3xl" />
          <p className="relative text-xs uppercase tracking-[0.12em] text-foreground/55">Pour toi si</p>
          <ul className="relative mt-4 space-y-3 text-sm text-foreground/80">
            {forWho.map((item) => (
              <li key={item} className="flex gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-mint" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </CardSection>

        <CardSection tone="frost" className="relative overflow-hidden">
          <div className="absolute -left-20 -top-24 h-56 w-56 rounded-full bg-destructive/10 blur-3xl" />
          <p className="relative text-xs uppercase tracking-[0.12em] text-foreground/55">Pas ideal si</p>
          <ul className="relative mt-4 space-y-3 text-sm text-foreground/80">
            {notForWho.map((item) => (
              <li key={item} className="flex gap-2">
                <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive/70" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </CardSection>
      </div>
    </section>
  );
}

