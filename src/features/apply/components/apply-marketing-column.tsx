import Image from "next/image";

import { Card } from "@/components/ui/card";
import type { ApplyMarketingData } from "@/features/apply/types";

interface ApplyMarketingColumnProps {
  data: ApplyMarketingData;
  authenticated: boolean;
}

export function ApplyMarketingColumn({ data, authenticated }: ApplyMarketingColumnProps) {

  // Use exactly two sets for a perfect -50% loop

  const marqueeItems = [...data.socialProof.creators, ...data.socialProof.creators];



  return (

    <div className="flex flex-col gap-6 lg:sticky lg:top-24 lg:h-[calc(100vh-160px)]">

      {/* Testimonials Marquee Section */}

      <div className="relative overflow-hidden rounded-[2rem] border border-line bg-white/40 h-[380px] lg:flex-1 lg:h-auto">

        <div className="absolute inset-x-0 top-4 z-10 text-center sm:top-6">


              <span className="rounded-full border border-line bg-white/80 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.15em] text-foreground/50 backdrop-blur-sm sm:text-[10px]">
                Avis des affilies
              </span>
            </div>
    
            <div className="mask-fade-y h-full py-10 sm:py-12">
              <div className="animate-marquee-vertical flex flex-col gap-3 px-3 sm:gap-4 sm:px-4">
                {marqueeItems.map((creator, idx) => (
                  <div
                    key={`${creator.name}-${idx}`}
                    className="rounded-xl border border-line/60 bg-white/95 p-3 shadow-sm sm:rounded-2xl sm:p-4"
                  >
                    <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
                      <div className="h-5 w-5 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-[9px] font-bold sm:h-6 sm:w-6 sm:text-[10px]">
                        {creator.name[0]}
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider sm:text-[11px]">{creator.name}</span>
                      <span className="text-[9px] text-foreground/40 sm:text-[10px]">•</span>
                      <span className="text-[9px] font-medium text-foreground/50 sm:text-[10px]">{creator.niche}</span>
                    </div>
                    <p className="text-[11px] italic leading-relaxed text-foreground/80 sm:text-xs">
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
