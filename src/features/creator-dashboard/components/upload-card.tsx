"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, UploadCloud } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
    videoType: string;
    status: string;
    createdAt: string;
    fileUrl: string;
    rejectionReason?: string;
  }>;
}

const MAX_VIDEO_BYTES = 500 * 1024 * 1024;

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
      video.onloadedmetadata = () => resolve();
      video.onerror = () => reject(new Error("Impossible de lire les metadata de la video."));
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
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const accessToken = auth.session?.access_token ?? null;
  const canUpload = Boolean(auth.client && accessToken && !uploading);

  const tipsForType = useMemo(() => {
    const value = tips[activeType];
    return Array.isArray(value) ? value : [];
  }, [tips, activeType]);

  async function previewVideo(fileUrl: string) {
    setErrorMessage(null);
    if (!auth.client) {
      setErrorMessage("Supabase n'est pas configure.");
      return;
    }

    const { data, error } = await auth.client.storage.from("videos").createSignedUrl(fileUrl, 60);
    if (error || !data?.signedUrl) {
      setErrorMessage(error?.message ?? "Impossible de generer un lien de preview.");
      return;
    }

    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  async function handleFile(file: File) {
    if (!auth.client || !accessToken || !auth.session?.user?.id) {
      router.replace("/login");
      return;
    }

    setUploading(true);
    setStatusMessage(null);
    setErrorMessage(null);

    try {
      const filename = sanitizeFilename(file.name);
      if (file.size > MAX_VIDEO_BYTES) {
        throw new Error("Fichier trop lourd. Maximum 500MB.");
      }

      const mime = file.type || "";
      if (!(mime === "video/mp4" || mime === "video/quicktime")) {
        throw new Error("Format invalide. Formats acceptes: MP4, MOV.");
      }

      const meta = await readVideoMetadata(file);
      const resolution = resolveAllowedResolution(meta.width, meta.height);
      if (!resolution) {
        throw new Error(`Resolution non supportee (${meta.width}x${meta.height}).`);
      }

      const durationSeconds = meta.durationSeconds;
      if (durationSeconds < 15 || durationSeconds > 60) {
        throw new Error(`Duree invalide (${durationSeconds}s). Attendu: 15 a 60 secondes.`);
      }

      const fileSizeMb = Math.max(1, Math.ceil(file.size / (1024 * 1024)));
      const key = `${auth.session.user.id}/${monthlyTrackingId}/${activeType}/${Date.now()}-${filename}`;

      setStatusMessage("Upload vers RetroMuscle...");

      const uploadResult = await auth.client.storage.from("videos").upload(key, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: mime
      });

      if (uploadResult.error) {
        throw new Error(uploadResult.error.message);
      }

      const response = await fetch("/api/creator/uploads/video", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          monthlyTrackingId,
          videoType: activeType,
          fileUrl: key,
          durationSeconds,
          resolution,
          fileSizeMb
        }),
        cache: "no-store"
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { message?: string } | null;
        // Attempt cleanup: keep storage clean if DB insert fails.
        await auth.client.storage.from("videos").remove([key]);
        throw new Error(data?.message ?? "Impossible d'enregistrer la video.");
      }

      setStatusMessage("Video envoyee. En attente de validation.");
      router.refresh();
    } catch (caught) {
      setErrorMessage(caught instanceof Error ? caught.message : "Upload impossible.");
      setStatusMessage(null);
    } finally {
      setUploading(false);
      setDragActive(false);
    }
  }

  return (
    <Card className="space-y-4 bg-white p-5 sm:p-6">
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
      {errorMessage ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive" role="alert">
          {errorMessage}
        </div>
      ) : null}

      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/quicktime"
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
      >
        <UploadCloud className="mx-auto mb-3 h-10 w-10 text-secondary" />
        <p className="font-medium text-foreground">Glisse-depose ta video ici</p>
        <p className="mt-1 text-xs text-foreground/65">ou clique pour parcourir (MP4/MOV, max 500MB)</p>
        <div className="mt-4 flex justify-center">
          <Button
            type="button"
            size="pill"
            variant="outline"
            disabled={!canUpload}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? "Upload..." : "Parcourir les fichiers"}
          </Button>
        </div>
      </div>

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
                  <p className="truncate text-sm font-semibold">{video.videoType}</p>
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
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => previewVideo(video.fileUrl)}
                    disabled={!auth.client}
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
    </Card>
  );
}
