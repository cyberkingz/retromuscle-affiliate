import { ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface PainValueGridProps {
  items: Array<{ pain: string; value: string }>;
}

export function PainValueGrid({ items }: PainValueGridProps) {
  return (
    <section className="space-y-8 animate-fade-up [animation-delay:120ms]">
      <div className="flex flex-col items-center justify-center text-center space-y-2">
        <Badge variant="outline" className="bg-white/70 text-foreground/70">
          Avant / Apres
        </Badge>
        <h2 className="font-display text-4xl uppercase tracking-tight text-secondary sm:text-5xl">
          De la friction au systeme
        </h2>
      </div>

      <div className="grid gap-4 md:grid-cols-1">
        {items.map((item, index) => (
          <Card key={index} className="overflow-hidden border-line bg-white/90">
            <CardContent className="grid gap-4 p-0 sm:grid-cols-[1fr_auto_1fr] sm:items-stretch">
              <div className="space-y-2 bg-frost px-5 py-5">
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-foreground/55">Probleme</span>
                <p className="text-lg text-foreground/70 leading-snug">{item.pain}</p>
              </div>

              <div className="flex items-center justify-center px-1">
                <div className="rounded-full border border-line bg-primary/20 p-2 text-secondary">
                  <ArrowRight className="h-6 w-6" />
                </div>
              </div>

              <div className="space-y-2 bg-white px-5 py-5 sm:text-right">
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">Resultat</span>
                <p className="text-lg font-medium text-secondary leading-snug">{item.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
