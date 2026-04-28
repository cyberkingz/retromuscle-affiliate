"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Download, Loader2, RefreshCw, X } from "lucide-react";

import type { UseVideoPreviewReturn } from "@/hooks/use-video-preview";
import { VIDEO_STATUS_LABELS } from "@/domain/constants/labels";
import type { VideoStatus } from "@/domain/types";
import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/cn";

/** Badge classes tuned for the modal's dark (black) background */
function getStatusDarkClass(status: string): string {
  const s = status.toLowerCase();
  if (s.includes("approved")) return "border-green-500/50 bg-green-500/20 text-green-300";
  if (s.includes("rejected")) return "border-red-500/50 bg-red-500/20 text-red-300";
  if (s.includes("revision") || s.includes("pending"))
    return "border-amber-400/50 bg-amber-400/20 text-amber-300";
  return "border-white/20 bg-white/10 text-white/60";
}

interface VideoPreviewModalProps {
  preview: UseVideoPreviewReturn;
  title?: string;
}

export function VideoPreviewModal({ preview, title = "Preview" }: VideoPreviewModalProps) {
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
    open
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
  if (currentItem?.durationSeconds != null) metaParts.push(`${currentItem.durationSeconds}s`);
  if (currentItem?.fileSizeMb != null) metaParts.push(`${currentItem.fileSizeMb} MB`);

  // Download filename
  const downloadName = currentItem?.fileName ?? `video-${currentItem?.id ?? "preview"}.mp4`;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(o) => {
        if (!o) close();
      }}
    >
      <DialogContent
        className={cn(
          "max-h-[95svh] overflow-hidden border-none bg-black p-0",
          "w-[95vw] max-w-[900px]",
          "rounded-2xl shadow-2xl",
          "[&>button:last-child]:hidden"
        )}
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        {/* Visually hidden title for accessibility */}
        <DialogTitle className="sr-only">{title}</DialogTitle>

        {/* Glass header */}
        <div className="absolute left-0 right-0 top-0 z-20 flex flex-wrap items-center gap-x-2.5 gap-y-1 bg-black/70 px-4 py-2.5 pr-12 backdrop-blur-md">
          {currentItem?.status && (
            <span
              className={cn(
                "inline-flex shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em]",
                getStatusDarkClass(currentItem.status)
              )}
            >
              {VIDEO_STATUS_LABELS[currentItem.status as VideoStatus] ?? currentItem.status}
            </span>
          )}
          {currentItem?.videoType && (
            <span className="shrink-0 rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/80">
              {currentItem.videoType}
            </span>
          )}
          {metaParts.length > 0 && (
            <span className="hidden text-xs text-white/50 sm:inline">
              {metaParts.join(" \u00B7 ")}
            </span>
          )}
          <DialogClose className="ml-auto flex h-8 w-8 items-center justify-center rounded-lg text-white/60 transition-colors hover:bg-white/15 hover:text-white">
            <X className="h-4 w-4" />
            <span className="sr-only">Fermer</span>
          </DialogClose>
        </div>

        {/* Video area */}
        <div className="relative flex min-h-[280px] items-center justify-center bg-black sm:min-h-[350px]">
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

          {/* CF Stream iframe player (compressed preview) */}
          {currentItem?.cfStreamUid && !loading && !error && (
            <iframe
              key={currentItem.cfStreamUid}
              src={`https://iframe.cloudflarestream.com/${currentItem.cfStreamUid}?autoplay=true&muted=true&loop=false&preload=auto`}
              allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
              allowFullScreen
              className="h-[80svh] w-full pt-10 pb-20 sm:pt-12 sm:pb-24"
            />
          )}

          {/* Native video player (fallback: no CF Stream UID yet) */}
          {signedUrl && !loading && !error && !currentItem?.cfStreamUid && (
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
                muted
                playsInline
                onCanPlay={() => setVideoReady(true)}
                className={cn(
                  "max-h-[80svh] w-full object-contain pt-10 pb-20 sm:pt-12 sm:pb-24",
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
        <div className="absolute bottom-0 left-0 right-0 z-20 flex items-center justify-between gap-2 bg-black/70 px-3 py-2.5 backdrop-blur-md sm:gap-3 sm:px-4 sm:py-3">
          {/* Left: download */}
          <div className="flex min-w-0 items-center gap-2">
            {signedUrl && (
              <a
                href={signedUrl}
                download={downloadName}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90 sm:px-3.5 sm:py-2"
              >
                <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>Télécharger</span>
                {currentItem?.fileSizeMb != null && (
                  <span className="hidden text-primary-foreground/70 sm:inline">
                    ({currentItem.fileSizeMb} MB)
                  </span>
                )}
              </a>
            )}
          </div>

          {/* Center: gallery dots (desktop only) */}
          {isGallery && totalItems <= 12 && (
            <div className="hidden items-center gap-1.5 sm:flex">
              {Array.from({ length: totalItems }).map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    "h-2 w-2 rounded-full transition-colors",
                    i === currentIndex ? "bg-white" : "bg-white/30"
                  )}
                />
              ))}
            </div>
          )}

          {/* Right: counter + nav */}
          {isGallery && (
            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
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
