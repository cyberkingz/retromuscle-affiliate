"use client";

import { useCallback, useEffect, useRef, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutGrid,
  List,
  Loader2,
  MessageSquareDiff,
  Play,
  Search,
  ThumbsDown,
  ThumbsUp,
  X,
} from "lucide-react";

import type { AdminContentData, AdminContentVideo } from "@/application/use-cases/get-admin-content-data";
import { CardSection } from "@/components/layout/card-section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/ui/status-badge";
import { VideoPreviewModal } from "@/components/ui/video-preview-modal";
import { useVideoPreview } from "@/hooks/use-video-preview";
import { useAuth } from "@/features/auth/context/auth-context";
import { VIDEO_TYPE_LABELS, VIDEO_STATUS_LABELS } from "@/domain/constants/labels";
import { videoStatusTone } from "@/lib/status-tone";
import { cn } from "@/lib/cn";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type StatusFilter = "ALL" | "pending_review" | "approved" | "rejected" | "revision_requested";
type ViewMode = "grid" | "list";

const INITIAL_COUNT = 12;
const BATCH_SIZE    = 9;

// ---------------------------------------------------------------------------
// VideoThumbnail — lazy signed URL + <video preload="metadata"> first frame
// ---------------------------------------------------------------------------

function VideoThumbnail({ fileUrl }: { fileUrl: string }) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const videoRef   = useRef<HTMLVideoElement>(null);
  const [src, setSrc]       = useState<string | null>(null);
  const [ready, setReady]   = useState(false);
  const fetchedRef = useRef(false);

  // Fetch signed URL only when the card enters the viewport
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !fetchedRef.current) {
          fetchedRef.current = true;
          fetch(`/api/videos/preview?fileUrl=${encodeURIComponent(fileUrl)}`, { cache: "no-store" })
            .then((r) => r.json() as Promise<{ signedUrl?: string }>)
            .then((d) => { if (d.signedUrl) setSrc(d.signedUrl); })
            .catch(() => { /* silently skip — placeholder stays */ });
        }
      },
      { rootMargin: "200px" } // pre-load slightly before visible
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [fileUrl]);

  // Once src is loaded, seek to first visible frame
  const handleLoadedMetadata = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = 0.1; // push past frame 0 (some browsers show black at t=0)
  }, []);

  const handleSeeked = useCallback(() => {
    setReady(true);
  }, []);

  return (
    <div ref={wrapperRef} className="absolute inset-0">
      {src && (
        <video
          ref={videoRef}
          src={src}
          className={cn(
            "h-full w-full object-cover transition-opacity duration-300",
            ready ? "opacity-100" : "opacity-0"
          )}
          preload="metadata"
          muted
          playsInline
          onLoadedMetadata={handleLoadedMetadata}
          onSeeked={handleSeeked}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Type pill (same colours as ValidationQueue)
// ---------------------------------------------------------------------------

const TYPE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  OOTD:         { bg: "bg-violet-50",  text: "text-violet-700",  border: "border-violet-200"  },
  TRAINING:     { bg: "bg-sky-50",     text: "text-sky-700",     border: "border-sky-200"     },
  BEFORE_AFTER: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  SPORTS_80S:   { bg: "bg-rose-50",    text: "text-rose-700",    border: "border-rose-200"    },
  CINEMATIC:    { bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-200"   },
};

function TypePill({ type }: { type: string }) {
  const c = TYPE_COLORS[type] ?? { bg: "bg-foreground/5", text: "text-foreground/60", border: "border-transparent" };
  return (
    <span className={cn(
      "rounded-md border px-1.5 py-px text-[9px] font-bold uppercase tracking-widest shrink-0",
      c.bg, c.text, c.border
    )}>
      {VIDEO_TYPE_LABELS[type as keyof typeof VIDEO_TYPE_LABELS] ?? type.replace(/_/g, " ")}
    </span>
  );
}

function formatDate(ts: string) {
  return new Date(ts).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

// ---------------------------------------------------------------------------
// Stats strip pill
// ---------------------------------------------------------------------------

interface StatPillProps {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
  accentClass?: string;
}

function StatPill({ label, count, active, onClick, accentClass }: StatPillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition",
        active
          ? "border-secondary bg-secondary text-secondary-foreground"
          : "border-line bg-white text-foreground/60 hover:border-foreground/20 hover:text-foreground",
        accentClass
      )}
    >
      {label}
      <span className={cn(
        "inline-flex min-w-[18px] items-center justify-center rounded-full px-1 py-px text-[10px] font-black",
        active ? "bg-white/20 text-white" : "bg-foreground/8 text-foreground/60"
      )}>
        {count}
      </span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Action button (inline review)
// ---------------------------------------------------------------------------

function ActionIcon({
  onClick, disabled, title, className, children,
}: {
  onClick: () => void; disabled?: boolean; title: string; className?: string; children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded-lg border transition disabled:opacity-30",
        "border-line bg-white hover:bg-frost text-foreground/50 hover:text-foreground/80",
        className
      )}
    >
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Content card (grid view)
// ---------------------------------------------------------------------------

interface ContentCardProps {
  video: AdminContentVideo;
  onPreview: () => void;
  onApprove: () => void;
  onRevise: () => void;
  onReject: () => void;
  isActing: boolean;
  canAct: boolean;
}

function ContentCard({ video, onPreview, onApprove, onRevise, onReject, isActing, canAct }: ContentCardProps) {
  const isPending = video.status === "pending_review";
  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-white transition hover:border-foreground/15 hover:shadow-sm">
      {/* Thumbnail / preview area */}
      <button
        type="button"
        onClick={onPreview}
        className="relative aspect-[9/16] w-full bg-foreground/5 transition group-hover:bg-foreground/8"
        aria-label={`Voir la vidéo ${VIDEO_TYPE_LABELS[video.videoType] ?? video.videoType} de @${video.creatorHandle}`}
      >
        {/* Thumbnail */}
        <VideoThumbnail fileUrl={video.fileUrl} />
        {/* Play overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/10 transition group-hover:bg-black/25">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white transition group-hover:bg-black/60">
            <Play className="h-4 w-4 translate-x-px" />
          </div>
        </div>
        {/* Status dot overlay */}
        <span className={cn(
          "absolute right-2 top-2 h-2 w-2 rounded-full",
          video.status === "approved" && "bg-emerald-500",
          video.status === "pending_review" && "bg-primary",
          video.status === "revision_requested" && "bg-amber-500",
          video.status === "rejected" && "bg-foreground/30",
          video.status === "uploaded" && "bg-sky-400",
        )} />
      </button>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="flex items-center justify-between gap-1.5">
          <span className="truncate text-xs font-bold text-foreground/85">@{video.creatorHandle}</span>
          <TypePill type={video.videoType} />
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <StatusBadge
            label={VIDEO_STATUS_LABELS[video.status] ?? video.status}
            tone={videoStatusTone(video.status)}
          />
        </div>

        <p className="text-[10px] text-foreground/40">
          {formatDate(video.uploadedAt)} · {video.durationSeconds}s · {video.resolution}
        </p>

        {/* Actions row — always rendered to keep cards same height */}
        <div className={cn("mt-auto flex items-center gap-1 pt-1", !isPending && "invisible")}>
          <button
            type="button"
            disabled={!canAct || isActing || !isPending}
            onClick={onApprove}
            className="flex h-7 flex-1 items-center justify-center gap-1 rounded-lg border border-emerald-300 bg-emerald-50 text-[10px] font-bold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-30"
          >
            <ThumbsUp className="h-3 w-3" /> Valider
          </button>
          <ActionIcon title="Révision" disabled={!canAct || isActing || !isPending} onClick={onRevise}
            className="border-amber-200 hover:bg-amber-50 hover:text-amber-700">
            <MessageSquareDiff className="h-3 w-3 text-amber-500" />
          </ActionIcon>
          <ActionIcon title="Rejeter" disabled={!canAct || isActing || !isPending} onClick={onReject}
            className="hover:border-destructive/30 hover:bg-destructive/5 hover:text-destructive">
            <ThumbsDown className="h-3 w-3 text-destructive/50" />
          </ActionIcon>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

interface AdminContentPageProps {
  data: AdminContentData;
}

export function AdminContentPage({ data }: AdminContentPageProps) {
  const auth = useAuth();
  const router = useRouter();
  const canAct = Boolean(auth.user);

  // View
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  // Filters
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [creatorFilter, setCreatorFilter] = useState("");

  // Infinite scroll
  const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Review state (shared for grid + list)
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [revisingId, setRevisingId] = useState<string | null>(null);
  const [revisionNote, setRevisionNote] = useState("");
  const [actingId, setActingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const videoPreview = useVideoPreview("/api/videos/preview");

  // ── Derived video types for filter dropdown ──────────────────────────────
  const videoTypes = useMemo(() =>
    Array.from(new Set(data.videos.map((v) => v.videoType))).sort(),
  [data.videos]);

  // ── Filtered list ────────────────────────────────────────────────────────
  const filteredVideos = useMemo(() => {
    const needle = creatorFilter.trim().toLowerCase();
    return data.videos
      .filter((v) => {
        if (statusFilter !== "ALL" && v.status !== statusFilter) return false;
        if (typeFilter !== "ALL" && v.videoType !== typeFilter) return false;
        if (needle && !v.creatorHandle.toLowerCase().includes(needle)) return false;
        return true;
      })
      .sort((a, b) => Date.parse(b.uploadedAt) - Date.parse(a.uploadedAt));
  }, [data.videos, statusFilter, typeFilter, creatorFilter]);

  const visibleVideos = filteredVideos.slice(0, visibleCount);
  const hasMore = visibleCount < filteredVideos.length;

  const resetReviewPanels = () => {
    setRejectingId(null); setRejectionReason("");
    setRevisingId(null); setRevisionNote("");
  };

  const setFilterAndReset = (cb: () => void) => {
    cb();
    setVisibleCount(INITIAL_COUNT);
    resetReviewPanels();
  };

  // ── Infinite scroll sentinel ─────────────────────────────────────────────
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount((prev) => prev + BATCH_SIZE);
        }
      },
      { rootMargin: "300px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  // ── Review action ────────────────────────────────────────────────────────
  const reviewVideo = useCallback(async (
    videoId: string,
    decision: "approved" | "rejected" | "revision_requested",
    reason?: string | null
  ) => {
    if (!canAct) { router.replace("/login"); return; }
    setError(null);
    setActingId(videoId);
    try {
      const res = await fetch("/api/admin/videos/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId, decision, rejectionReason: decision !== "approved" ? (reason ?? null) : null }),
        cache: "no-store",
      });
      if (!res.ok) {
        const d = (await res.json().catch(() => null)) as { message?: string } | null;
        throw new Error(d?.message ?? "Impossible de mettre à jour la vidéo.");
      }
      resetReviewPanels();
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Impossible de mettre à jour la vidéo.");
    } finally {
      setActingId(null);
    }
  }, [canAct, router]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Preview helpers ──────────────────────────────────────────────────────
  const toPreviewItem = (v: AdminContentVideo) => ({
    id: v.videoId,
    fileUrl: v.fileUrl,
    videoType: v.videoType,
    resolution: v.resolution,
    durationSeconds: v.durationSeconds,
    status: v.status,
  });

  const openPreview = (v: AdminContentVideo) => {
    videoPreview.open(toPreviewItem(v), filteredVideos.map(toPreviewItem));
  };

  // ── Stats pill filter helper ─────────────────────────────────────────────
  const setStatFilter = (s: StatusFilter) =>
    setFilterAndReset(() => setStatusFilter((prev) => prev === s ? "ALL" : s));

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-2xl uppercase leading-none sm:text-3xl">Contenu</h1>
        <div className="flex items-center gap-1.5 rounded-xl border border-line bg-white p-1">
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg transition",
              viewMode === "grid" ? "bg-secondary text-secondary-foreground" : "text-foreground/40 hover:text-foreground"
            )}
            aria-label="Vue grille"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode("list")}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg transition",
              viewMode === "list" ? "bg-secondary text-secondary-foreground" : "text-foreground/40 hover:text-foreground"
            )}
            aria-label="Vue liste"
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Stats strip — horizontal scroll on mobile, no wrap */}
      <div className="-mx-4 sm:mx-0">
        <div className="flex gap-2 overflow-x-auto px-4 pb-0.5 sm:px-0 sm:flex-wrap [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <StatPill label="Tout" count={data.stats.total} active={statusFilter === "ALL"} onClick={() => setFilterAndReset(() => setStatusFilter("ALL"))} />
          <StatPill label="À valider" count={data.stats.pending} active={statusFilter === "pending_review"} onClick={() => setStatFilter("pending_review")} accentClass={data.stats.pending > 0 && statusFilter !== "pending_review" ? "border-primary/30 text-primary" : undefined} />
          <StatPill label="Approuvé" count={data.stats.approved} active={statusFilter === "approved"} onClick={() => setStatFilter("approved")} />
          <StatPill label="Révision" count={data.stats.revision} active={statusFilter === "revision_requested"} onClick={() => setStatFilter("revision_requested")} />
          <StatPill label="Rejeté" count={data.stats.rejected} active={statusFilter === "rejected"} onClick={() => setStatFilter("rejected")} />
        </div>
      </div>

      <CardSection padding="sm" className="space-y-3 rounded-[20px]">
        {/* Filter bar — always a single row, even on mobile */}
        <div className="flex items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-foreground/35" />
            <Input
              value={creatorFilter}
              onChange={(e) => setFilterAndReset(() => setCreatorFilter(e.target.value))}
              placeholder="Créateur..."
              className="h-9 pl-8 text-sm"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setFilterAndReset(() => setTypeFilter(e.target.value))}
            className="h-9 shrink-0 rounded-xl border border-line bg-white px-2 text-xs sm:px-3"
          >
            <option value="ALL">Types</option>
            {videoTypes.map((t) => (
              <option key={t} value={t}>{VIDEO_TYPE_LABELS[t as keyof typeof VIDEO_TYPE_LABELS] ?? t.replace(/_/g, " ")}</option>
            ))}
          </select>
          <p className="hidden sm:block shrink-0 text-xs text-foreground/40">{filteredVideos.length} vidéo{filteredVideos.length !== 1 ? "s" : ""}</p>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive" role="alert">
            {error}
            <button type="button" onClick={() => setError(null)} className="ml-2 opacity-60 hover:opacity-100"><X className="inline h-3.5 w-3.5" /></button>
          </div>
        )}

        {/* Empty */}
        {filteredVideos.length === 0 ? (
          <div className="rounded-2xl border border-line bg-frost/70 px-4 py-10 text-center text-sm text-foreground/40">
            Aucun contenu pour ces critères.
          </div>
        ) : viewMode === "grid" ? (
          /* ── GRID VIEW ───────────────────────────────────────────────── */
          <div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {visibleVideos.map((video) => (
                <div key={video.videoId} className="contents">
                  {/* Card always occupies 1 column */}
                  <div>
                    <ContentCard
                      video={video}
                      onPreview={() => openPreview(video)}
                      onApprove={() => void reviewVideo(video.videoId, "approved")}
                      onRevise={() => { resetReviewPanels(); setRevisingId(video.videoId); }}
                      onReject={() => { resetReviewPanels(); setRejectingId(video.videoId); }}
                      isActing={actingId === video.videoId}
                      canAct={canAct}
                    />
                  </div>

                  {/* Revision panel — spans full grid width */}
                  {revisingId === video.videoId && (
                    <div className="col-span-1 sm:col-span-2 md:col-span-3 lg:col-span-4 xl:col-span-5 rounded-2xl border border-amber-200 bg-amber-50/80 p-3">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-amber-700">Demande de révision</p>
                        <button type="button" onClick={resetReviewPanels} className="text-amber-500"><X className="h-3.5 w-3.5" /></button>
                      </div>
                      <Textarea
                        value={revisionNote}
                        onChange={(e) => setRevisionNote(e.target.value)}
                        placeholder="Lumière insuffisante, ajoute des sous-titres…"
                        className="border-amber-200 bg-white text-sm focus:border-amber-400"
                        rows={3}
                        autoFocus
                      />
                      <div className="mt-2 flex gap-1.5">
                        <Button size="sm" className="bg-amber-500 text-white hover:bg-amber-600"
                          onClick={() => void reviewVideo(video.videoId, "revision_requested", revisionNote)}
                          disabled={!canAct || !revisionNote.trim()}>
                          Envoyer
                        </Button>
                        <Button size="sm" variant="outline" onClick={resetReviewPanels}>Annuler</Button>
                      </div>
                    </div>
                  )}

                  {/* Rejection panel — spans full grid width */}
                  {rejectingId === video.videoId && (
                    <div className="col-span-1 sm:col-span-2 md:col-span-3 lg:col-span-4 xl:col-span-5 rounded-2xl border border-destructive/15 bg-destructive/5 p-3">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-destructive/70">Raison du rejet</p>
                        <button type="button" onClick={resetReviewPanels} className="text-destructive/40"><X className="h-3.5 w-3.5" /></button>
                      </div>
                      <Textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Hook trop tard, format horizontal…"
                        className="text-sm"
                        rows={3}
                        autoFocus
                      />
                      <div className="mt-2 flex gap-1.5">
                        <Button size="sm" variant="destructive"
                          onClick={() => void reviewVideo(video.videoId, "rejected", rejectionReason)}
                          disabled={!canAct || !rejectionReason.trim()}>
                          Confirmer
                        </Button>
                        <Button size="sm" variant="outline" onClick={resetReviewPanels}>Annuler</Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* ── LIST VIEW ───────────────────────────────────────────────── */
          <div className="space-y-0.5">
            {/* Header row */}
            <div className="hidden sm:flex items-center gap-3 border-b border-line/60 pb-1.5">
              <span className="flex-1 text-[9px] font-bold uppercase tracking-[0.14em] text-foreground/35">Créateur · Type</span>
              <span className="w-28 text-[9px] font-bold uppercase tracking-[0.14em] text-foreground/35">Statut</span>
              <span className="w-32 text-[9px] font-bold uppercase tracking-[0.14em] text-foreground/35">Infos</span>
              <span className="w-[152px]" />
            </div>

            {visibleVideos.map((video) => {
              const isPending = video.status === "pending_review";
              const isRejecting = rejectingId === video.videoId;
              const isRevising = revisingId === video.videoId;

              return (
                <div key={video.videoId} className="border-b border-line/40 last:border-0">
                  <div className="flex items-center gap-3 py-2.5 px-1">
                    {/* Creator + type */}
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                      <span className="truncate text-sm font-bold text-foreground/85">@{video.creatorHandle}</span>
                      <TypePill type={video.videoType} />
                    </div>

                    {/* Status */}
                    <div className="hidden sm:block w-28 shrink-0">
                      <StatusBadge
                        label={VIDEO_STATUS_LABELS[video.status] ?? video.status}
                        tone={videoStatusTone(video.status)}
                      />
                    </div>

                    {/* Meta */}
                    <span className="hidden sm:inline w-32 shrink-0 text-[11px] text-foreground/35">
                      {formatDate(video.uploadedAt)} · {video.durationSeconds}s
                    </span>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <ActionIcon title="Voir la vidéo" onClick={() => openPreview(video)}>
                        <Play className="h-3.5 w-3.5" />
                      </ActionIcon>
                      {isPending && (
                        <>
                          <button type="button" disabled={!canAct}
                            onClick={() => void reviewVideo(video.videoId, "approved")}
                            className="hidden sm:flex h-7 items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-2 text-[10px] font-bold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-30">
                            <ThumbsUp className="h-3 w-3" /> Valider
                          </button>
                          <ActionIcon title="Révision" disabled={!canAct}
                            className={cn(isRevising && "border-amber-400 bg-amber-100 text-amber-700")}
                            onClick={() => { setError(null); setRejectingId(null); setRejectionReason(""); setRevisingId((c) => c === video.videoId ? null : video.videoId); setRevisionNote(""); }}>
                            <MessageSquareDiff className="h-3.5 w-3.5 text-amber-500" />
                          </ActionIcon>
                          <ActionIcon title="Rejeter" disabled={!canAct}
                            className={cn(isRejecting && "border-destructive/40 bg-destructive/10 text-destructive")}
                            onClick={() => { setError(null); setRevisingId(null); setRevisionNote(""); setRejectingId((c) => c === video.videoId ? null : video.videoId); setRejectionReason(""); }}>
                            <ThumbsDown className="h-3.5 w-3.5 text-destructive/60" />
                          </ActionIcon>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Revision panel */}
                  {isRevising && (
                    <div className="mx-1 mb-3 rounded-2xl border border-amber-200 bg-amber-50/80 p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold uppercase tracking-[0.12em] text-amber-700">Demande de modification</p>
                        <button type="button" onClick={resetReviewPanels} className="text-amber-500"><X className="h-3.5 w-3.5" /></button>
                      </div>
                      <Textarea value={revisionNote} onChange={(e) => setRevisionNote(e.target.value)}
                        placeholder="Ex: Lumière insuffisante, retourne en plein jour…"
                        className="mt-2 border-amber-200 bg-white focus:border-amber-400" rows={3} autoFocus />
                      <div className="mt-3 flex gap-2">
                        <Button size="sm" className="bg-amber-500 text-white hover:bg-amber-600"
                          onClick={() => void reviewVideo(video.videoId, "revision_requested", revisionNote)}
                          disabled={!canAct || !revisionNote.trim()}>
                          Envoyer la demande
                        </Button>
                        <Button size="sm" variant="outline" onClick={resetReviewPanels}>Annuler</Button>
                      </div>
                    </div>
                  )}

                  {/* Rejection panel */}
                  {isRejecting && (
                    <div className="mx-1 mb-3 rounded-2xl border border-destructive/15 bg-destructive/5 p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold uppercase tracking-[0.12em] text-destructive/70">Raison du rejet</p>
                        <button type="button" onClick={resetReviewPanels} className="text-destructive/40"><X className="h-3.5 w-3.5" /></button>
                      </div>
                      <Textarea value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Hook trop tard, format horizontal, sous-titres illisibles…"
                        className="mt-2" rows={3} autoFocus />
                      <div className="mt-3 flex gap-2">
                        <Button size="sm" variant="destructive"
                          onClick={() => void reviewVideo(video.videoId, "rejected", rejectionReason)}
                          disabled={!canAct || !rejectionReason.trim()}>
                          Confirmer le rejet
                        </Button>
                        <Button size="sm" variant="outline" onClick={resetReviewPanels}>Annuler</Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Infinite scroll sentinel + loader */}
        {hasMore && (
          <div ref={sentinelRef} className="flex items-center justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-foreground/30" />
          </div>
        )}
        {!hasMore && filteredVideos.length > INITIAL_COUNT && (
          <p className="py-3 text-center text-[11px] text-foreground/30">
            {filteredVideos.length} vidéo{filteredVideos.length !== 1 ? "s" : ""} au total
          </p>
        )}
      </CardSection>

      <VideoPreviewModal preview={videoPreview} title="Preview Vidéo" />
    </div>
  );
}
