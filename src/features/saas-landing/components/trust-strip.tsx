import { Card, CardContent } from "@/components/ui/card";

interface TrustStripProps {
  points: Array<{ label: string; value: string }>;
}

export function TrustStrip({ points }: TrustStripProps) {
  return (
    <section className="animate-fade-up [animation-delay:80ms]">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {points.map((point, index) => (
          <Card
            key={point.label}
            className={`border-line ${index % 2 === 0 ? "bg-white" : "bg-frost"}`}
          >
            <CardContent className="flex flex-col items-center justify-center p-5 text-center">
              <p className="font-display text-4xl uppercase tracking-tight text-secondary">
                {point.value}
              </p>
              <p className="mt-2 text-xs font-medium uppercase tracking-[0.12em] text-foreground/65">
                {point.label}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
