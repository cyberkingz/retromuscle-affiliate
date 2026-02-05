import { Quote } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface SocialProofWallProps {
  testimonials: Array<{ name: string; role: string; quote: string }>;
  trustedBy: string[];
}

export function SocialProofWall({ testimonials, trustedBy }: SocialProofWallProps) {
  return (
    <section className="space-y-12 animate-fade-up [animation-delay:200ms]">
      <div className="text-center space-y-4">
        <Badge variant="outline" className="bg-white/70 text-foreground/70">
          Preuve sociale
        </Badge>
        <h2 className="font-display text-4xl uppercase tracking-tight text-secondary sm:text-5xl">
          Des createurs qui avancent
        </h2>
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

      <div className="rounded-3xl border border-line bg-white/70 px-6 py-8">
        <p className="mb-6 text-center text-xs uppercase tracking-[0.14em] text-foreground/55">
          Accompagne par
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          {trustedBy.map((brand) => (
            <span
              key={brand}
              className="rounded-full border border-line bg-frost px-4 py-2 text-sm font-semibold text-secondary"
            >
              {brand}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
