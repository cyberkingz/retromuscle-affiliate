"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, UploadCloud } from "lucide-react";

import { CardSection } from "@/components/layout/card-section";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { useAuth } from "@/features/auth/context/auth-context";

interface RushesSummaryCardProps {
  monthlyTrackingId: string;
  totalFiles: number;
  totalSizeLabel: string;
  rushes: Array<{
    id: string;
    fileName: string;
    fileSizeMb: number;
    fileUrl?: string;
    createdAt: string;
  }>;
}

const MAX_RUSH_BYTES = 2 * 1024 * 1024 * 1024; // 2GB

function sanitizeFilename(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "rush.mp4";
  return trimmed.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
}

export function RushesSummaryCard({
  monthlyTrackingId,
  totalFiles,
  totalSizeLabel,
  rushes
}: RushesSummaryCardProps) {
  const auth = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const canUpload = Boolean(auth.user && !uploading);

  const recentRushes = useMemo(() => rushes.slice(0, 6), [rushes]);

  async function openPreview(fileUrl: string) {
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/rushes/preview?fileUrl=${encodeURIComponent(fileUrl)}`, {
        cache: "no-store"
      });
      const data = (await response.json().catch(() => null)) as { signedUrl?: string; message?: string } | null;
      if (!response.ok || !data?.signedUrl) {
        throw new Error(data?.message ?? "Impossible de generer un lien de preview.");
      }

      window.open(data.signedUrl, "_blank", "noopener,noreferrer");
    } catch (caught) {
      setErrorMessage(caught instanceof Error ? caught.message : "Impossible de generer un lien de preview.");
    }
  }

  async function uploadOne(file: File) {
    if (!auth.user) {
      router.replace("/login");
      return;
    }

    const filename = sanitizeFilename(file.name);
    if (file.size > MAX_RUSH_BYTES) {
      throw new Error("Fichier trop lourd. Maximum 2GB.");
    }

    const mime = file.type || "";
    if (!(mime === "video/mp4" || mime === "video/quicktime")) {
      throw new Error("Format invalide. Formats acceptes: MP4, MOV.");
    }

    const fileSizeMb = Math.max(1, Math.ceil(file.size / (1024 * 1024)));

    const signed = await fetch("/api/creator/uploads/rush/signed-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({
        monthlyTrackingId,
        filename
      })
    });

    const signedPayload = (await signed.json().catch(() => null)) as
      | { key?: string; signedUrl?: string; message?: string }
      | null;

    if (!signed.ok || !signedPayload?.key || !signedPayload.signedUrl) {
      throw new Error(signedPayload?.message ?? "Impossible de preparer l'upload.");
    }

    const uploadForm = new FormData();
    uploadForm.append("cacheControl", "3600");
    uploadForm.append("", file);

    const uploaded = await fetch(signedPayload.signedUrl, {
      method: "PUT",
      headers: {
        "x-upsert": "false"
      },
      body: uploadForm
    });

    if (!uploaded.ok) {
      throw new Error("Upload impossible. Reessaie dans quelques instants.");
    }

    const recorded = await fetch("/api/creator/uploads/rush", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({
        monthlyTrackingId,
        fileUrl: signedPayload.key,
        fileName: filename,
        fileSizeMb
      })
    });

    if (!recorded.ok) {
      const data = (await recorded.json().catch(() => null)) as { message?: string } | null;
      throw new Error(data?.message ?? "Impossible d'enregistrer les rushes.");
    }
  }

  async function handleFiles(files: FileList | File[]) {
    if (!canUpload) return;

    setUploading(true);
    setStatusMessage(null);
    setErrorMessage(null);

    try {
      const list = Array.from(files).filter(Boolean);
      if (list.length === 0) {
        return;
      }

      setStatusMessage(`Upload ${list.length} fichier(s) en cours...`);

      for (const file of list) {
        await uploadOne(file);
      }

      setStatusMessage("Rushes envoyes. Merci.");
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
    <CardSection className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.15em] text-foreground/50">Rushes (bonus)</p>
          <p className="mt-3 font-display text-4xl uppercase leading-none text-secondary">
            {totalFiles} fichiers
          </p>
          <p className="mt-1 text-sm text-foreground/70">Volume total: {totalSizeLabel}</p>
        </div>
        <div className="rounded-2xl border border-line bg-frost/70 px-4 py-3 text-xs text-foreground/65">
          Plus de rushes exploitables = plus de variations possibles pour les ads.
        </div>
      </div>

      {statusMessage ? (
        <div className="rounded-2xl border border-line bg-frost/70 px-4 py-3 text-sm text-foreground/75">
          {statusMessage}
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

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="video/mp4,video/quicktime"
        className="hidden"
        onChange={(event) => {
          const files = event.target.files;
          event.target.value = "";
          if (files && files.length > 0) {
            void handleFiles(files);
          }
        }}
      />

      <div
        className={cn(
          "relative overflow-hidden rounded-2xl border border-dashed px-4 py-8 text-center text-sm transition-colors sm:px-6",
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
          const files = event.dataTransfer.files;
          if (files && files.length > 0) {
            void handleFiles(files);
          }
        }}
        onClick={() => {
          if (canUpload) fileInputRef.current?.click();
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if ((event.key === "Enter" || event.key === " ") && canUpload) {
            event.preventDefault();
            fileInputRef.current?.click();
          }
        }}
      >
        <UploadCloud className="mx-auto mb-3 h-10 w-10 text-secondary" />
        <p className="font-medium text-foreground">Ajoute tes rushes (optionnel)</p>
        <p className="mt-1 text-xs text-foreground/65">MP4/MOV, multiple fichiers, max 2GB chacun.</p>
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
            {uploading ? "Upload..." : "Parcourir les fichiers"}
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.12em] text-foreground/50">Derniers rushes</p>
        {recentRushes.length === 0 ? (
          <div className="rounded-2xl border border-line bg-frost/70 px-4 py-3 text-sm text-foreground/70">
            Aucun rush upload pour ce cycle.
          </div>
        ) : (
          <div className="space-y-2">
            {recentRushes.map((rush) => (
              <div
                key={rush.id}
                className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-line bg-frost/70 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{rush.fileName}</p>
                  <p className="mt-1 text-xs text-foreground/65">
                    {(rush.fileSizeMb / 1024).toFixed(2)} GB • {new Date(rush.createdAt).toLocaleString("fr-FR")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => (rush.fileUrl ? void openPreview(rush.fileUrl) : undefined)}
                    disabled={!auth.user || !rush.fileUrl}
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

