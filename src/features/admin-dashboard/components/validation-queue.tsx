"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MessageSquareDiff, Play, ThumbsDown, ThumbsUp, ChevronLeft, ChevronRight, Search } from "lucide-react";

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
  }>;
}

const PAGE_SIZE = 10;

function formatDate(ts: string): string {
  return new Date(ts).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "2-digit" });
}

function formatTime(ts: string): string {
  return new Date(ts).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function VideoTypePill({ type }: { type: string }) {
  const colors: Record<string, string> = {
    OOTD: "bg-violet-100 text-violet-700 border-violet-200",
    TRAINING: "bg-blue-100 text-blue-700 border-blue-200",
    BEFORE_AFTER: "bg-emerald-100 text-emerald-700 border-emerald-200",
    SPORTS_80S: "bg-rose-100 text-rose-700 border-rose-200",
    CINEMATIC: "bg-amber-100 text-amber-700 border-amber-200",
  };
  const cls = colors[type] ?? "bg-foreground/10 text-foreground/70 border-transparent";
  return (
    <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider", cls)}>
      {type.replace("_", " ")}
    </span>
  );
}

export function ValidationQueue({ rows }: ValidationQueueProps) {
  const auth = useAuth();
  const router = useRouter();
  const canAct = Boolean(auth.user);

  // Per-card inline panels
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [revisingId, setRevisingId] = useState<string | null>(null);
  const [revisionNote, setRevisionNote] = useState("");

  // Bulk actions
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkRejecting, setBulkRejecting] = useState(false);
  const [bulkRejectionReason, setBulkRejectionReason] = useState("");

  // Filters
  const [creatorFilter, setCreatorFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [dateFilter, setDateFilter] = useState<"ALL" | "7D" | "30D">("ALL");

  // Pagination
  const [page, setPage] = useState(0);

  const [error, setError] = useState<string | null>(null);

  const videoPreview = useVideoPreview("/api/videos/preview");

  const videoTypes = useMemo(() => {
    return Array.from(new Set(rows.map((r) => r.videoType))).sort((a, b) => a.localeCompare(b));
  }, [rows]);

  const filteredRows = useMemo(() => {
    const needle = creatorFilter.trim().toLowerCase();
    const now = Date.now();
    const minTs =
      dateFilter === "7D" ? now - 7 * 86_400_000 :
      dateFilter === "30D" ? now - 30 * 86_400_000 : null;

    return rows
      .filter((r) => {
        if (typeFilter !== "ALL" && r.videoType !== typeFilter) return false;
        if (minTs) {
          const ts = Date.parse(r.uploadedAt);
          if (Number.isFinite(ts) && ts < minTs) return false;
        }
        if (needle && !r.creatorHandle.toLowerCase().includes(needle)) return false;
        return true;
      })
      .sort((a, b) => Date.parse(b.uploadedAt) - Date.parse(a.uploadedAt));
  }, [rows, creatorFilter, typeFilter, dateFilter]);

  const pageCount = Math.ceil(filteredRows.length / PAGE_SIZE);
  const pageRows = filteredRows.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  // Reset page on filter change
  const updateCreatorFilter = useCallback((v: string) => { setCreatorFilter(v); setPage(0); }, []);
  const updateTypeFilter = useCallback((v: string) => { setTypeFilter(v); setPage(0); }, []);
  const updateDateFilter = useCallback((v: "ALL" | "7D" | "30D") => { setDateFilter(v); setPage(0); }, []);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectedIds((prev) => {
      const pageIds = pageRows.map((r) => r.videoId);
      const allSelected = pageIds.every((id) => prev.has(id));
      const next = new Set(prev);
      if (allSelected) pageIds.forEach((id) => next.delete(id));
      else pageIds.forEach((id) => next.add(id));
      return next;
    });
  }, [pageRows]);

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
          const data = (await res.json().catch(() => null)) as { message?: string } | null;
          throw new Error(data?.message ?? "Impossible de mettre à jour les vidéos.");
        }
        const data = (await res.json().catch(() => null)) as { results?: Array<{ videoId: string; ok: boolean; error?: string }> } | null;
        const failures = data?.results?.filter((r) => !r.ok) ?? [];
        if (failures.length > 0) {
          setError(`${failures.length}/${videoIds.length} vidéo(s) en erreur. ${failures[0]?.error ?? ""}`);
        }
        setRejectingId(null); setRejectionReason("");
        setRevisingId(null); setRevisionNote("");
        setBulkRejecting(false); setBulkRejectionReason("");
        setSelectedIds(new Set());
        router.refresh();
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Impossible de mettre à jour les vidéos.");
      }
    },
    [canAct, router]
  );

  const reviewOne = useCallback(
    (videoId: string, decision: "approved" | "rejected" | "revision_requested", reason?: string | null) =>
      reviewMany([videoId], decision, reason),
    [reviewMany]
  );

  const allPageSelected = pageRows.length > 0 && pageRows.every((r) => selectedIds.has(r.videoId));
  const somePageSelected = pageRows.some((r) => selectedIds.has(r.videoId));
  const selectedCount = selectedIds.size;

  return (
    <CardSection className="space-y-4 rounded-[20px]">
      {/* Header */}
      <div className="flex items-center justify-between">
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
      </div>

      {/* Error */}
      {error ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive" role="alert">
          {error}
        </div>
      ) : null}

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-line bg-frost/70 px-4 py-8 text-center text-sm text-foreground/50">
          Rien à valider pour le moment.
        </div>
      ) : (
        <div className="space-y-3">

          {/* Filters */}
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="relative flex-1 sm:max-w-[220px]">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-foreground/40" />
              <Input
                value={creatorFilter}
                onChange={(e) => updateCreatorFilter(e.target.value)}
                placeholder="Créateur..."
                aria-label="Filtrer par créateur"
                className="h-9 pl-8 text-sm"
              />
            </div>
            <select
              value={typeFilter}
              onChange={(e) => updateTypeFilter(e.target.value)}
              aria-label="Filtrer par type"
              className="h-9 rounded-xl border border-line bg-white px-3 text-sm"
            >
              <option value="ALL">Tous les types</option>
              {videoTypes.map((t) => (
                <option key={t} value={t}>{t.replace("_", " ")}</option>
              ))}
            </select>
            <select
              value={dateFilter}
              onChange={(e) => updateDateFilter(e.target.value as "ALL" | "7D" | "30D")}
              aria-label="Filtrer par période"
              className="h-9 rounded-xl border border-line bg-white px-3 text-sm"
            >
              <option value="ALL">Toutes les dates</option>
              <option value="7D">7 derniers jours</option>
              <option value="30D">30 derniers jours</option>
            </select>
          </div>

          {/* Bulk selection bar */}
          {selectedCount > 0 ? (
            <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-line bg-frost/80 px-4 py-2.5">
              <span className="text-sm font-semibold text-foreground/80">
                {selectedCount} sélectionné{selectedCount > 1 ? "s" : ""}
              </span>
              <div className="ml-auto flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                  onClick={() => void reviewMany(Array.from(selectedIds), "approved")}
                  disabled={!canAct}
                >
                  <ThumbsUp className="mr-1.5 h-3.5 w-3.5" />
                  Valider tout
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setBulkRejecting(true)}
                  disabled={!canAct}
                >
                  <ThumbsDown className="mr-1.5 h-3.5 w-3.5" />
                  Rejeter tout
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="text-foreground/50"
                  onClick={() => setSelectedIds(new Set())}
                >
                  Effacer
                </Button>
              </div>
            </div>
          ) : null}

          {/* Bulk rejection form */}
          {bulkRejecting && selectedCount > 0 ? (
            <div className="rounded-2xl border border-line bg-frost/70 p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-foreground/70">
                Raison du rejet (lot de {selectedCount})
              </p>
              <Textarea
                value={bulkRejectionReason}
                onChange={(e) => setBulkRejectionReason(e.target.value)}
                placeholder="Ex: Hook trop tard, format horizontal, sous-titres illisibles..."
                className="mt-2"
                rows={3}
              />
              <div className="mt-3 flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => void reviewMany(Array.from(selectedIds), "rejected", bulkRejectionReason)}
                  disabled={!canAct || bulkRejectionReason.trim().length === 0}
                >
                  Confirmer le rejet
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => { setBulkRejecting(false); setBulkRejectionReason(""); }}
                >
                  Annuler
                </Button>
              </div>
            </div>
          ) : null}

          {/* Select-all row */}
          {filteredRows.length > 0 ? (
            <div className="flex items-center gap-2 px-1">
              <input
                type="checkbox"
                className="h-4 w-4 accent-secondary"
                checked={allPageSelected}
                ref={(el) => { if (el) el.indeterminate = somePageSelected && !allPageSelected; }}
                onChange={toggleSelectAll}
                aria-label="Sélectionner toute la page"
              />
              <span className="text-xs text-foreground/50">
                {filteredRows.length} vidéo{filteredRows.length > 1 ? "s" : ""} à valider
              </span>
            </div>
          ) : null}

          {/* Cards */}
          {pageRows.length === 0 ? (
            <div className="rounded-2xl border border-line bg-frost/70 px-4 py-6 text-center text-sm text-foreground/60">
              Aucun résultat dans cette vue.
            </div>
          ) : (
            <div className="space-y-2">
              {pageRows.map((row) => {
                const isRejecting = rejectingId === row.videoId;
                const isRevising = revisingId === row.videoId;
                const isSelected = selectedIds.has(row.videoId);

                return (
                  <div
                    key={row.videoId}
                    className={cn(
                      "rounded-2xl border bg-white transition-all",
                      isSelected ? "border-secondary/40 bg-secondary/5" : "border-line"
                    )}
                  >
                    {/* Card body */}
                    <div className="flex items-start gap-3 p-4">
                      {/* Checkbox */}
                      <div className="mt-0.5 shrink-0">
                        <input
                          type="checkbox"
                          className="h-4 w-4 accent-secondary"
                          checked={isSelected}
                          onChange={() => toggleSelect(row.videoId)}
                          aria-label={`Sélectionner ${row.creatorHandle}`}
                        />
                      </div>

                      {/* Main info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-bold text-foreground/90">
                            @{row.creatorHandle}
                          </span>
                          <VideoTypePill type={row.videoType} />
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-foreground/45">
                          <span>{formatDate(row.uploadedAt)} · {formatTime(row.uploadedAt)}</span>
                          <span>{row.durationSeconds}s</span>
                          <span>{row.resolution}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions row */}
                    <div className="flex items-center gap-2 border-t border-line/60 px-4 py-3">
                      {/* Preview — left-aligned, slightly prominent */}
                      <button
                        type="button"
                        className="flex items-center gap-1.5 rounded-xl border border-line bg-frost/60 px-3 py-1.5 text-xs font-semibold text-foreground/70 transition hover:bg-frost hover:text-foreground disabled:opacity-40"
                        onClick={() =>
                          videoPreview.open({
                            id: row.videoId,
                            fileUrl: row.fileUrl,
                            videoType: row.videoType,
                            resolution: row.resolution,
                            durationSeconds: row.durationSeconds,
                          })
                        }
                        disabled={!canAct}
                        aria-label="Voir la vidéo"
                      >
                        <Play className="h-3.5 w-3.5" />
                        Voir
                      </button>

                      {/* Spacer */}
                      <div className="flex-1" />

                      {/* Decision buttons — right-aligned */}
                      <button
                        type="button"
                        className="flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-40"
                        onClick={() => void reviewOne(row.videoId, "approved")}
                        disabled={!canAct}
                        aria-label="Valider"
                      >
                        <ThumbsUp className="h-3.5 w-3.5" />
                        Valider
                      </button>

                      <button
                        type="button"
                        className={cn(
                          "flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition disabled:opacity-40",
                          isRevising
                            ? "border-amber-400 bg-amber-400 text-white"
                            : "border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100"
                        )}
                        onClick={() => {
                          setError(null);
                          setRejectingId(null); setRejectionReason("");
                          setRevisingId((cur) => cur === row.videoId ? null : row.videoId);
                          setRevisionNote("");
                        }}
                        disabled={!canAct}
                        aria-label="Demander une révision"
                        aria-expanded={isRevising}
                      >
                        <MessageSquareDiff className="h-3.5 w-3.5" />
                        Révision
                      </button>

                      <button
                        type="button"
                        className={cn(
                          "flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition disabled:opacity-40",
                          isRejecting
                            ? "border-destructive bg-destructive text-white"
                            : "border-destructive/30 bg-destructive/5 text-destructive hover:bg-destructive/10"
                        )}
                        onClick={() => {
                          setError(null);
                          setRevisingId(null); setRevisionNote("");
                          setRejectingId((cur) => cur === row.videoId ? null : row.videoId);
                          setRejectionReason("");
                        }}
                        disabled={!canAct}
                        aria-label="Rejeter"
                        aria-expanded={isRejecting}
                      >
                        <ThumbsDown className="h-3.5 w-3.5" />
                        Rejeter
                      </button>
                    </div>

                    {/* Inline revision panel */}
                    {isRevising ? (
                      <div className="rounded-b-2xl border-t border-amber-200 bg-amber-50/80 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.12em] text-amber-700">
                          Demande de modification
                        </p>
                        <p className="mt-0.5 text-xs text-amber-600/70">
                          Le créateur recevra cette note par email.
                        </p>
                        <Textarea
                          value={revisionNote}
                          onChange={(e) => setRevisionNote(e.target.value)}
                          placeholder="Ex: La lumière est insuffisante, retourne en plein jour. Ajoute des sous-titres..."
                          className="mt-2 border-amber-200 bg-white focus:border-amber-400"
                          rows={3}
                          autoFocus
                        />
                        <div className="mt-3 flex gap-2">
                          <Button
                            type="button"
                            size="sm"
                            className="bg-amber-500 text-white hover:bg-amber-600"
                            onClick={() => void reviewOne(row.videoId, "revision_requested", revisionNote)}
                            disabled={!canAct || revisionNote.trim().length === 0}
                          >
                            Envoyer la demande
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => { setRevisingId(null); setRevisionNote(""); }}
                          >
                            Annuler
                          </Button>
                        </div>
                      </div>
                    ) : null}

                    {/* Inline rejection panel */}
                    {isRejecting ? (
                      <div className="rounded-b-2xl border-t border-destructive/15 bg-destructive/5 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.12em] text-destructive/70">
                          Raison du rejet
                        </p>
                        <Textarea
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          placeholder="Ex: Hook trop tard, format horizontal, sous-titres illisibles..."
                          className="mt-2"
                          rows={3}
                          autoFocus
                        />
                        <div className="mt-3 flex gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            onClick={() => void reviewOne(row.videoId, "rejected", rejectionReason)}
                            disabled={!canAct || rejectionReason.trim().length === 0}
                          >
                            Confirmer le rejet
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => { setRejectingId(null); setRejectionReason(""); }}
                          >
                            Annuler
                          </Button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {pageCount > 1 ? (
            <div className="flex items-center justify-between px-1 pt-1">
              <p className="text-xs text-foreground/50">
                Page {page + 1} / {pageCount}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={page === 0}
                  onClick={() => setPage((p) => p - 1)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-white text-foreground/60 transition hover:bg-frost disabled:opacity-30"
                  aria-label="Page précédente"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  disabled={page >= pageCount - 1}
                  onClick={() => setPage((p) => p + 1)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-white text-foreground/60 transition hover:bg-frost disabled:opacity-30"
                  aria-label="Page suivante"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : null}
        </div>
      )}

      <VideoPreviewModal preview={videoPreview} title="Preview Video" />
    </CardSection>
  );
}
