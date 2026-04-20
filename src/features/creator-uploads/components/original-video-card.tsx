"use client";

import { Film } from "lucide-react";
import { CardSection } from "@/components/layout/card-section";
import { toShortDate } from "@/lib/date";

interface OriginalVideoCardProps {
  signedUrl: string | null;
  videoTypeLabel: string;
  durationSeconds: number;
  resolution: string;
  fileSizeMb: number;
  createdAt: string;
}

export function OriginalVideoCard({
  signedUrl,
  videoTypeLabel,
  durationSeconds,
  resolution,
  fileSizeMb,
  createdAt
}: OriginalVideoCardProps) {
  return (
    <CardSection padding="sm" className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-foreground/55">
        Vidéo originale
      </p>

      {/* Video player or fallback thumbnail */}
      <div className="overflow-hidden rounded-xl bg-foreground/8 aspect-[9/16] max-h-[360px] w-full relative">
        {signedUrl ? (
          <video
            src={signedUrl}
            controls
            playsInline
            preload="metadata"
            className="h-full w-full object-contain"
            aria-label={`Vidéo originale — ${videoTypeLabel}`}
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-foreground/30">
            <Film className="h-10 w-10" aria-hidden />
            <span className="text-xs">Aperçu indisponible</span>
          </div>
        )}
      </div>

      {/* Metadata strip */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-foreground/60">
        <span>{videoTypeLabel}</span>
        <span>{durationSeconds}s</span>
        <span>{resolution}</span>
        <span>{fileSizeMb} MB</span>
        <span>Uploadée le {toShortDate(createdAt)}</span>
      </div>
    </CardSection>
  );
}
