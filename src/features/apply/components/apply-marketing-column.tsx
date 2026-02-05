import Image from "next/image";

import { Card } from "@/components/ui/card";
import type { ApplyMarketingData } from "@/features/apply/types";

interface ApplyMarketingColumnProps {
  data: ApplyMarketingData;
  authenticated: boolean;
}

export function ApplyMarketingColumn({ data, authenticated }: ApplyMarketingColumnProps) {
  // Duplicate creators to ensure seamless marquee
  const marqueeItems = [...data.socialProof.creators, ...data.socialProof.creators, ...data.socialProof.creators];

  return (
    <div className="flex h-full flex-col gap-6 lg:sticky lg:top-24 lg:h-[calc(100vh-160px)]">
      {/* Testimonials Marquee Section */}
      <div className="relative flex-1 overflow-hidden rounded-[2rem] border border-line bg-white/40 min-h-[400px]">
        <div className="absolute inset-x-0 top-6 z-10 text-center">
          <span className="rounded-full border border-line bg-white/80 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-foreground/50 backdrop-blur-sm">
            Avis des affilies
          </span>
        </div>

        <div className="mask-fade-y h-full py-12">
          <div className="animate-marquee-vertical flex flex-col gap-4 px-4">
            {marqueeItems.map((creator, idx) => (
              <div
                key={`${creator.name}-${idx}`}
                className="rounded-2xl border border-line/60 bg-white/95 p-4 shadow-sm"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-6 w-6 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-[10px] font-bold">
                    {creator.name[0]}
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wider">{creator.name}</span>
                  <span className="text-[10px] text-foreground/40">•</span>
                  <span className="text-[10px] font-medium text-foreground/50">{creator.niche}</span>
                </div>
                <p className="text-xs italic leading-relaxed text-foreground/80">
                  &ldquo;{creator.quote}&rdquo;
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
