import { Quote } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface SocialProofWallProps {
  testimonials: Array<{ name: string; role: string; quote: string }>;
  trustedBy: string[];
}

export function SocialProofWall({ testimonials, trustedBy }: SocialProofWallProps) {
  if (testimonials.length === 0 && trustedBy.length === 0) return null;

  return (
    <section className="space-y-12 animate-fade-up [animation-delay:200ms]">
      <div className="text-center space-y-4">
        <Badge variant="outline" className="bg-white/70 text-foreground/70">
          Preuve sociale
        </Badge>
        <h2 className="font-display text-4xl uppercase tracking-tight text-secondary sm:text-5xl">
          Retours createurs
        </h2>
        <p className="mx-auto max-w-2xl text-sm text-foreground/70">
          Les retours de nos createurs seront affiches ici au fur et a mesure du programme.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {testimonials.map((item, index) => (
          <Card
            key={item.name}
            className={`border-line transition-colors ${
              index === 1 ? "bg-white" : "bg-frost/90"
            }`}
          >
            <CardContent className="p-6 space-y-4">
              <Quote className="h-8 w-8 text-primary/50" />
              <p className="italic leading-relaxed text-foreground/75">
                &quot;{item.quote}&quot;
              </p>

              <div className="flex items-center gap-3 border-t border-line/70 pt-4">
                <div className="h-10 w-10 rounded-full border border-foreground bg-primary/35" />
                <div>
                  <p className="text-sm font-semibold leading-none">{item.name}</p>
                  <p className="mt-1 text-xs text-foreground/60">{item.role}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {trustedBy.length > 0 ? (
        <div className="rounded-3xl border border-line bg-white/70 px-4 py-8 sm:px-6">
          <p className="mb-6 text-center text-[10px] uppercase tracking-[0.14em] text-foreground/55 sm:text-xs">
            Accompagne par
          </p>
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
            {trustedBy.map((brand) => (
              <span
                key={brand}
                className="whitespace-nowrap rounded-full border border-line bg-frost px-3 py-1.5 text-xs font-semibold text-secondary sm:px-4 sm:py-2 sm:text-sm"
              >
                {brand}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
