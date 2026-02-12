import { Card } from "@/components/ui/card";
import type { ApplyMarketingData } from "@/features/apply/types";

interface ApplyMarketingColumnProps {
  data: ApplyMarketingData;
  authenticated: boolean;
}

export function ApplyMarketingColumn({ data, authenticated }: ApplyMarketingColumnProps) {
  const hasCreators = data.socialProof.creators.length > 0;
  const marqueeItems = hasCreators ? [...data.socialProof.creators, ...data.socialProof.creators] : [];

  return (
    <div className="flex flex-col gap-6 lg:sticky lg:top-24 lg:h-[calc(100vh-160px)]">
      <div className="relative h-[380px] overflow-hidden rounded-[2rem] border border-line bg-white/40 lg:flex-1 lg:h-auto">
        <div className="absolute inset-x-0 top-4 z-10 text-center sm:top-6">
          <span className="rounded-full border border-line bg-white/80 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.15em] text-foreground/50 backdrop-blur-sm sm:text-[10px]">
            Programme affilie
          </span>
          <p className="mt-2 text-[11px] text-foreground/65">
            {authenticated
              ? "Tu peux continuer ton dossier, on garde le reste simple."
              : "Rejoins le programme et commence a creer du contenu remunere."}
          </p>
        </div>

        {hasCreators ? (
          <div className="mask-fade-y h-full py-12">
            <div className="animate-marquee-vertical flex flex-col gap-3 px-3 sm:gap-4 sm:px-4">
              {marqueeItems.map((creator, idx) => (
                <div
                  key={`${creator.name}-${idx}`}
                  className="rounded-xl border border-line/60 bg-white/95 p-3 shadow-sm sm:rounded-2xl sm:p-4"
                >
                  <div className="mb-1.5 flex items-center gap-2 sm:mb-2">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full border border-primary/30 bg-primary/20 text-[9px] font-bold sm:h-6 sm:w-6 sm:text-[10px]">
                      {creator.name[0]}
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider sm:text-[11px]">
                      {creator.name}
                    </span>
                    <span className="text-[9px] text-foreground/40 sm:text-[10px]">•</span>
                    <span className="text-[9px] font-medium text-foreground/50 sm:text-[10px]">
                      {creator.niche}
                    </span>
                  </div>
                  <p className="text-[11px] italic leading-relaxed text-foreground/80 sm:text-xs">
                    &ldquo;{creator.quote}&rdquo;
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center px-6 pt-16">
            <div className="text-center">
              <p className="font-display text-xl uppercase text-foreground/25">Retours createurs</p>
              <p className="mt-2 text-xs text-foreground/40">
                Les retours de nos createurs seront affiches ici prochainement.
              </p>
            </div>
          </div>
        )}
      </div>

      <Card className="border-line bg-white/70 p-4 text-sm text-foreground/75">
        <p className="text-xs uppercase tracking-[0.12em] text-foreground/55">Ce que tu gagnes</p>
        <ul className="mt-3 space-y-1">
          {data.desire.bullets.slice(0, 3).map((bullet) => (
            <li key={bullet}>- {bullet}</li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
