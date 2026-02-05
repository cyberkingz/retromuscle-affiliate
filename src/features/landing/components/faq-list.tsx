import { Card } from "@/components/ui/card";
import { Plus } from "lucide-react";

interface FaqListProps {
  items: Array<{ question: string; answer: string }>;
}

export function FaqList({ items }: FaqListProps) {
  return (
    <section className="space-y-4">
      <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-foreground/60">Questions frequentes</h3>
      <div className="space-y-3">
        {items.map((item) => (
          <Card key={item.question} className="overflow-hidden bg-white">
            <details className="group">
              <summary className="flex cursor-pointer items-center justify-between gap-3 px-5 py-4 text-left text-sm font-semibold hover:bg-frost/70">
                <span>{item.question}</span>
                <Plus className="h-4 w-4 text-foreground/55 transition-transform duration-200 group-open:rotate-45" />
              </summary>
              <p className="px-5 pb-5 text-sm text-foreground/70">{item.answer}</p>
            </details>
          </Card>
        ))}
      </div>
    </section>
  );
}
