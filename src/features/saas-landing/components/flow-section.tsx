import { Card, CardContent } from "@/components/ui/card";

interface FlowSectionProps {
  items: Array<{ title: string; description: string }>;
}

export function FlowSection({ items }: FlowSectionProps) {
  return (
    <section className="space-y-10 animate-fade-up [animation-delay:160ms]">
      <div className="text-center">
        <h2 className="font-display text-4xl uppercase tracking-tight text-secondary sm:text-5xl">
          Comment ca marche
        </h2>
        <p className="mt-2 text-foreground/70">Un flow clair du premier contact au paiement.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {items.map((item, index) => (
          <Card
            key={item.title}
            className={`relative border-line bg-white ${index === 1 ? "md:-translate-y-2" : ""}`}
          >
            <CardContent className="space-y-4 p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full border border-foreground bg-primary text-lg font-bold text-foreground">
                  {index + 1}
                </div>
                <h3 className="font-display text-3xl uppercase leading-none text-secondary">{item.title}</h3>
              </div>

              <p className="text-sm leading-relaxed text-foreground/75">{item.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
