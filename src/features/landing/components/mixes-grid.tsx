import { Card } from "@/components/ui/card";

interface MixesGridProps {
  mixes: Array<{
    name: string;
    positioning: string;
    distributionPercentages: Record<string, number>;
  }>;
}

export function MixesGrid({ mixes }: MixesGridProps) {
  return (
    <section className="space-y-4">
      <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-foreground/60">Styles de contenu</h3>
      <div className="grid gap-3 lg:grid-cols-2">
        {mixes.map((mix) => (
          <Card key={mix.name} className="space-y-4 bg-white p-5 sm:p-6">
            <div>
              <p className="font-display text-3xl uppercase">{mix.name}</p>
              <p className="text-sm text-foreground/65">{mix.positioning}</p>
            </div>
            <div className="space-y-3">
              {Object.entries(mix.distributionPercentages).map(([type, value]) => (
                <div key={type} className="rounded-xl border border-line/70 bg-frost/70 px-3 py-2.5">
                  <div className="mb-1 flex items-center justify-between text-[11px] uppercase tracking-[0.12em] text-foreground/60">
                    <span>{type}</span>
                    <span className="font-semibold text-foreground">{value}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white">
                    <div className="h-full rounded-full bg-secondary" style={{ width: `${value}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-foreground/60">Mix ajustable avec l&apos;equipe selon tes points forts.</p>
          </Card>
        ))}
      </div>
    </section>
  );
}
