"use client";

import { useState } from "react";

interface MarqueeCreator {
  name: string;
  niche: string;
  quote: string;
}

interface MarqueeWithPauseProps {
  creators: MarqueeCreator[];
}

export function MarqueeWithPause({ creators }: MarqueeWithPauseProps) {
  const [paused, setPaused] = useState(false);
  const marqueeItems = [...creators, ...creators];

  return (
    <div className="mask-fade-y h-full pb-12 pt-24">
      <button
        type="button"
        aria-label={paused ? "Reprendre le défilement" : "Mettre en pause le défilement"}
        onClick={() => setPaused((p) => !p)}
        className="absolute right-3 top-3 z-20 rounded-full border border-line/60 bg-white/80 p-1.5 text-foreground/75 backdrop-blur-sm transition-colors hover:bg-white hover:text-foreground/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-secondary"
      >
        {paused ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M8 5v14l11-7z" />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
          </svg>
        )}
      </button>

      <div
        className="animate-marquee-vertical flex flex-col gap-3 px-3 sm:gap-4 sm:px-4"
        style={{ animationPlayState: paused ? "paused" : "running" }}
      >
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
              <span className="text-[9px] text-foreground/60 sm:text-[10px]">•</span>
              <span className="text-[9px] font-medium text-foreground/75 sm:text-[10px]">
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
  );
}
