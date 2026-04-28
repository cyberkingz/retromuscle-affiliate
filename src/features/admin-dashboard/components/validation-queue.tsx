"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Layers,
  MessageSquareDiff,
  Play,
  Search,
  ThumbsDown,
  ThumbsUp,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { CardSection } from "@/components/layout/card-section";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { VideoPreviewModal } from "@/components/ui/video-preview-modal";
import { useVideoPreview } from "@/hooks/use-video-preview";
import { useAuth } from "@/features/auth/context/auth-context";
import { cn } from "@/lib/cn";

interface ValidationQueueProps {
  rows: Array<{
    videoId: string;
    creatorHandle: string;
    videoType: string;
    fileUrl: string;
    uploadedAt: string;
    durationSeconds: number;
    resolution: string;
    /** Defined for batch submissions; absent for single-video rows. */
    batchId?: string;
    clipCount?: number;
  }>;
}

const PAGE_SIZE = 15;

const TYPE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  OOTD:         { bg: "bg-violet-50",  text: "text-violet-700", border: "border-violet-200" },
  TRAINING:     { bg: "bg-sky-50",     text: "text-sky-700",    border: "border-sky-200"    },
  BEFORE_AFTER: { bg: "bg-emerald-50", text: "text-emerald-700",border: "border-emerald-200"},
  SPORTS_80S:   { bg: "bg-rose-50",    text: "text-rose-700",   border: "border-rose-200"   },
  CINEMATIC:    { bg: "bg-amber-50",   text: "text-amber-700",  border: "border-amber-200"  },
};

function TypePill({ type }: { type: string }) {
  const c = TYPE_COLORS[type] ?? { bg: "bg-foreground/5", text: "text-foreground/60", border: "border-transparent" };
  return (
    <span className={cn("rounded-md border px-1.5 py-px text-[9px] font-bold uppercase tracking-widest shrink-0", c.bg, c.text, c.border)}>
      {type.replace(/_/g, " ")}
    </span>
  );
}

function formatDate(ts: string) {
  return new Date(ts).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

/** Compact icon-only action button for desktop */
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
        "flex h-8 w-8 items-center justify-center rounded-lg border transition disabled:opacity-30",
        "border-line bg-white hover:bg-frost text-foreground/50 hover:text-foreground/80",
        className
      )}
    >
      {children}
    </button>
  );
}

