"use client";

import { useRef, useState } from "react";
import { UploadCloud } from "lucide-react";
import { useAuth } from "@/features/auth/context/auth-context";
import { CardSection } from "@/components/layout/card-section";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress-bar";
import {
  formatFileSize,
  isPreferredVideoFile,
  readVideoMetadata,
  RECOMMENDED_MAX_VIDEO_BYTES,
  resolveAllowedResolution,
  sanitizeFilename
} from "@/features/creator-uploads/lib/upload-helpers";
import type { VideoAsset, VideoType } from "@/domain/types";
import { cn } from "@/lib/cn";

interface RevisionUploadCardProps {
  originalVideoId: string;
  monthlyTrackingId: string;
  videoType: VideoType;
  videoTypeLabel: string;
  onSuccess: () => void;
}

export function RevisionUploadCard({
  originalVideoId,
  monthlyTrackingId,
  videoType,
  videoTypeLabel,
  onSuccess
}: RevisionUploadCardProps) {
  const auth = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleFile(file: File) {
    if (!auth.user) return;

    setUploading(true);
    setWarningMessage(null);
    setErrorMessage(null);
    setUploadProgress(0);

    try {
      const filename = sanitizeFilename(file.name);
      const warnings: string[] = [];

      if (file.size > RECOMMENDED_MAX_VIDEO_BYTES) {
        warnings.push("Fichier > 500 MB (recommandé). Upload accepté, traitement plus lent.");
      }
      if (!isPreferredVideoFile(file)) {
        warnings.push("Format non préféré. MP4/MOV recommandés.");
      }

      let durationSeconds = 30;
      let resolution: VideoAsset["resolution"] = "1080x1920";
      try {
        const meta = await readVideoMetadata(file);
        const resolved = resolveAllowedResolution(meta.width, meta.height);
        if (resolved) {
          resolution = resolved;
        } else {
          warnings.push(
            `Résolution ${meta.width}x${meta.height} hors recommandation (1080x1920 ou 1080x1080).`
          );
        }
        if (meta.durationSeconds >= 15 && meta.durationSeconds <= 60) {
          durationSeconds = meta.durationSeconds;
        } else {
          warnings.push(`Durée ${meta.durationSeconds}s hors cible (15–60s).`);
        }
      } catch {
        warnings.push("Métadonnées non lues. Valeurs par défaut appliquées (30s, 1080x1920).");
      }

      if (warnings.length > 0) setWarningMessage(warnings.join(" "));

      const fileSizeMb = Math.max(1, Math.ceil(file.size / (1024 * 1024)));

      // Get signed upload URL — reuse same endpoint with locked type + trackingId
      const signedRes = await fetch("/api/creator/uploads/video/signed-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ monthlyTrackingId, videoType, filename })
      });

      const signedPayload = (await signedRes.json().catch(() => null)) as {
        key?: string;
        signedUrl?: string;
        message?: string;
      } | null;

      if (!signedRes.ok || !signedPayload?.key || !signedPayload.signedUrl) {
        throw new Error(signedPayload?.message ?? "Impossible de préparer l'upload.");
      }

      // XHR upload with progress
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const form = new FormData();
        form.append("cacheControl", "3600");
        form.append("", file);
        xhr.open("PUT", signedPayload.signedUrl!);
        xhr.setRequestHeader("x-upsert", "false");
        xhr.upload.addEventListener("progress", (evt) => {
          if (evt.lengthComputable && evt.total > 0) {
            setUploadProgress(Math.round((evt.loaded / evt.total) * 100));
          }
        });
        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error("Upload impossible. Réessaie dans quelques instants."));
        });
        xhr.addEventListener("error", () =>
          reject(new Error("Upload impossible. Réessaie dans quelques instants."))
        );
        xhr.send(form);
      });

      // Record revision in DB
      const recordRes = await fetch("/api/creator/uploads/video/revision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originalVideoId,
          fileUrl: signedPayload.key,
          durationSeconds,
          resolution,
          fileSizeMb
        })
      });

      if (!recordRes.ok) {
        const data = (await recordRes.json().catch(() => null)) as { message?: string } | null;
        throw new Error(data?.message ?? "Impossible d'enregistrer la vidéo.");
      }

      onSuccess();
    } catch (caught) {
      setErrorMessage(caught instanceof Error ? caught.message : "Upload impossible.");
    } finally {
      setUploading(false);
    }
  }

  function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      void handleFile(file);
    }
  }

  function onDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragActive(false);
    const file = event.dataTransfer.files[0];
    if (file) {
      setSelectedFile(file);
      void handleFile(file);
    }
  }

  return (
    <CardSection className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-foreground/55">
          Nouvelle version
        </p>
        {/* Locked type pill */}
        <span className="rounded-full border border-line bg-frost/60 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-foreground/70">
          {videoTypeLabel}
        </span>
      </div>

      {/* Drop zone */}
      <div
        role="button"
        tabIndex={uploading ? -1 : 0}
        aria-label="Zone de dépôt de fichier vidéo"
        aria-disabled={uploading}
        className={cn(
          "relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors",
          dragActive
            ? "border-primary bg-primary/5"
            : "border-foreground/20 bg-frost/40 hover:border-primary/50 hover:bg-primary/3",
          uploading && "pointer-events-none opacity-60"
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={onDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
        onKeyDown={(e) => {
          if (!uploading && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
      >
        <UploadCloud className="h-8 w-8 text-foreground/30" aria-hidden />
        <div>
          <p className="text-sm font-medium text-foreground/70">
            {selectedFile && !uploading
              ? selectedFile.name
              : "Glisse ta vidéo ici ou clique pour choisir"}
          </p>
          <p className="mt-1 text-xs text-foreground/45">MP4 ou MOV — max 500 MB recommandé</p>
        </div>
        {selectedFile && !uploading && (
          <p className="text-xs text-foreground/45">{formatFileSize(selectedFile.size)}</p>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={onFileChange}
      />

      {/* Upload progress */}
      {uploading && (
        <ProgressBar percent={uploadProgress} label={`Upload en cours… ${uploadProgress}%`} />
      )}

      {/* Warning */}
      {warningMessage && !errorMessage && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          {warningMessage}
        </p>
      )}

      {/* Error */}
      {errorMessage && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          <p className="font-semibold">Erreur</p>
          <p className="mt-0.5">{errorMessage}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => {
              setErrorMessage(null);
              setSelectedFile(null);
              setUploadProgress(0);
            }}
          >
            Réessayer
          </Button>
        </div>
      )}

      {!uploading && !errorMessage && !selectedFile && (
        <Button
          className="w-full"
          onClick={() => fileInputRef.current?.click()}
        >
          Choisir un fichier
        </Button>
      )}
    </CardSection>
  );
}
