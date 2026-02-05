import { Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface FaqGridProps {
  items: Array<{ question: string; answer: string }>;
}

export function FaqGrid({ items }: FaqGridProps) {
  return (
    <section className="max-w-3xl mx-auto space-y-8 animate-fade-up [animation-delay:300ms]">
      <div className="text-center">
        <h2 className="font-display text-4xl uppercase tracking-tight text-secondary sm:text-5xl">FAQ</h2>
        <p className="mt-2 text-foreground/70">Questions frequentes sur le programme.</p>
      </div>

      <div className="space-y-4">
        {items.map((item) => (
          <Card key={item.question} className="overflow-hidden border-line bg-white/90">
            <details className="group">
              <summary className="flex cursor-pointer items-center justify-between p-6 font-medium transition-colors hover:bg-frost/80 focus-visible:bg-frost/80 focus-visible:outline-none">
                <span>{item.question}</span>
                <Plus className="h-4 w-4 text-foreground/60 transition-transform duration-200 group-open:rotate-45" />
              </summary>
              <div className="animate-accordion-down px-6 pb-6 pt-0 text-foreground/70">
                <p>{item.answer}</p>
              </div>
            </details>
          </Card>
        ))}
      </div>
    </section>
  );
}
