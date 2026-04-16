import { Card } from "@/components/ui/card";
import type { ApplyMarketingData } from "@/application/use-cases/get-apply-page-data";
import { MarqueeWithPause } from "@/features/apply/components/marquee-with-pause";

interface ApplyMarketingColumnProps {
  data: ApplyMarketingData;
  authenticated: boolean;
}

export function ApplyMarketingColumn({ data, authenticated }: ApplyMarketingColumnProps) {
  const hasCreators = data.socialProof.creators.length > 0;

  return (
    <div className="flex flex-col gap-6 lg:sticky lg:top-24 lg:h-[calc(100vh-160px)]">
      <div className="relative h-[380px] overflow-hidden rounded-[2rem] border border-line bg-white/40 lg:flex-1 lg:h-auto">
        <div className="absolute inset-x-0 top-4 z-10 text-center sm:top-6">
          <span className="rounded-full border border-line bg-white/80 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.15em] text-foreground/75 backdrop-blur-sm sm:text-[10px]">
            Programme cr&eacute;ateur
          </span>
          <p className="mt-2 text-[11px] text-foreground/65">
            {authenticated
              ? "Tu peux continuer ton dossier, on garde le reste simple."
              : "Rejoins le programme et commence \u00e0 cr\u00e9er du contenu r\u00e9mun\u00e9r\u00e9."}
          </p>
        </div>

        {hasCreators ? (
          <MarqueeWithPause creators={data.socialProof.creators} />
        ) : (
          <div className="flex h-full items-center justify-center px-6 pt-16">
            <div className="text-center">
              <p className="font-display text-xl uppercase text-foreground/25">
                Retours cr&eacute;ateurs
              </p>
              <p className="mt-2 text-xs text-foreground/60">
                Les retours de nos cr&eacute;ateurs seront affich&eacute;s ici prochainement.
              </p>
            </div>
          </div>
        )}
      </div>

      <Card className="border-line bg-white/70 p-4 text-sm text-foreground/75">
        <p className="text-xs uppercase tracking-[0.12em] text-foreground/70">Ce que tu gagnes</p>
        <ul className="mt-3 space-y-1">
          {data.desire.bullets.slice(0, 3).map((bullet) => (
            <li key={bullet}>- {bullet}</li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
