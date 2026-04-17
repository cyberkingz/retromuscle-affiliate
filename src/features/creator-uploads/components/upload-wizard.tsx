"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Film,
  Shirt,
  Sparkles,
  UploadCloud,
  Video,
  Zap
} from "lucide-react";

import { cn } from "@/lib/cn";
import { formatCurrency } from "@/lib/currency";
import { VIDEO_TYPE_LABELS } from "@/domain/constants/labels";
import type { VideoAsset, VideoType } from "@/domain/types";
import { useAuth } from "@/features/auth/context/auth-context";

/* ────────────────────────────────────────────────────────────────────────── */
/* Constants & helpers                                                        */
/* ────────────────────────────────────────────────────────────────────────── */

const RECOMMENDED_MAX_VIDEO_BYTES = 500 * 1024 * 1024;
const VIDEO_METADATA_TIMEOUT_MS = 8_000;
const PREFERRED_VIDEO_MIME_TYPES = new Set(["video/mp4", "video/quicktime", "video/mov"]);
const PREFERRED_VIDEO_EXTENSIONS = new Set(["mp4", "mov"]);

const TYPE_ICON: Record<VideoType, typeof Film> = {
  OOTD: Shirt,
  TRAINING: Zap,
  BEFORE_AFTER: Sparkles,
  SPORTS_80S: Video,
  CINEMATIC: Film
};

const TYPE_DESCRIPTION: Record<VideoType, string> = {
  OOTD: "Montre ta tenue du jour dans un format stylé, mise en avant produit claire.",
  TRAINING: "Ta séance filmée portant RetroMuscle, énergie pure, mouvements nets.",
  BEFORE_AFTER: "Transformation avant/après, focus sur ta progression et le drip.",
  SPORTS_80S: "Esthétique rétro 80s, VHS, néons, inspiration Rocky / gold era.",
  CINEMATIC: "Plan cinéma, grain, slow-mo, ambiance narrative soignée."
};

function sanitizeFilename(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "video.mp4";
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
        reject(new Error("Impossible de lire les métadonnées (timeout)."));
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
        reject(new Error("Impossible de lire la vidéo."));
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
  if (!value.includes(".")) return "";
  return value.split(".").pop() ?? "";
}

function isPreferredVideoFile(file: File): boolean {
  const mime = file.type.trim().toLowerCase();
  const extension = getFileExtension(file.name);
  if (PREFERRED_VIDEO_MIME_TYPES.has(mime)) return true;
  if (!mime && PREFERRED_VIDEO_EXTENSIONS.has(extension)) return true;
  return PREFERRED_VIDEO_EXTENSIONS.has(extension);
}

