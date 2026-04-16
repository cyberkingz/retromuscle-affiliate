"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, UploadCloud } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CardSection } from "@/components/layout/card-section";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { StatusBadge } from "@/components/ui/status-badge";
import { VIDEO_STATUS_LABELS, VIDEO_TYPE_LABELS } from "@/domain/constants/labels";
import { type VideoAsset, type VideoType } from "@/domain/types";
import { cn } from "@/lib/cn";
import { useAuth } from "@/features/auth/context/auth-context";
import { formatCurrency } from "@/lib/currency";

interface UploadCardProps {
  monthlyTrackingId: string;
  ratesByType: Array<{
    videoType: VideoType;
    label: string;
    ratePerVideo: number;
  }>;
  specs: string[];
  tips: Record<string, string[]>;
  pendingReviewCount: number;
  rejectedCount: number;
  recentVideos: Array<{
    id: string;
    videoType: VideoType;
    status: string;
    createdAt: string;
    fileUrl: string;
    rejectionReason?: string;
  }>;
}

const RECOMMENDED_MAX_VIDEO_BYTES = 500 * 1024 * 1024;
const VIDEO_METADATA_TIMEOUT_MS = 8_000;
const PREFERRED_VIDEO_MIME_TYPES = new Set(["video/mp4", "video/quicktime", "video/mov"]);
const PREFERRED_VIDEO_EXTENSIONS = new Set(["mp4", "mov"]);

function sanitizeFilename(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return "video.mp4";
  }
  return trimmed.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 96);
}

