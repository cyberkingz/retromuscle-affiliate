import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ActionBandProps {
  title: string;
  subtitle: string;
  cta: { label: string; href: "/apply" };
}

export function ActionBand({ title, subtitle, cta }: ActionBandProps) {
  return (
    <section className="animate-fade-up [animation-delay:320ms]">
      <div className="relative overflow-hidden rounded-[2rem] border border-line bg-secondary px-6 py-12 text-secondary-foreground shadow-2xl md:px-12 md:py-16">
        <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center gap-8 text-center">
          <div className="space-y-4">
            <h2 className="font-display text-4xl uppercase tracking-tight sm:text-5xl md:text-6xl">
              {title}
            </h2>
            <p className="text-lg text-secondary-foreground/85 md:text-xl">
              {subtitle}
            </p>
          </div>

          <Button asChild size="lg" className="h-12 px-8 text-base font-semibold">
            <Link href={cta.href}>
              {cta.label}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_46%)]" />
      </div>
    </section>
  );
}