function resolveAllowedResolution(width: number, height: number): VideoAsset["resolution"] | null {
  const value = `${width}x${height}`;
  if (value === "1080x1920" || value === "1080x1080") return value;
  return null;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Types                                                                      */
/* ────────────────────────────────────────────────────────────────────────── */

type WizardStep = 1 | 2 | 3 | 4;

interface UploadWizardProps {
  monthlyTrackingId: string;
  ratesByType: Array<{
    videoType: VideoType;
    label: string;
    ratePerVideo: number;
  }>;
  specs: string[];
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Component                                                                  */
/* ────────────────────────────────────────────────────────────────────────── */

export function UploadWizard({
  monthlyTrackingId,
  ratesByType,
  specs
}: UploadWizardProps) {
  const auth = useAuth();
  const router = useRouter();

  const [step, setStep] = useState<WizardStep>(1);
  const [activeType, setActiveType] = useState<VideoType | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resolvedTrackingId, setResolvedTrackingId] = useState(monthlyTrackingId);

  const hasActiveVideoTypes = ratesByType.length > 0;

  useEffect(() => {
    setResolvedTrackingId(monthlyTrackingId);
  }, [monthlyTrackingId]);

  const activeRate = useMemo(
    () => ratesByType.find((item) => item.videoType === activeType) ?? null,
    [ratesByType, activeType]
  );

function resetWizard() {
    setStep(1);
    setActiveType(null);
    setUploading(false);
    setUploadProgress(0);
    setWarningMessage(null);
    setErrorMessage(null);
  }

  async function handleFile(file: File) {
    if (!auth.user) {
      router.replace("/login");
      return;
    }
    if (!activeType) {
      setErrorMessage("Sélectionne un type de contenu.");
      return;
    }

    setUploading(true);
    setWarningMessage(null);
    setErrorMessage(null);

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
        const resolvedResolution = resolveAllowedResolution(meta.width, meta.height);
        if (resolvedResolution) {
          resolution = resolvedResolution;
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
      if (!trackingIdForUpload) throw new Error("Suivi mensuel introuvable.");
      setResolvedTrackingId(trackingIdForUpload);

      const signedUrl = signedPayload.signedUrl;
      const uploadForm = new FormData();
      uploadForm.append("cacheControl", "3600");
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
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error("Upload impossible. Réessaie dans quelques instants."));
        });
        xhr.addEventListener("error", () =>
          reject(new Error("Upload impossible. Réessaie dans quelques instants."))
        );
        xhr.send(uploadForm);
      });

      const response = await fetch("/api/creator/uploads/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

      setStep(4);
      router.refresh();
    } catch (caught) {
      setErrorMessage(caught instanceof Error ? caught.message : "Upload impossible.");
    } finally {
      setUploading(false);
      setDragActive(false);
    }
  }

  /* ── No active types fallback ─────────────────────────────────────────── */
  if (!hasActiveVideoTypes) {
    return (
      <div
        className="rounded-2xl border border-amber-400/40 bg-amber-50 px-5 py-4 text-sm text-amber-900"
        role="alert"
      >
        Aucun type de vidéo actif pour le moment. Contacte l&apos;équipe RetroMuscle.
      </div>
    );
  }

  /* ── Wizard shell ─────────────────────────────────────────────────────── */
  return (
    <div className="overflow-hidden rounded-[22px] border border-line bg-white/90 shadow-[0_8px_26px_-14px_rgba(6,13,56,0.18)]">
      {/* Progress header */}
      <WizardHeader step={step} />

      {/* Step body */}
      <div className="px-5 py-6 sm:px-8 sm:py-8">
        {step === 1 && (
          <StepChooseType
            ratesByType={ratesByType}
            activeType={activeType}
            onSelect={(type) => setActiveType(type)}
            onContinue={() => setStep(2)}
          />
        )}

        {step === 2 && activeType && activeRate && (
          <StepSpecs
            activeType={activeType}
            rate={activeRate.ratePerVideo}
            specs={specs}
            onBack={() => setStep(1)}
            onContinue={() => setStep(3)}
          />
        )}

        {step === 3 && activeType && activeRate && (
          <StepUpload
            activeType={activeType}
            rate={activeRate.ratePerVideo}
            dragActive={dragActive}
            uploading={uploading}
            uploadProgress={uploadProgress}
            warningMessage={warningMessage}
            errorMessage={errorMessage}
            onBack={() => {
              if (!uploading) setStep(2);
            }}
            onDragActive={setDragActive}
            onFile={(file) => void handleFile(file)}
          />
        )}

        {step === 4 && activeType && activeRate && (
          <StepSuccess
            activeType={activeType}
            rate={activeRate.ratePerVideo}
            onUploadAnother={resetWizard}
          />
        )}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Wizard header — progress indicator                                         */
/* ────────────────────────────────────────────────────────────────────────── */

function WizardHeader({ step }: { step: WizardStep }) {
  const steps: Array<{ n: WizardStep; label: string }> = [
    { n: 1, label: "Type" },
    { n: 2, label: "Specs" },
    { n: 3, label: "Upload" },
    { n: 4, label: "Envoyé" }
  ];

  return (
    <div className="border-b border-line bg-gradient-to-r from-secondary/[0.04] to-primary/[0.04] px-5 py-4 sm:px-8">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
          Étape {step} / 4
        </p>
        <p className="text-[11px] text-foreground/55">{steps[step - 1].label}</p>
      </div>

      <div className="flex items-center gap-1.5">
        {steps.map((s) => {
          const isDone = step > s.n;
          const isActive = step === s.n;
          return (
            <div
              key={s.n}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors",
                isDone
                  ? "bg-mint"
                  : isActive
                    ? "bg-primary"
                    : "bg-foreground/10"
              )}
              aria-hidden
            />
          );
        })}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Step 1 — Choose type                                                       */
/* ────────────────────────────────────────────────────────────────────────── */

function StepChooseType({
  ratesByType,
  activeType,
  onSelect,
  onContinue
}: {
  ratesByType: UploadWizardProps["ratesByType"];
  activeType: VideoType | null;
  onSelect: (type: VideoType) => void;
  onContinue: () => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-black uppercase leading-tight text-secondary sm:text-[28px]">
          Choisis ton type de contenu
        </h2>
        <p className="mt-1 text-[13px] text-foreground/60">
          Chaque type a son tarif et ses règles. Choisis celui qui correspond à ta vidéo.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {ratesByType.map((rate) => {
          const Icon = TYPE_ICON[rate.videoType] ?? Film;
          const isActive = activeType === rate.videoType;
          return (
            <button
              key={rate.videoType}
              type="button"
              onClick={() => onSelect(rate.videoType)}
              className={cn(
                "group relative overflow-hidden rounded-[18px] border-2 p-4 text-left transition-all",
                isActive
                  ? "border-primary bg-primary/[0.06] shadow-[0_6px_0_0_hsl(var(--foreground)/0.12)]"
                  : "border-line bg-white hover:border-foreground/30 hover:bg-frost"
              )}
              aria-pressed={isActive}
            >
              {/* Check badge when active */}
              {isActive && (
                <span className="absolute right-3 top-3 inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white">
                  <Check className="h-3.5 w-3.5" strokeWidth={3} />
                </span>
              )}

              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors",
                    isActive
                      ? "bg-primary text-white"
                      : "bg-secondary/10 text-secondary"
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="font-display text-lg font-black uppercase leading-none text-secondary">
                    {VIDEO_TYPE_LABELS[rate.videoType]}
                  </p>
                  <p
                    className={cn(
                      "mt-1 font-display text-[22px] font-black leading-none",
                      isActive ? "text-primary" : "text-foreground/70"
                    )}
                  >
                    {formatCurrency(rate.ratePerVideo)}
                  </p>
                  <p className="mt-2 text-[12px] leading-[1.45] text-foreground/60">
                    {TYPE_DESCRIPTION[rate.videoType]}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-end pt-2">
        <button
          type="button"
          onClick={onContinue}
          disabled={!activeType}
          className={cn(
            "inline-flex items-center gap-2 rounded-[22px] px-6 py-3 text-[12px] font-bold uppercase tracking-[0.1em] text-white transition",
            "bg-secondary hover:bg-secondary/90 active:scale-95",
            "disabled:cursor-not-allowed disabled:bg-foreground/20 disabled:text-white/60"
          )}
        >
          Voir les specs
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Step 2 — Specs & tips                                                      */
/* ────────────────────────────────────────────────────────────────────────── */

function StepSpecs({
  activeType,
  rate,
  specs,
  onBack,
  onContinue
}: {
  activeType: VideoType;
  rate: number;
  specs: string[];
  onBack: () => void;
  onContinue: () => void;
}) {
  const Icon = TYPE_ICON[activeType] ?? Film;

  return (
    <div className="space-y-6">
      {/* Selected type recap */}
      <div className="flex items-center gap-3 rounded-[18px] border border-primary/20 bg-primary/[0.05] px-4 py-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
            Type choisi
          </p>
          <p className="font-display text-lg font-black uppercase leading-none text-secondary">
            {VIDEO_TYPE_LABELS[activeType]}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-foreground/55">
            Tarif
          </p>
          <p className="font-display text-xl font-black leading-none text-primary">
            {formatCurrency(rate)}
          </p>
        </div>
      </div>

      <div>
        <h2 className="font-display text-2xl font-black uppercase leading-tight text-secondary sm:text-[28px]">
          Specs techniques
        </h2>
        <p className="mt-1 text-[13px] text-foreground/60">
          Respecte ces règles pour maximiser tes chances de validation.
        </p>
      </div>

      {/* Specs hero grid */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <SpecTile label="Format" value="MP4 / MOV" />
        <SpecTile label="Résolution" value="1080×1920" hint="ou 1080×1080" />
        <SpecTile label="Durée" value="15–60s" />
      </div>

      {/* Additional specs */}
      {specs.length > 0 && (
        <div className="rounded-[18px] border border-line bg-frost/60 p-4">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.14em] text-foreground/55">
            Règles générales
          </p>
          <ul className="space-y-2">
            {specs.map((spec) => (
              <li key={spec} className="flex items-start gap-2 text-[13px] text-foreground/75">
                <Check className="mt-[3px] h-3.5 w-3.5 shrink-0 text-mint" strokeWidth={3} />
                <span>{spec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Nav */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 rounded-[22px] border border-line px-5 py-3 text-[12px] font-bold uppercase tracking-[0.1em] text-foreground/70 transition hover:bg-frost active:scale-95"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </button>
        <button
          type="button"
          onClick={onContinue}
          className="inline-flex items-center gap-2 rounded-[22px] bg-secondary px-6 py-3 text-[12px] font-bold uppercase tracking-[0.1em] text-white transition hover:bg-secondary/90 active:scale-95"
        >
          Uploader la vidéo
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function SpecTile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-[16px] border border-line bg-white px-3 py-3 text-center sm:px-4 sm:py-4">
      <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-foreground/55">{label}</p>
      <p className="mt-1 font-display text-base font-black uppercase leading-none text-secondary sm:text-lg">
        {value}
      </p>
      {hint && <p className="mt-1 text-[10px] text-foreground/50">{hint}</p>}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Step 3 — Upload                                                            */
/* ────────────────────────────────────────────────────────────────────────── */

function StepUpload({
  activeType,
  rate,
  dragActive,
  uploading,
  uploadProgress,
  warningMessage,
  errorMessage,
  onBack,
  onDragActive,
  onFile
}: {
  activeType: VideoType;
  rate: number;
  dragActive: boolean;
  uploading: boolean;
  uploadProgress: number;
  warningMessage: string | null;
  errorMessage: string | null;
  onBack: () => void;
  onDragActive: (active: boolean) => void;
  onFile: (file: File) => void;
}) {
  const Icon = TYPE_ICON[activeType] ?? Film;
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [localFile, setLocalFile] = useState<File | null>(null);

  const canInteract = !uploading;

  return (
    <div className="space-y-6">
      {/* Recap bar */}
      <div className="flex items-center gap-3 rounded-[18px] border border-primary/20 bg-primary/[0.05] px-4 py-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
            Upload {VIDEO_TYPE_LABELS[activeType]}
          </p>
          <p className="truncate text-[12px] text-foreground/60">
            {formatCurrency(rate)} par vidéo validée · validation sous 48h
          </p>
        </div>
      </div>

      <div>
        <h2 className="font-display text-2xl font-black uppercase leading-tight text-secondary sm:text-[28px]">
          Dépose ton fichier
        </h2>
        <p className="mt-1 text-[13px] text-foreground/60">
          Glisse ta vidéo ou parcours tes fichiers. Formats recommandés : MP4 / MOV.
        </p>
      </div>

      {/* Drop zone */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) {
            setLocalFile(file);
            onFile(file);
          }
        }}
      />

      <div
        className={cn(
          "relative overflow-hidden rounded-[20px] border-2 border-dashed px-4 py-10 text-center transition-colors sm:px-6 sm:py-14",
          dragActive
            ? "border-primary bg-primary/[0.08]"
            : uploading
              ? "border-secondary/30 bg-secondary/[0.04]"
              : "border-foreground/25 bg-frost/60 hover:border-foreground/45 hover:bg-frost",
          !canInteract && "cursor-wait"
        )}
        onClick={() => {
          if (canInteract) fileInputRef.current?.click();
        }}
        onDragEnter={(event) => {
          event.preventDefault();
          if (canInteract) onDragActive(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          if (canInteract) onDragActive(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          onDragActive(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          onDragActive(false);
          if (!canInteract) return;
          const file = event.dataTransfer.files?.[0];
          if (file) {
            setLocalFile(file);
            onFile(file);
          }
        }}
        role="button"
        tabIndex={0}
        aria-label="Zone de glisser-déposer vidéo"
        onKeyDown={(event) => {
          if ((event.key === "Enter" || event.key === " ") && canInteract) {
            event.preventDefault();
            fileInputRef.current?.click();
          }
        }}
      >
        {uploading ? (
          <div className="space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-white">
              <UploadCloud className="h-7 w-7 animate-pulse" />
            </div>
            <p className="font-display text-xl font-black uppercase text-secondary">
              Upload en cours... {uploadProgress}%
            </p>
            {localFile && (
              <p className="truncate text-[12px] text-foreground/60">
                {localFile.name} · {formatFileSize(localFile.size)}
              </p>
            )}
            <div
              className="mx-auto h-2 max-w-xs overflow-hidden rounded-full bg-foreground/10"
              role="progressbar"
              aria-valuenow={uploadProgress}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full bg-gradient-to-r from-primary to-secondary transition-[width]"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        ) : (
          <>
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary/10 text-secondary">
              <UploadCloud className="h-7 w-7" />
            </div>
            <p className="font-display text-xl font-black uppercase text-secondary">
              Glisse ta vidéo ici
            </p>
            <p className="mt-1 text-[12px] text-foreground/60">
              ou clique pour parcourir tes fichiers
            </p>
            <div className="mt-5 flex justify-center">
              <span className="inline-flex items-center gap-2 rounded-[22px] bg-primary px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.1em] text-white shadow-[0_6px_0_0_hsl(var(--foreground)/0.12)]">
                <UploadCloud className="h-3.5 w-3.5" />
                Parcourir les fichiers
              </span>
            </div>
            <p className="mt-4 text-[11px] text-foreground/45">
              MP4 / MOV · max 500 MB recommandé · 1080×1920 ou 1080×1080
            </p>
          </>
        )}
      </div>

      {warningMessage && (
        <div
          className="flex items-start gap-3 rounded-2xl border border-amber-400/40 bg-amber-50 px-4 py-3 text-[13px] text-amber-900"
          role="alert"
        >
          <span className="mt-0.5 shrink-0 text-lg leading-none" aria-hidden="true">
            ⚠
          </span>
          <span>{warningMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div
          className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-[13px] text-destructive"
          role="alert"
        >
          {errorMessage}
        </div>
      )}

      {/* Nav */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onBack}
          disabled={uploading}
          className="inline-flex items-center gap-1.5 rounded-[22px] border border-line px-5 py-3 text-[12px] font-bold uppercase tracking-[0.1em] text-foreground/70 transition hover:bg-frost active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </button>
        <p className="text-[11px] text-foreground/50">
          {uploading ? "Ne ferme pas cette page" : "Upload dès que tu déposes le fichier"}
        </p>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Step 4 — Success                                                           */
/* ────────────────────────────────────────────────────────────────────────── */

function StepSuccess({
  activeType,
  rate,
  onUploadAnother
}: {
  activeType: VideoType;
  rate: number;
  onUploadAnother: () => void;
}) {
  return (
    <div className="space-y-6 text-center">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-mint/15">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-mint text-white">
          <CheckCircle2 className="h-8 w-8" strokeWidth={2.5} />
        </div>
      </div>

      <div>
        <h2 className="font-display text-3xl font-black uppercase leading-tight text-secondary sm:text-[32px]">
          Vidéo envoyée&nbsp;!
        </h2>
        <p className="mx-auto mt-2 max-w-sm text-[13px] text-foreground/60">
          Ton upload <span className="font-semibold text-secondary">{VIDEO_TYPE_LABELS[activeType]}</span>{" "}
          est en attente de validation. Réponse sous 48h.
        </p>
      </div>

      {/* Recap */}
      <div className="mx-auto max-w-sm rounded-[18px] border border-line bg-frost/60 p-4 text-left">
        <div className="flex items-center justify-between gap-3 border-b border-line pb-3">
          <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-foreground/55">
            Type
          </span>
          <span className="font-display text-sm font-black uppercase text-secondary">
            {VIDEO_TYPE_LABELS[activeType]}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3 pt-3">
          <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-foreground/55">
            Gain si validée
          </span>
          <span className="font-display text-sm font-black uppercase text-primary">
            {formatCurrency(rate)}
          </span>
        </div>
      </div>

      <div className="flex flex-col items-center gap-2 pt-2 sm:flex-row sm:justify-center sm:gap-3">
        <button
          type="button"
          onClick={onUploadAnother}
          className="inline-flex w-full items-center justify-center gap-2 rounded-[22px] bg-primary px-6 py-3 text-[12px] font-bold uppercase tracking-[0.1em] text-white transition hover:bg-primary/90 active:scale-95 sm:w-auto"
        >
          <UploadCloud className="h-4 w-4" />
          Uploader une autre vidéo
        </button>
      </div>
    </div>
  );
}
