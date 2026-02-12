"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Loader2,
  RefreshCw,
} from "lucide-react";

import type { UseVideoPreviewReturn } from "@/hooks/use-video-preview";
import { StatusBadge } from "@/components/ui/status-badge";
import { videoStatusTone } from "@/lib/status-tone";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/cn";

interface VideoPreviewModalProps {
  preview: UseVideoPreviewReturn;
  title?: string;
}

export function VideoPreviewModal({
  preview,
  title = "Preview",
}: VideoPreviewModalProps) {
  const {
    isOpen,
    signedUrl,
    loading,
    error,
    currentItem,
    currentIndex,
    totalItems,
    hasNext,
    hasPrev,
    close,
    next,
    prev,
    open,
  } = preview;

  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoReady, setVideoReady] = useState(false);

  const isGallery = totalItems > 1;

  // Reset video ready state when URL changes
  useEffect(() => {
    setVideoReady(false);
  }, [signedUrl]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowLeft" && isGallery) {
        event.preventDefault();
        prev();
      } else if (event.key === "ArrowRight" && isGallery) {
        event.preventDefault();
        next();
      } else if (event.key === " ") {
        const video = videoRef.current;
        if (!video) return;
        event.preventDefault();
        if (video.paused) {
          void video.play();
        } else {
          video.pause();
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isGallery, next, prev]);

  const handleRetry = useCallback(() => {
    if (!currentItem) return;
    open(currentItem);
  }, [currentItem, open]);

  // Build metadata parts (videoType excluded — shown as badge already)
  const metaParts: string[] = [];
  if (currentItem?.resolution) metaParts.push(currentItem.resolution);
  if (currentItem?.durationSeconds != null)
    metaParts.push(`${currentItem.durationSeconds}s`);
  if (currentItem?.fileSizeMb != null)
    metaParts.push(`${currentItem.fileSizeMb} MB`);

  // Download filename
  const downloadName =
    currentItem?.fileName ??
    `video-${currentItem?.id ?? "preview"}.mp4`;

  return (
    <Dialog open={isOpen} onOpenChange={(o) => { if (!o) close(); }}>
      <DialogContent
        className={cn(
          "max-h-[95vh] overflow-hidden border-none bg-black p-0",
          "max-w-[min(95vw,900px)]",
          "rounded-2xl shadow-2xl"
        )}
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        {/* Visually hidden title for accessibility */}
        <DialogTitle className="sr-only">{title}</DialogTitle>

        {/* Glass header */}
        <div className="absolute left-0 right-0 top-0 z-20 flex items-center gap-3 bg-black/60 px-4 py-3 backdrop-blur-md">
          {currentItem?.status && (
            <StatusBadge
              label={currentItem.status}
              tone={videoStatusTone(currentItem.status)}
            />
          )}
          {currentItem?.videoType && (
            <span className="rounded-md bg-white/10 px-2 py-0.5 text-xs font-semibold uppercase tracking-wider text-white/80">
              {currentItem.videoType}
            </span>
          )}
          {metaParts.length > 0 && (
            <span className="text-xs text-white/60">
              {metaParts.join(" \u00B7 ")}
            </span>
          )}
        </div>

        {/* Video area */}
        <div className="relative flex min-h-[350px] items-center justify-center bg-black">
          {/* Loading skeleton */}
          {loading && (
            <div className="flex flex-col items-center justify-center gap-3 py-20">
              <Loader2 className="h-10 w-10 animate-spin text-white/50" />
              <span className="text-sm text-white/40">Chargement...</span>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="flex flex-col items-center justify-center gap-4 px-6 py-20">
              <p className="text-sm text-red-400">{error}</p>
              <button
                type="button"
                onClick={handleRetry}
                className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm text-white transition-colors hover:bg-white/20"
              >
                <RefreshCw className="h-4 w-4" />
                Reessayer
              </button>
            </div>
          )}

          {/* Video player */}
          {signedUrl && !loading && !error && (
            <>
              {/* Skeleton pulse while video loads */}
              {!videoReady && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-full w-full animate-pulse bg-white/5" />
                  <Loader2 className="absolute h-8 w-8 animate-spin text-white/40" />
                </div>
              )}
              <video
                ref={videoRef}
                key={signedUrl}
                src={signedUrl}
                controls
                autoPlay
                playsInline
                onCanPlay={() => setVideoReady(true)}
                className={cn(
                  "max-h-[75vh] w-full object-contain pt-12 pb-24",
                  !videoReady && "invisible"
                )}
              />
            </>
          )}

          {/* Nav arrows */}
          {isGallery && hasPrev && (
            <button
              type="button"
              onClick={prev}
              className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/60 p-2.5 text-white/80 backdrop-blur transition-colors hover:bg-white/20 hover:text-white"
              aria-label="Video precedente"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}

          {isGallery && hasNext && (
            <button
              type="button"
              onClick={next}
              className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/60 p-2.5 text-white/80 backdrop-blur transition-colors hover:bg-white/20 hover:text-white"
              aria-label="Video suivante"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          )}
        </div>

        {/* Glass toolbar */}
        <div className="absolute bottom-0 left-0 right-0 z-20 flex items-center justify-between gap-3 bg-black/60 px-4 py-3 backdrop-blur-md">
          {/* Left: action buttons */}
          <div className="flex items-center gap-2">
            {signedUrl && (
              <>
                <a
                  href={signedUrl}
                  download={downloadName}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  <Download className="h-4 w-4" />
                  Telecharger
                  {currentItem?.fileSizeMb != null && (
                    <span className="text-primary-foreground/70">
                      ({currentItem.fileSizeMb} MB)
                    </span>
                  )}
                </a>
              </>
            )}
          </div>

          {/* Center: gallery dots */}
          {isGallery && totalItems <= 12 && (
            <div className="hidden items-center gap-1.5 sm:flex">
              {Array.from({ length: totalItems }).map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    "h-2 w-2 rounded-full transition-colors",
                    i === currentIndex
                      ? "bg-white"
                      : "bg-white/30"
                  )}
                />
              ))}
            </div>
          )}

          {/* Right: counter + nav */}
          {isGallery && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-white/60">
                {currentIndex + 1}/{totalItems}
              </span>
              <button
                type="button"
                onClick={prev}
                disabled={!hasPrev}
                className="rounded-lg bg-white/10 p-1.5 text-white/70 transition-colors hover:bg-white/20 hover:text-white disabled:opacity-30 disabled:hover:bg-white/10"
                aria-label="Precedent"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={next}
                disabled={!hasNext}
                className="rounded-lg bg-white/10 p-1.5 text-white/70 transition-colors hover:bg-white/20 hover:text-white disabled:opacity-30 disabled:hover:bg-white/10"
                aria-label="Suivant"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