async function readVideoMetadata(
  file: File
): Promise<{ durationSeconds: number; width: number; height: number }> {
  const objectUrl = URL.createObjectURL(file);

  try {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;
    video.src = objectUrl;

    await new Promise<void>((resolve, reject) => {
      const timeoutId = window.setTimeout(() => {
        reject(
          new Error(
            "Impossible de lire les métadonnées (timeout). Vérifie que le fichier est un MP4/MOV valide."
          )
        );
      }, VIDEO_METADATA_TIMEOUT_MS);

      function cleanup() {
        window.clearTimeout(timeoutId);
        video.onloadedmetadata = null;
        video.onerror = null;
      }

      video.onloadedmetadata = () => {
        cleanup();
        resolve();
      };

      video.onerror = () => {
        cleanup();
        reject(
          new Error("Impossible de lire la vidéo. Vérifie que le fichier est un MP4/MOV valide.")
        );
      };
    });

    return {
      durationSeconds: Math.max(1, Math.round(video.duration)),
      width: video.videoWidth,
      height: video.videoHeight
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function getFileExtension(filename: string): string {
  const value = filename.trim().toLowerCase();
  if (!value.includes(".")) {
    return "";
  }
  return value.split(".").pop() ?? "";
}

function isPreferredVideoFile(file: File): boolean {
  const mime = file.type.trim().toLowerCase();
  const extension = getFileExtension(file.name);

  if (PREFERRED_VIDEO_MIME_TYPES.has(mime)) {
    return true;
  }

  if (!mime && PREFERRED_VIDEO_EXTENSIONS.has(extension)) {
    return true;
  }

  return PREFERRED_VIDEO_EXTENSIONS.has(extension);
}

function resolveAllowedResolution(width: number, height: number): VideoAsset["resolution"] | null {
  const value = `${width}x${height}`;
  if (value === "1080x1920" || value === "1080x1080") {
    return value;
  }
  return null;
}

export function UploadCard({
  monthlyTrackingId,
  ratesByType,
  specs,
  tips,
  pendingReviewCount,
  rejectedCount,
  recentVideos
}: UploadCardProps) {
  const auth = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [activeType, setActiveType] = useState<VideoType | null>(ratesByType[0]?.videoType ?? null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resolvedTrackingId, setResolvedTrackingId] = useState(monthlyTrackingId);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const hasActiveVideoTypes = ratesByType.length > 0;
  const canUpload = Boolean(auth.user && !uploading && hasActiveVideoTypes && activeType);

  useEffect(() => {
    setResolvedTrackingId(monthlyTrackingId);
  }, [monthlyTrackingId]);

  useEffect(() => {
    if (ratesByType.length === 0) {
      setActiveType(null);
      return;
    }

    setActiveType((current) => {
      if (current && ratesByType.some((item) => item.videoType === current)) {
        return current;
      }
      return ratesByType[0].videoType;
    });
  }, [ratesByType]);

  const tipsForType = useMemo(() => {
    if (!activeType) return [];
    const value = tips[activeType];
    return Array.isArray(value) ? value : [];
  }, [tips, activeType]);

  const activeRateLabel = useMemo(() => {
    if (!activeType) return "--";
    const rate = ratesByType.find((item) => item.videoType === activeType)?.ratePerVideo ?? 0;
    return formatCurrency(rate);
  }, [ratesByType, activeType]);

  async function previewVideo(fileUrl: string) {
    setErrorMessage(null);
    try {
      const response = await fetch(`/api/videos/preview?fileUrl=${encodeURIComponent(fileUrl)}`, {
        cache: "no-store"
      });
      const data = (await response.json().catch(() => null)) as {
        signedUrl?: string;
        message?: string;
      } | null;
      if (!response.ok || !data?.signedUrl) {
        throw new Error(data?.message ?? "Impossible de générer un lien de preview.");
      }

      window.open(data.signedUrl, "_blank", "noopener,noreferrer");
    } catch (caught) {
      setErrorMessage(
        caught instanceof Error ? caught.message : "Impossible de générer un lien de preview."
      );
    }
  }

  async function handleFile(file: File) {
    if (!auth.user) {
      router.replace("/login");
      return;
    }
    if (!activeType) {
      setErrorMessage("Aucun type de vidéo actif. Contacte un administrateur.");
      return;
    }

    setUploading(true);
    setStatusMessage(null);
    setWarningMessage(null);
    setErrorMessage(null);

    try {
      const filename = sanitizeFilename(file.name);
      const warnings: string[] = [];

      if (file.size > RECOMMENDED_MAX_VIDEO_BYTES) {
        warnings.push(
          "Le fichier dépasse 500 MB (recommandé). Upload accepté, mais le traitement peut être plus lent."
        );
      }

      if (!isPreferredVideoFile(file)) {
        warnings.push(
          "Format non préféré détecté. MP4/MOV sont recommandés, mais l'upload est accepté."
        );
      }

      let durationSeconds = 30;
      let resolution: VideoAsset["resolution"] = "1080x1920";
      try {
        const meta = await readVideoMetadata(file);
        const resolvedResolution = resolveAllowedResolution(meta.width, meta.height);
        if (resolvedResolution) {
          resolution = resolvedResolution;
        } else {
          warnings.push(
            `Resolution ${meta.width}x${meta.height} hors recommandation (1080x1920 ou 1080x1080). Valeur par défaut appliquée.`
          );
        }

        if (meta.durationSeconds >= 15 && meta.durationSeconds <= 60) {
          durationSeconds = meta.durationSeconds;
        } else {
          warnings.push(
            `Durée hors recommandation (${meta.durationSeconds}s). Cible : 15 à 60 secondes. Valeur par défaut appliquée.`
          );
        }
      } catch (metadataError) {
        warnings.push(
          metadataError instanceof Error
            ? `${metadataError.message} Upload continué avec valeurs par défaut (30s, 1080x1920).`
            : "Métadonnées non lues. Upload continué avec valeurs par défaut (30s, 1080x1920)."
        );
      }

      if (warnings.length > 0) {
        setWarningMessage(warnings.join(" "));
      }

      const fileSizeMb = Math.max(1, Math.ceil(file.size / (1024 * 1024)));

      setStatusMessage("Upload vers RetroMuscle...");

      const signed = await fetch("/api/creator/uploads/video/signed-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          monthlyTrackingId: resolvedTrackingId,
          videoType: activeType,
          filename
        })
      });

      const signedPayload = (await signed.json().catch(() => null)) as {
        key?: string;
        signedUrl?: string;
        monthlyTrackingId?: string;
        message?: string;
      } | null;

      if (!signed.ok || !signedPayload?.key || !signedPayload.signedUrl) {
        throw new Error(signedPayload?.message ?? "Impossible de préparer l'upload.");
      }

      const trackingIdForUpload = signedPayload.monthlyTrackingId ?? resolvedTrackingId;
      if (!trackingIdForUpload) {
        throw new Error("Suivi mensuel introuvable.");
      }
      setResolvedTrackingId(trackingIdForUpload);

      const signedUrl = signedPayload.signedUrl;
      const uploadForm = new FormData();
      uploadForm.append("cacheControl", "3600");
      // Supabase Storage expects a multipart form with an empty field name for the file (mirrors storage-js).
      uploadForm.append("", file);

      setUploadProgress(0);
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", signedUrl);
        xhr.setRequestHeader("x-upsert", "false");
        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable && event.total > 0) {
            setUploadProgress(Math.round((event.loaded / event.total) * 100));
          }
        });
        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error("Upload impossible. Réessaie dans quelques instants."));
          }
        });
        xhr.addEventListener("error", () =>
          reject(new Error("Upload impossible. Réessaie dans quelques instants."))
        );
        xhr.send(uploadForm);
      });

      const response = await fetch("/api/creator/uploads/video", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          monthlyTrackingId: trackingIdForUpload,
          videoType: activeType,
          fileUrl: signedPayload.key,
          durationSeconds,
          resolution,
          fileSizeMb
        })
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(data?.message ?? "Impossible d'enregistrer la vidéo.");
      }

      setStatusMessage("Vidéo envoyée. En attente de validation.");
      router.refresh();
    } catch (caught) {
      setErrorMessage(caught instanceof Error ? caught.message : "Upload impossible.");
      setStatusMessage(null);
      setWarningMessage(null);
    } finally {
      setUploading(false);
      setDragActive(false);
    }
  }

  return (
    <CardSection className="space-y-4">
      <p className="text-xs uppercase tracking-[0.15em] text-foreground/75">
        Upload catégorie active
      </p>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {ratesByType.map((rate) => (
            <Button
              key={rate.videoType}
              type="button"
              size="sm"
              variant={activeType === rate.videoType ? "default" : "outline"}
              onClick={() => setActiveType(rate.videoType)}
              disabled={uploading}
            >
              {rate.label}
            </Button>
          ))}
        </div>
        <StatusBadge
          label={`${pendingReviewCount} à valider · ${rejectedCount} rejetées`}
          tone={rejectedCount > 0 ? "warning" : "neutral"}
        />
      </div>
      {!hasActiveVideoTypes ? (
        <div
          className="rounded-2xl border border-amber-400/40 bg-amber-50 px-4 py-3 text-sm text-amber-900"
          role="alert"
        >
          Aucun type de vidéo actif pour le moment. Contacte l&apos;équipe RetroMuscle.
        </div>
      ) : null}

      {statusMessage ? (
        <div className="rounded-2xl border border-line bg-frost/70 px-4 py-3 text-sm text-foreground/75">
          {statusMessage}
        </div>
      ) : null}
      {warningMessage ? (
        <div
          className="flex items-start gap-3 rounded-2xl border border-amber-400/40 bg-amber-50 px-4 py-3 text-sm text-amber-900"
          role="alert"
        >
          <span className="mt-0.5 shrink-0 text-lg leading-none" aria-hidden="true">
            &#9888;
          </span>
          <span>{warningMessage}</span>
        </div>
      ) : null}
      {errorMessage ? (
        <div
          className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          role="alert"
        >
          {errorMessage}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.12em] text-foreground/75">
            Specs conseillees
          </p>
          <ul className="space-y-1 text-sm text-foreground/70">
            {specs.map((spec) => (
              <li key={spec}>- {spec}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.12em] text-foreground/75">
            Tips {activeType ? VIDEO_TYPE_LABELS[activeType] : "type inactif"}
          </p>
          <ul className="space-y-1 text-sm text-foreground/70">
            {tipsForType.map((tip) => (
              <li key={tip}>- {tip}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-white/85 px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs uppercase tracking-[0.12em] text-foreground/70">
            Tarif du type sélectionné
          </p>
          <p className="font-display text-2xl uppercase leading-none text-secondary">
            {activeRateLabel}
          </p>
        </div>
        <p className="mt-1 text-xs text-foreground/60">
          Paiement déclenché uniquement après validation de la vidéo.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {ratesByType.map((rate) => (
            <span
              key={rate.videoType}
              className={cn(
                "rounded-full border px-3 py-1 text-xs",
                rate.videoType === activeType
                  ? "border-secondary/50 bg-secondary/10 text-secondary"
                  : "border-line bg-frost/70 text-foreground/70"
              )}
            >
              {rate.label}: {formatCurrency(rate.ratePerVideo)}
            </span>
          ))}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) {
            setPendingFile(file);
          }
        }}
      />

      <div
        className={cn(
          "relative overflow-hidden rounded-2xl border border-dashed px-4 py-10 text-center text-sm transition-colors sm:px-6",
          dragActive ? "border-secondary bg-secondary/10" : "border-foreground/25 bg-frost/80",
          !canUpload && "opacity-75"
        )}
        onClick={() => {
          if (canUpload) fileInputRef.current?.click();
        }}
        onDragEnter={(event) => {
          event.preventDefault();
          if (canUpload) setDragActive(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          if (canUpload) setDragActive(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          setDragActive(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setDragActive(false);
          if (!canUpload) return;
          const file = event.dataTransfer.files?.[0];
          if (file) {
            setPendingFile(file);
          }
        }}
        role="button"
        tabIndex={0}
        aria-label="Zone de glisser-deposer video"
        onKeyDown={(event) => {
          if ((event.key === "Enter" || event.key === " ") && canUpload) {
            event.preventDefault();
            fileInputRef.current?.click();
          }
        }}
      >
        <UploadCloud className="mx-auto mb-3 h-10 w-10 text-secondary" />
        <p className="font-medium text-foreground" aria-live="polite" aria-atomic="true">
          {uploading ? `Upload en cours... ${uploadProgress}%` : "Glisse-dépose ta vidéo ici"}
        </p>
        {uploading ? (
          <progress
            className="sr-only"
            value={uploadProgress}
            max={100}
            aria-label={`Progression de l'upload : ${uploadProgress}%`}
          />
        ) : null}
        {!uploading ? (
          <p className="mt-1 text-xs text-foreground/65">
            ou clique pour parcourir (tout format vidéo, MP4/MOV recommandés)
          </p>
        ) : null}
        <div className="mt-4 flex justify-center">
          <Button
            type="button"
            size="pill"
            variant="outline"
            disabled={!canUpload}
            onClick={(event) => {
              event.stopPropagation();
              fileInputRef.current?.click();
            }}
          >
            {uploading ? `Upload... ${uploadProgress}%` : "Parcourir les fichiers"}
          </Button>
        </div>
      </div>

      <Dialog
        open={pendingFile !== null}
        onOpenChange={(open) => {
          if (!open) setPendingFile(null);
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirmer le type de contenu</DialogTitle>
            <DialogDescription>
              Vérifie que le type sélectionné correspond bien à ton contenu avant de lancer
              l&apos;upload.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 px-6 pb-6">
            <div className="rounded-2xl border border-line bg-frost/70 p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-foreground/70">
                Type sélectionné
              </p>
              <p className="mt-1 font-display text-xl uppercase text-secondary">
                {activeType ? VIDEO_TYPE_LABELS[activeType] : "—"}
              </p>
              <p className="mt-1 text-xs text-foreground/60">
                Tarif&nbsp;: {activeRateLabel} par vidéo validée
              </p>
            </div>
            {pendingFile ? (
              <div className="rounded-2xl border border-line bg-frost/70 p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-foreground/70">Fichier</p>
                <p className="mt-1 truncate text-sm text-foreground/80">{pendingFile.name}</p>
              </div>
            ) : null}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setPendingFile(null)}
              >
                Annuler
              </Button>
              <Button
                type="button"
                className="flex-1"
                onClick={() => {
                  const file = pendingFile;
                  setPendingFile(null);
                  if (file) void handleFile(file);
                }}
              >
                Lancer l&apos;upload
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.12em] text-foreground/75">Derniers uploads</p>
        {recentVideos.length === 0 ? (
          <div className="rounded-2xl border border-line bg-frost/70 px-4 py-3 text-sm text-foreground/70">
            Aucun upload pour ce mois.
          </div>
        ) : (
          <div className="space-y-2">
            {recentVideos.map((video) => (
              <div
                key={video.id}
                className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-line bg-frost/70 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    {VIDEO_TYPE_LABELS[video.videoType]}
                  </p>
                  <p className="mt-1 text-xs text-foreground/65">
                    {new Date(video.createdAt).toLocaleString("fr-FR")}
                  </p>
                  {video.rejectionReason ? (
                    <p className="mt-2 text-xs text-destructive">Rejet: {video.rejectionReason}</p>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge
                    label={
                      VIDEO_STATUS_LABELS[video.status as keyof typeof VIDEO_STATUS_LABELS] ??
                      video.status
                    }
                    tone={
                      video.status === "approved"
                        ? "success"
                        : video.status === "rejected"
                          ? "warning"
                          : "neutral"
                    }
                  />
                  {video.status === "rejected" ? (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        const canReuploadThisType = ratesByType.some(
                          (rate) => rate.videoType === video.videoType
                        );
                        if (!canReuploadThisType) {
                          setErrorMessage("Ce type de vidéo est désactivé par l'administration.");
                          return;
                        }
                        setActiveType(video.videoType);
                        fileInputRef.current?.click();
                      }}
                      disabled={!canUpload}
                    >
                      Re-uploader
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => previewVideo(video.fileUrl)}
                    disabled={!auth.user}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Voir
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </CardSection>
  );
}
