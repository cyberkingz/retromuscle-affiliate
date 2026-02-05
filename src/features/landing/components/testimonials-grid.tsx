import { Card } from "@/components/ui/card";
import { Quote } from "lucide-react";

interface TestimonialsGridProps {
  items: Array<{ author: string; role: string; quote: string }>;
}

export function TestimonialsGrid({ items }: TestimonialsGridProps) {
  return (
    <section className="space-y-4">
      <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-foreground/60">Temoignages affilies</h3>
      <div className="grid gap-3 md:grid-cols-2">
        {items.map((item) => (
          <Card key={item.author} className="space-y-3 bg-white p-5">
            <Quote className="h-5 w-5 text-primary/70" />
            <p className="text-sm leading-6 text-foreground/80">&ldquo;{item.quote}&rdquo;</p>
            <div className="text-xs uppercase tracking-[0.12em] text-foreground/55">
              {item.author} - {item.role}
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
