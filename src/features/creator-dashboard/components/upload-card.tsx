"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, UploadCloud } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CardSection } from "@/components/layout/card-section";
import { StatusBadge } from "@/components/ui/status-badge";
import { VIDEO_STATUS_LABELS, VIDEO_TYPE_LABELS } from "@/domain/constants/labels";
import { VIDEO_TYPES, type VideoAsset, type VideoType } from "@/domain/types";
import { cn } from "@/lib/cn";
import { useAuth } from "@/features/auth/context/auth-context";

interface UploadCardProps {
  monthlyTrackingId: string;
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

const MAX_VIDEO_BYTES = 500 * 1024 * 1024;
const VIDEO_METADATA_TIMEOUT_MS = 8_000;
const ALLOWED_VIDEO_MIME_TYPES = new Set(["video/mp4", "video/quicktime", "video/mov"]);
const ALLOWED_VIDEO_EXTENSIONS = new Set(["mp4", "mov"]);

function sanitizeFilename(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return "video.mp4";
  }
  return trimmed.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 96);
}

async function readVideoMetadata(file: File): Promise<{ durationSeconds: number; width: number; height: number }> {
  const objectUrl = URL.createObjectURL(file);

  try {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;
    video.src = objectUrl;

    await new Promise<void>((resolve, reject) => {
      const timeoutId = window.setTimeout(() => {
        reject(new Error("VIDEO_METADATA_TIMEOUT"));
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
        reject(new Error("VIDEO_METADATA_UNREADABLE"));
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

function isAllowedVideoFile(file: File): boolean {
  const mime = file.type.trim().toLowerCase();
  const extension = getFileExtension(file.name);

  if (ALLOWED_VIDEO_MIME_TYPES.has(mime)) {
    return true;
  }

  if (!mime && ALLOWED_VIDEO_EXTENSIONS.has(extension)) {
    return true;
  }

  return ALLOWED_VIDEO_EXTENSIONS.has(extension);
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
  specs,
  tips,
  pendingReviewCount,
  rejectedCount,
  recentVideos
}: UploadCardProps) {
  const auth = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [activeType, setActiveType] = useState<VideoType>("CINEMATIC");
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const canUpload = Boolean(auth.user && !uploading);

  const tipsForType = useMemo(() => {
    const value = tips[activeType];
    return Array.isArray(value) ? value : [];
  }, [tips, activeType]);

  async function previewVideo(fileUrl: string) {
    setErrorMessage(null);
    try {
      const response = await fetch(`/api/videos/preview?fileUrl=${encodeURIComponent(fileUrl)}`, { cache: "no-store" });
      const data = (await response.json().catch(() => null)) as { signedUrl?: string; message?: string } | null;
      if (!response.ok || !data?.signedUrl) {
        throw new Error(data?.message ?? "Impossible de generer un lien de preview.");
      }

      window.open(data.signedUrl, "_blank", "noopener,noreferrer");
    } catch (caught) {
      setErrorMessage(caught instanceof Error ? caught.message : "Impossible de generer un lien de preview.");
    }
  }

  async function handleFile(file: File) {
    if (!auth.user) {
      router.replace("/login");
      return;
    }

    setUploading(true);
    setStatusMessage(null);
    setWarningMessage(null);
    setErrorMessage(null);

    try {
      const filename = sanitizeFilename(file.name);
      if (file.size > MAX_VIDEO_BYTES) {
        throw new Error("Fichier trop lourd. Maximum 500MB.");
      }

      if (!isAllowedVideoFile(file)) {
        throw new Error("Format invalide. Formats acceptes: MP4, MOV.");
      }

      let durationSeconds = 30;
      let resolution: VideoAsset["resolution"] = "1080x1920";
      try {
        const meta = await readVideoMetadata(file);
        const parsedResolution = resolveAllowedResolution(meta.width, meta.height);
        if (!parsedResolution) {
          throw new Error(`Resolution non supportee (${meta.width}x${meta.height}).`);
        }
        if (meta.durationSeconds < 15 || meta.durationSeconds > 60) {
          throw new Error(`Duree invalide (${meta.durationSeconds}s). Attendu: 15 a 60 secondes.`);
        }
        durationSeconds = meta.durationSeconds;
        resolution = parsedResolution;
      } catch (metadataError) {
        const message = metadataError instanceof Error ? metadataError.message : "";
        if (message === "VIDEO_METADATA_UNREADABLE" || message === "VIDEO_METADATA_TIMEOUT") {
          setWarningMessage(
            "Impossible de lire les metadonnees de ta video (duree, resolution). L'upload continue, mais l'equipe RetroMuscle verifiera manuellement. Assure-toi que ta video respecte les specs."
          );
        } else {
          throw metadataError;
        }
      }

      const fileSizeMb = Math.max(1, Math.ceil(file.size / (1024 * 1024)));

      setStatusMessage("Upload vers RetroMuscle...");

      const signed = await fetch("/api/creator/uploads/video/signed-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          monthlyTrackingId,
          videoType: activeType,
          filename
        })
      });

      const signedPayload = (await signed.json().catch(() => null)) as
        | { key?: string; signedUrl?: string; message?: string }
        | null;

      if (!signed.ok || !signedPayload?.key || !signedPayload.signedUrl) {
        throw new Error(signedPayload?.message ?? "Impossible de preparer l'upload.");
      }

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
            reject(new Error("Upload impossible. Reessaie dans quelques instants."));
          }
        });
        xhr.addEventListener("error", () => reject(new Error("Upload impossible. Reessaie dans quelques instants.")));
        xhr.send(uploadForm);
      });

      const response = await fetch("/api/creator/uploads/video", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          monthlyTrackingId,
          videoType: activeType,
          fileUrl: signedPayload.key,
          durationSeconds,
          resolution,
          fileSizeMb
        }),
        cache: "no-store"
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(data?.message ?? "Impossible d'enregistrer la video.");
      }

      setStatusMessage("Video envoyee. En attente de validation.");
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
      <p className="text-xs uppercase tracking-[0.15em] text-foreground/50">Upload categorie active</p>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {VIDEO_TYPES.map((type) => (
            <Button
              key={type}
              type="button"
              size="sm"
              variant={activeType === type ? "default" : "outline"}
              onClick={() => setActiveType(type)}
              disabled={uploading}
            >
              {VIDEO_TYPE_LABELS[type]}
            </Button>
          ))}
        </div>
        <StatusBadge
          label={`${pendingReviewCount} a valider · ${rejectedCount} rejetees`}
          tone={rejectedCount > 0 ? "warning" : "neutral"}
        />
      </div>

      {statusMessage ? (
        <div className="rounded-2xl border border-line bg-frost/70 px-4 py-3 text-sm text-foreground/75">{statusMessage}</div>
      ) : null}
      {warningMessage ? (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-400/40 bg-amber-50 px-4 py-3 text-sm text-amber-900" role="alert">
          <span className="mt-0.5 shrink-0 text-lg leading-none" aria-hidden="true">&#9888;</span>
          <span>{warningMessage}</span>
        </div>
      ) : null}
      {errorMessage ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive" role="alert">
          {errorMessage}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.12em] text-foreground/50">Specs requises</p>
          <ul className="space-y-1 text-sm text-foreground/70">
            {specs.map((spec) => (
              <li key={spec}>- {spec}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.12em] text-foreground/50">Tips {VIDEO_TYPE_LABELS[activeType]}</p>
          <ul className="space-y-1 text-sm text-foreground/70">
            {tipsForType.map((tip) => (
              <li key={tip}>- {tip}</li>
            ))}
          </ul>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/quicktime,.mp4,.mov"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) {
            void handleFile(file);
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
            void handleFile(file);
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
        <p className="font-medium text-foreground">
          {uploading ? `Upload en cours... ${uploadProgress}%` : "Glisse-depose ta video ici"}
        </p>
        {!uploading ? (
          <p className="mt-1 text-xs text-foreground/65">ou clique pour parcourir (MP4/MOV, max 500MB)</p>
        ) : null}
        <div className="mt-4 flex justify-center">
          <Button
            type="button"
            size="pill"
            variant="outline"
            disabled={!canUpload}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? `Upload... ${uploadProgress}%` : "Parcourir les fichiers"}
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.12em] text-foreground/50">Derniers uploads</p>
        {recentVideos.length === 0 ? (
          <div className="rounded-2xl border border-line bg-frost/70 px-4 py-3 text-sm text-foreground/70">
            Aucun upload pour ce cycle.
          </div>
        ) : (
          <div className="space-y-2">
            {recentVideos.map((video) => (
              <div key={video.id} className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-line bg-frost/70 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{VIDEO_TYPE_LABELS[video.videoType]}</p>
                  <p className="mt-1 text-xs text-foreground/65">{new Date(video.createdAt).toLocaleString("fr-FR")}</p>
                  {video.rejectionReason ? (
                    <p className="mt-2 text-xs text-destructive">Rejet: {video.rejectionReason}</p>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge
                    label={VIDEO_STATUS_LABELS[video.status as keyof typeof VIDEO_STATUS_LABELS] ?? video.status}
                    tone={video.status === "approved" ? "success" : video.status === "rejected" ? "warning" : "neutral"}
                  />
                  {video.status === "rejected" ? (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
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