export function ValidationQueue({ rows }: ValidationQueueProps) {
  const auth = useAuth();
  const router = useRouter();
  const canAct = Boolean(auth.user);

  // Per-row inline state
  const [rejectingId, setRejectingId]     = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [revisingId, setRevisingId]       = useState<string | null>(null);
  const [revisionNote, setRevisionNote]   = useState("");
  const [moreOpenId, setMoreOpenId]       = useState<string | null>(null);

  // Bulk actions
  const [selectedIds, setSelectedIds]     = useState<Set<string>>(new Set());
  const [bulkRejecting, setBulkRejecting] = useState(false);
  const [bulkRejectionReason, setBulkRejectionReason] = useState("");

  // Filters + pagination
  const [creatorFilter, setCreatorFilter] = useState("");
  const [typeFilter, setTypeFilter]       = useState("ALL");
  const [dateFilter, setDateFilter]       = useState<"ALL" | "7D" | "30D">("ALL");
  const [page, setPage]                   = useState(0);
  const [error, setError]                 = useState<string | null>(null);

  const [expandedBatchId, setExpandedBatchId] = useState<string | null>(null);
  const [batchClips, setBatchClips] = useState<Record<string, Array<{ id: string; fileUrl: string; resolution: string; durationSeconds: number; videoType: string }>>>({});
  const [clipsLoading, setClipsLoading] = useState<string | null>(null);

  const videoPreview = useVideoPreview("/api/videos/preview");

  const videoTypes = useMemo(() =>
    Array.from(new Set(rows.map((r) => r.videoType))).sort(),
  [rows]);

  const filteredRows = useMemo(() => {
    const needle = creatorFilter.trim().toLowerCase();
    const now = Date.now();
    const minTs = dateFilter === "7D" ? now - 7 * 86_400_000 : dateFilter === "30D" ? now - 30 * 86_400_000 : null;
    return rows
      .filter((r) => {
        if (typeFilter !== "ALL" && r.videoType !== typeFilter) return false;
        if (minTs) { const ts = Date.parse(r.uploadedAt); if (Number.isFinite(ts) && ts < minTs) return false; }
        if (needle && !r.creatorHandle.toLowerCase().includes(needle)) return false;
        return true;
      })
      .sort((a, b) => Date.parse(b.uploadedAt) - Date.parse(a.uploadedAt));
  }, [rows, creatorFilter, typeFilter, dateFilter]);

  const pageCount = Math.ceil(filteredRows.length / PAGE_SIZE);
  const pageRows  = filteredRows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  useEffect(() => {
    const maxPage = Math.max(0, pageCount - 1);
    if (page > maxPage) setPage(maxPage);
  }, [pageCount, page]);

  const resetPanel = () => {
    setRejectingId(null); setRejectionReason("");
    setRevisingId(null);  setRevisionNote("");
    setMoreOpenId(null);
  };

  const toggleBatchClips = useCallback(async (batchId: string) => {
    if (expandedBatchId === batchId) { setExpandedBatchId(null); return; }
    setExpandedBatchId(batchId);
    if (batchClips[batchId]) return;
    setClipsLoading(batchId);
    try {
      const res = await fetch(`/api/admin/videos/batch/${batchId}/clips`, { cache: "no-store" });
      const d = (await res.json().catch(() => null)) as { clips?: Array<{ id: string; fileUrl: string; resolution: string; durationSeconds: number; videoType: string }> } | null;
      setBatchClips((prev) => ({ ...prev, [batchId]: d?.clips ?? [] }));
    } catch {
      setBatchClips((prev) => ({ ...prev, [batchId]: [] }));
    } finally {
      setClipsLoading(null);
    }
  }, [expandedBatchId, batchClips]);

  const reviewMany = useCallback(
    async (videoIds: string[], decision: "approved" | "rejected" | "revision_requested", reason?: string | null) => {
      if (!canAct) { router.replace("/login"); return; }
      setError(null);
      try {
        const res = await fetch("/api/admin/videos/review-batch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ videoIds, decision, rejectionReason: decision !== "approved" ? (reason ?? null) : null }),
          cache: "no-store",
        });
        if (!res.ok) {
          const d = (await res.json().catch(() => null)) as { message?: string } | null;
          throw new Error(d?.message ?? "Impossible de mettre à jour les vidéos.");
        }
        const d = (await res.json().catch(() => null)) as { results?: Array<{ videoId: string; ok: boolean; error?: string }> } | null;
        const fails = d?.results?.filter((r) => !r.ok) ?? [];
        if (fails.length) setError(`${fails.length}/${videoIds.length} vidéo(s) en erreur. ${fails[0]?.error ?? ""}`);
        resetPanel();
        setBulkRejecting(false); setBulkRejectionReason("");
        setSelectedIds(new Set());
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Impossible de mettre à jour les vidéos.");
      }
    },
    [canAct, router] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const reviewOne = useCallback(
    (id: string, decision: "approved" | "rejected" | "revision_requested", reason?: string | null) =>
      reviewMany([id], decision, reason),
    [reviewMany]
  );

  const reviewBatchSubmission = useCallback(
    async (batchId: string, decision: "approved" | "rejected" | "revision_requested", reason?: string | null) => {
      if (!canAct) { router.replace("/login"); return; }
      setError(null);
      try {
        const res = await fetch("/api/admin/videos/review-batch-submission", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ batchId, decision, rejectionReason: decision !== "approved" ? (reason ?? null) : null }),
          cache: "no-store",
        });
        if (!res.ok) {
          const d = (await res.json().catch(() => null)) as { message?: string } | null;
          throw new Error(d?.message ?? "Impossible de mettre à jour le lot.");
        }
        resetPanel();
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Impossible de mettre à jour le lot.");
      }
    },
    [canAct, router] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const toggleSelect = (id: string) => setSelectedIds((prev) => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const toggleSelectAll = () => setSelectedIds((prev) => {
    const ids = pageRows.map((r) => r.videoId);
    const all = ids.every((id) => prev.has(id));
    const next = new Set(prev);
    all ? ids.forEach((id) => next.delete(id)) : ids.forEach((id) => next.add(id));
    return next;
  });

  const allSelected  = pageRows.length > 0 && pageRows.every((r) => selectedIds.has(r.videoId));
  const someSelected = pageRows.some((r) => selectedIds.has(r.videoId));
  const selCount     = selectedIds.size;

  return (
    <CardSection className="space-y-4 rounded-[20px]">

      {/* Header */}
      <div className="flex items-center gap-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-foreground/60">
          File de validation
        </p>
        {rows.length > 0 && (
          <span className="inline-flex items-center justify-center rounded-full bg-primary px-2 py-0.5 font-display text-[11px] font-black leading-none text-white">
            {rows.length}
          </span>
        )}
      </div>

      {error && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive" role="alert">
          {error}
        </div>
      )}

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-line bg-frost/70 px-4 py-8 text-center text-sm text-foreground/40">
          Rien à valider pour le moment.
        </div>
      ) : (
        <div className="space-y-2">

          {/* Filter bar */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative flex-1 sm:max-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-foreground/35" />
              <Input
                value={creatorFilter}
                onChange={(e) => { setCreatorFilter(e.target.value); setPage(0); }}
                placeholder="Créateur..."
                className="h-8 pl-8 text-sm"
              />
            </div>
            <select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setPage(0); }}
              className="h-8 rounded-xl border border-line bg-white px-3 text-xs"
            >
              <option value="ALL">Tous types</option>
              {videoTypes.map((t) => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
            </select>
            <select
              value={dateFilter}
              onChange={(e) => { setDateFilter(e.target.value as "ALL" | "7D" | "30D"); setPage(0); }}
              className="h-8 rounded-xl border border-line bg-white px-3 text-xs"
            >
              <option value="ALL">Toutes dates</option>
              <option value="7D">7 jours</option>
              <option value="30D">30 jours</option>
            </select>
          </div>

          {/* Bulk bar */}
          {selCount > 0 && (
            <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-line bg-frost/80 px-3 py-2">
              <span className="text-xs font-semibold text-foreground/70">
                {selCount} sélectionné{selCount > 1 ? "s" : ""}
              </span>
              <div className="ml-auto flex gap-1.5">
                <Button size="sm" variant="outline"
                  className="h-7 border-mint/40 text-xs text-emerald-700 hover:bg-emerald-50"
                  onClick={() => void reviewMany(Array.from(selectedIds), "approved")} disabled={!canAct}>
                  <ThumbsUp className="mr-1 h-3 w-3" /> Valider
                </Button>
                <Button size="sm" variant="outline" className="h-7 text-xs"
                  onClick={() => setBulkRejecting(true)} disabled={!canAct}>
                  <ThumbsDown className="mr-1 h-3 w-3" /> Rejeter
                </Button>
                <Button size="sm" variant="ghost" className="h-7 text-xs text-foreground/40"
                  onClick={() => setSelectedIds(new Set())}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}

          {/* Bulk rejection form */}
          {bulkRejecting && selCount > 0 && (
            <div className="rounded-2xl border border-line bg-frost/70 p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-foreground/60">
                Raison — lot de {selCount}
              </p>
              <Textarea value={bulkRejectionReason} onChange={(e) => setBulkRejectionReason(e.target.value)}
                placeholder="Hook trop tard, format horizontal, sous-titres illisibles…"
                className="mt-2" rows={3} autoFocus />
              <div className="mt-3 flex gap-2">
                <Button size="sm"
                  onClick={() => void reviewMany(Array.from(selectedIds), "rejected", bulkRejectionReason)}
                  disabled={!canAct || !bulkRejectionReason.trim()}>
                  Confirmer le rejet
                </Button>
                <Button size="sm" variant="outline"
                  onClick={() => { setBulkRejecting(false); setBulkRejectionReason(""); }}>
                  Annuler
                </Button>
              </div>
            </div>
          )}

          {/* List header (desktop only) */}
          <div className="hidden sm:flex items-center gap-3 border-b border-line/60 pb-1.5">
            <input type="checkbox" className="h-3.5 w-3.5 accent-secondary"
              checked={allSelected}
              ref={(el) => { if (el) el.indeterminate = someSelected && !allSelected; }}
              onChange={toggleSelectAll} />
            <span className="flex-1 text-[9px] font-bold uppercase tracking-[0.14em] text-foreground/35">
              Créateur · Type
            </span>
            <span className="w-32 text-[9px] font-bold uppercase tracking-[0.14em] text-foreground/35">
              Infos
            </span>
            <span className="w-[164px]" />
          </div>

          {/* Rows */}
          {pageRows.length === 0 ? (
            <p className="py-6 text-center text-sm text-foreground/40">Aucun résultat.</p>
          ) : (
            <div>
              {pageRows.map((row) => {
                const isBatch     = row.batchId !== undefined;
                const reviewId    = row.videoId;
                const isRejecting = rejectingId === reviewId;
                const isRevising  = revisingId  === reviewId;
                const isMoreOpen  = moreOpenId  === reviewId;
                const isSelected  = !isBatch && selectedIds.has(reviewId);
                const metaSuffix  = isBatch
                  ? ` · lot de ${row.clipCount ?? "?"} clips`
                  : ` · ${row.durationSeconds}s · ${row.resolution}`;

                const approve = () =>
                  isBatch
                    ? void reviewBatchSubmission(row.batchId!, "approved")
                    : void reviewOne(reviewId, "approved");

                const confirmRevision = () =>
                  isBatch
                    ? void reviewBatchSubmission(row.batchId!, "revision_requested", revisionNote)
                    : void reviewOne(reviewId, "revision_requested", revisionNote);

                const confirmReject = () =>
                  isBatch
                    ? void reviewBatchSubmission(row.batchId!, "rejected", rejectionReason)
                    : void reviewOne(reviewId, "rejected", rejectionReason);

                return (
                  <div key={reviewId} className={cn(
                    "border-b border-line/40 last:border-0 transition-colors",
                    isSelected && "bg-secondary/5",
                    isBatch && "bg-secondary/[0.02]"
                  )}>
                    {/* ── Main row ── */}
                    <div className="flex items-center gap-3 py-2.5 px-1">

                      {/* Checkbox — disabled for batch rows */}
                      <input
                        type="checkbox"
                        className="h-3.5 w-3.5 shrink-0 accent-secondary disabled:opacity-30"
                        checked={isSelected}
                        disabled={isBatch}
                        onChange={() => { if (!isBatch) toggleSelect(reviewId); }}
                        aria-label={isBatch ? "Lot — sélection individuelle non disponible" : `Sélectionner ${row.creatorHandle}`}
                      />

                      {/* Creator + type + batch badge */}
                      <div className="flex min-w-0 flex-1 items-center gap-2">
                        <span className="truncate text-sm font-bold text-foreground/85">
                          @{row.creatorHandle}
                        </span>
                        <TypePill type={row.videoType} />
                        {isBatch && (
                          <span className="hidden sm:inline-flex shrink-0 items-center gap-1 rounded-md border border-secondary/30 bg-secondary/10 px-1.5 py-px text-[9px] font-bold uppercase tracking-widest text-secondary">
                            <Layers className="h-2.5 w-2.5" />
                            {row.clipCount ?? "?"} clips
                          </span>
                        )}
                        {/* Meta — visible desktop only */}
                        <span className="hidden shrink-0 sm:inline text-[11px] text-foreground/35">
                          {formatDate(row.uploadedAt)}
                          {metaSuffix}
                        </span>
                      </div>

                      {/* ── Desktop actions (≥sm) ── */}
                      <div className="hidden sm:flex items-center gap-1.5 shrink-0">
                        {/* Preview — single video only; Clips gallery — batch only */}
                        {!isBatch ? (
                          <ActionIcon title="Voir la vidéo" disabled={!canAct}
                            onClick={() => videoPreview.open({ id: row.videoId, fileUrl: row.fileUrl, videoType: row.videoType, resolution: row.resolution, durationSeconds: row.durationSeconds })}>
                            <Play className="h-3.5 w-3.5" />
                          </ActionIcon>
                        ) : (
                          <ActionIcon
                            title={expandedBatchId === row.batchId ? "Masquer les clips" : "Voir les clips"}
                            onClick={() => void toggleBatchClips(row.batchId!)}
                            className={expandedBatchId === row.batchId ? "border-secondary/40 bg-secondary/8 text-secondary" : ""}
                          >
                            {expandedBatchId === row.batchId
                              ? <ChevronUp className="h-3.5 w-3.5" />
                              : <ChevronDown className="h-3.5 w-3.5" />}
                          </ActionIcon>
                        )}
                        {/* Approve */}
                        <button type="button" disabled={!canAct}
                          onClick={approve}
                          className="flex h-8 items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-3 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-30">
                          <ThumbsUp className="h-3.5 w-3.5" />
                          Valider
                        </button>
                        {/* Revision */}
                        <ActionIcon title="Demander une révision" disabled={!canAct}
                          className={cn(isRevising && "border-amber-400 bg-amber-100 text-amber-700")}
                          onClick={() => { setError(null); setRejectingId(null); setRejectionReason(""); setMoreOpenId(null);
                            setRevisingId((c) => c === reviewId ? null : reviewId); setRevisionNote(""); }}>
                          <MessageSquareDiff className="h-3.5 w-3.5 text-amber-500" />
                        </ActionIcon>
                        {/* Reject */}
                        <ActionIcon title="Rejeter" disabled={!canAct}
                          className={cn(isRejecting && "border-destructive/40 bg-destructive/10 text-destructive")}
                          onClick={() => { setError(null); setRevisingId(null); setRevisionNote(""); setMoreOpenId(null);
                            setRejectingId((c) => c === reviewId ? null : reviewId); setRejectionReason(""); }}>
                          <ThumbsDown className="h-3.5 w-3.5 text-destructive/60" />
                        </ActionIcon>
                      </div>

                      {/* ── Mobile actions (<sm) ── */}
                      <div className="flex sm:hidden items-center gap-1.5 shrink-0">
                        {/* Play / clips toggle */}
                        {!isBatch ? (
                          <button type="button" disabled={!canAct}
                            aria-label="Voir la vidéo"
                            onClick={() => videoPreview.open({ id: row.videoId, fileUrl: row.fileUrl, videoType: row.videoType, resolution: row.resolution, durationSeconds: row.durationSeconds })}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-white text-foreground/45 transition hover:bg-frost disabled:opacity-30">
                            <Play className="h-3.5 w-3.5" />
                          </button>
                        ) : (
                          <button type="button"
                            aria-label={expandedBatchId === row.batchId ? "Masquer les clips" : "Voir les clips"}
                            onClick={() => void toggleBatchClips(row.batchId!)}
                            className={cn(
                              "flex h-8 w-8 items-center justify-center rounded-lg border transition",
                              expandedBatchId === row.batchId
                                ? "border-secondary/40 bg-secondary/10 text-secondary"
                                : "border-line bg-white text-foreground/45 hover:bg-frost"
                            )}>
                            {expandedBatchId === row.batchId
                              ? <ChevronUp className="h-3.5 w-3.5" />
                              : <ChevronDown className="h-3.5 w-3.5" />}
                          </button>
                        )}
                        {/* Approve */}
                        <button type="button" disabled={!canAct}
                          aria-label="Valider"
                          onClick={approve}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-700 transition hover:bg-emerald-100 active:scale-95 disabled:opacity-30">
                          <ThumbsUp className="h-3.5 w-3.5" />
                        </button>
                        {/* Revision */}
                        <button type="button" disabled={!canAct}
                          aria-label="Demander une révision"
                          onClick={() => { setError(null); setRejectingId(null); setRejectionReason(""); setMoreOpenId(null);
                            setRevisingId((c) => c === reviewId ? null : reviewId); setRevisionNote(""); }}
                          className={cn(
                            "flex h-8 w-8 items-center justify-center rounded-lg border transition disabled:opacity-30",
                            isRevising
                              ? "border-amber-400 bg-amber-100 text-amber-700"
                              : "border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100"
                          )}>
                          <MessageSquareDiff className="h-3.5 w-3.5" />
                        </button>
                        {/* Reject */}
                        <button type="button" disabled={!canAct}
                          aria-label="Rejeter"
                          onClick={() => { setError(null); setRevisingId(null); setRevisionNote(""); setMoreOpenId(null);
                            setRejectingId((c) => c === reviewId ? null : reviewId); setRejectionReason(""); }}
                          className={cn(
                            "flex h-8 w-8 items-center justify-center rounded-lg border transition disabled:opacity-30",
                            isRejecting
                              ? "border-destructive/40 bg-destructive/10 text-destructive"
                              : "border-destructive/15 bg-destructive/5 text-destructive/50 hover:bg-destructive/10"
                          )}>
                          <ThumbsDown className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Mobile meta row */}
                    <div className="flex sm:hidden items-center gap-2 px-6 pb-2 text-[10px] text-foreground/35">
                      {formatDate(row.uploadedAt)}
                      {isBatch
                        ? ` · lot de ${row.clipCount ?? "?"} clips`
                        : ` · ${row.durationSeconds}s · ${row.resolution}`}
                    </div>

                    {/* ── Revision panel ── */}
                    {isRevising && (
                      <div className="mx-1 mb-3 rounded-2xl border border-amber-200 bg-amber-50/80 p-4">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold uppercase tracking-[0.12em] text-amber-700">
                            {isBatch ? "Demande de révision du lot" : "Demande de modification"}
                          </p>
                          <button type="button" onClick={() => { setRevisingId(null); setRevisionNote(""); }}
                            className="text-amber-500 hover:text-amber-700">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <p className="mt-0.5 text-xs text-amber-600/60">
                          Le créateur reçoit cette note par email.
                        </p>
                        <Textarea value={revisionNote} onChange={(e) => setRevisionNote(e.target.value)}
                          placeholder="Ex: Lumière insuffisante, retourne en plein jour. Ajoute des sous-titres…"
                          className="mt-2 border-amber-200 bg-white focus:border-amber-400 focus-visible:ring-amber-300/50 focus-visible:ring-offset-0" rows={3} autoFocus />
                        <div className="mt-3 flex gap-2">
                          <Button size="sm" className="bg-amber-500 text-white hover:bg-amber-600"
                            onClick={confirmRevision}
                            disabled={!canAct || !revisionNote.trim()}>
                            Envoyer la demande
                          </Button>
                          <Button size="sm" variant="outline"
                            onClick={() => { setRevisingId(null); setRevisionNote(""); }}>
                            Annuler
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* ── Batch clips gallery ── */}
                    {isBatch && expandedBatchId === row.batchId && (
                      <div className="mx-1 mb-3 rounded-2xl border border-secondary/15 bg-secondary/[0.03] p-4">
                        <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.14em] text-secondary/70">
                          Clips du lot ({row.clipCount ?? "?"})
                        </p>
                        {clipsLoading === row.batchId ? (
                          <p className="text-xs text-foreground/40">Chargement...</p>
                        ) : (batchClips[row.batchId!] ?? []).length === 0 ? (
                          <p className="text-xs text-foreground/40">Aucun clip trouvé.</p>
                        ) : (
                          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                            {(batchClips[row.batchId!] ?? []).map((clip, idx) => (
                              <button
                                key={clip.id}
                                type="button"
                                onClick={() => videoPreview.open({ id: clip.id, fileUrl: clip.fileUrl, videoType: clip.videoType, resolution: clip.resolution, durationSeconds: clip.durationSeconds })}
                                className="flex items-center gap-2 rounded-xl border border-line bg-white px-3 py-2.5 text-left transition hover:border-secondary/30 hover:bg-secondary/[0.04]"
                              >
                                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
                                  <Play className="h-3.5 w-3.5" />
                                </span>
                                <div className="min-w-0">
                                  <p className="text-[11px] font-bold text-foreground/70">Clip {idx + 1}</p>
                                  <p className="text-[10px] text-foreground/35">{clip.resolution}</p>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* ── Rejection panel ── */}
                    {isRejecting && (
                      <div className="mx-1 mb-3 rounded-2xl border border-destructive/15 bg-destructive/5 p-4">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold uppercase tracking-[0.12em] text-destructive/70">
                            {isBatch ? "Raison du rejet du lot" : "Raison du rejet"}
                          </p>
                          <button type="button" onClick={() => { setRejectingId(null); setRejectionReason(""); }}
                            className="text-destructive/40 hover:text-destructive/70">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <Textarea value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)}
                          placeholder="Hook trop tard, format horizontal, sous-titres illisibles…"
                          className="mt-2" rows={3} autoFocus />
                        <div className="mt-3 flex gap-2">
                          <Button size="sm" variant="destructive"
                            onClick={confirmReject}
                            disabled={!canAct || !rejectionReason.trim()}>
                            Confirmer le rejet
                          </Button>
                          <Button size="sm" variant="outline"
                            onClick={() => { setRejectingId(null); setRejectionReason(""); }}>
                            Annuler
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {pageCount > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-[11px] text-foreground/40">
                {page + 1} / {pageCount} · {filteredRows.length} vidéos
              </p>
              <div className="flex gap-1.5">
                <button type="button" disabled={page === 0} onClick={() => setPage((p) => p - 1)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-line bg-white text-foreground/50 transition hover:bg-frost disabled:opacity-25">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button type="button" disabled={page >= pageCount - 1} onClick={() => setPage((p) => p + 1)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-line bg-white text-foreground/50 transition hover:bg-frost disabled:opacity-25">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <VideoPreviewModal preview={videoPreview} title="Preview Video" />
    </CardSection>
  );
}
