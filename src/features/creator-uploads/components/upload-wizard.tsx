"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Film,
  Layers,
  Shirt,
  Sparkles,
  UploadCloud,
  Video,
  X,
  Zap
} from "lucide-react";

import { cn } from "@/lib/cn";
import { formatCurrency } from "@/lib/currency";
import { VIDEO_TYPE_LABELS } from "@/domain/constants/labels";
import { BATCH_MIN_CLIPS, BATCH_SUPPORTED_TYPES } from "@/domain/constants/batch-rules";
import type { UploadMode, VideoAsset, VideoType } from "@/domain/types";
import { useAuth } from "@/features/auth/context/auth-context";
import {
  formatFileSize,
  isPreferredVideoFile,
  readVideoMetadata,
  RECOMMENDED_MAX_VIDEO_BYTES,
  resolveAllowedResolution,
  sanitizeFilename
} from "@/features/creator-uploads/lib/upload-helpers";

/* ────────────────────────────────────────────────────────────────────────── */
/* Constants                                                                  */
/* ────────────────────────────────────────────────────────────────────────── */

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
  const [uploadMode, setUploadMode] = useState<UploadMode>("single");
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  // Batch-specific state
  const [batchFiles, setBatchFiles] = useState<File[]>([]);
  const [batchProgress, setBatchProgress] = useState<number[]>([]);
  const [batchClipCount, setBatchClipCount] = useState(0);
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
    setUploadMode("single");
    setUploading(false);
    setUploadProgress(0);
    setBatchFiles([]);
    setBatchProgress([]);
    setBatchClipCount(0);
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

  async function handleBatchFiles(files: File[]) {
    if (!auth.user) { router.replace("/login"); return; }
    if (!activeType) { setErrorMessage("Sélectionne un type de contenu."); return; }

    const minClips = BATCH_MIN_CLIPS[activeType] ?? 4;
    if (files.length < minClips) {
      setErrorMessage(`Minimum ${minClips} clips requis pour ce type.`);
      return;
    }

    setUploading(true);
    setWarningMessage(null);
    setErrorMessage(null);
    setBatchProgress(files.map(() => 0));

    try {
      const collectedKeys: string[] = [];
      const collectedSizes: number[] = [];
      // Stable tracking ID for the entire batch — captured from the first
      // signed-URL response and reused for all clips and the final POST.
      // Using a local variable (not React state) avoids async state-update
      // races when the month rolls over mid-upload.
      let batchTrackingId = resolvedTrackingId;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const filename = sanitizeFilename(file.name);

        const signed = await fetch("/api/creator/uploads/video/signed-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            monthlyTrackingId: batchTrackingId,
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
          throw new Error(signedPayload?.message ?? `Impossible de préparer l'upload du clip ${i + 1}.`);
        }

        // Pin tracking ID on first response — all subsequent clips use the same month.
        if (i === 0 && signedPayload.monthlyTrackingId) {
          batchTrackingId = signedPayload.monthlyTrackingId;
          setResolvedTrackingId(batchTrackingId);
        }

        const signedUrl = signedPayload.signedUrl;
        const uploadForm = new FormData();
        uploadForm.append("cacheControl", "3600");
        uploadForm.append("", file);

        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("PUT", signedUrl);
          xhr.setRequestHeader("x-upsert", "false");
          xhr.upload.addEventListener("progress", (event) => {
            if (event.lengthComputable && event.total > 0) {
              const pct = Math.round((event.loaded / event.total) * 100);
              setBatchProgress((prev) => {
                const next = [...prev];
                next[i] = pct;
                return next;
              });
            }
          });
          xhr.addEventListener("load", () => {
            if (xhr.status >= 200 && xhr.status < 300) resolve();
            else reject(new Error(`Clip ${i + 1} : upload impossible.`));
          });
          xhr.addEventListener("error", () => reject(new Error(`Clip ${i + 1} : upload impossible.`)));
          xhr.send(uploadForm);
        });

        collectedKeys.push(signedPayload.key);
        collectedSizes.push(Math.max(1, Math.ceil(file.size / (1024 * 1024))));
        setBatchClipCount(i + 1);
      }

      const response = await fetch("/api/creator/uploads/video/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          monthlyTrackingId: batchTrackingId,
          videoType: activeType,
          clipKeys: collectedKeys,
          clipSizesMb: collectedSizes
        })
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(data?.message ?? "Impossible d'enregistrer le lot.");
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
            uploadMode={uploadMode}
            onSelect={(type) => {
              setActiveType(type);
              // Reset mode if new type doesn't support batch
              if (type && !BATCH_SUPPORTED_TYPES.includes(type)) {
                setUploadMode("single");
              }
            }}
            onModeChange={setUploadMode}
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

        {step === 3 && activeType && activeRate && uploadMode === "single" && (
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

        {step === 3 && activeType && activeRate && uploadMode === "batch" && (
          <StepBatchUpload
            activeType={activeType}
            rate={activeRate.ratePerVideo}
            uploading={uploading}
            batchFiles={batchFiles}
            batchProgress={batchProgress}
            batchClipCount={batchClipCount}
            warningMessage={warningMessage}
            errorMessage={errorMessage}
            onBack={() => {
              if (!uploading) setStep(2);
            }}
            onFilesChange={setBatchFiles}
            onUpload={(files) => void handleBatchFiles(files)}
          />
        )}

        {step === 4 && activeType && activeRate && (
          <StepSuccess
            activeType={activeType}
            rate={activeRate.ratePerVideo}
            uploadMode={uploadMode}
            clipCount={batchFiles.length}
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
  uploadMode,
  onSelect,
  onModeChange,
  onContinue
}: {
  ratesByType: UploadWizardProps["ratesByType"];
  activeType: VideoType | null;
  uploadMode: UploadMode;
  onSelect: (type: VideoType) => void;
  onModeChange: (mode: UploadMode) => void;
  onContinue: () => void;
}) {
  const showModeToggle = activeType !== null && BATCH_SUPPORTED_TYPES.includes(activeType);
  const minClips = activeType ? (BATCH_MIN_CLIPS[activeType] ?? 4) : 4;

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
              {isActive && (
                <span className="absolute right-3 top-3 inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white">
                  <Check className="h-3.5 w-3.5" strokeWidth={3} />
                </span>
              )}

              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors",
                    isActive ? "bg-primary text-white" : "bg-secondary/10 text-secondary"
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

      {/* Mode toggle — only shown for batch-eligible types */}
      {showModeToggle && (
        <div className="rounded-[18px] border border-line bg-frost/60 p-4">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.14em] text-foreground/55">
            Mode d&apos;upload
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onModeChange("single")}
              className={cn(
                "flex items-center gap-2.5 rounded-[14px] border-2 px-4 py-3 text-left text-[13px] font-semibold transition-all",
                uploadMode === "single"
                  ? "border-primary bg-primary/[0.06] text-primary"
                  : "border-line bg-white text-foreground/70 hover:border-foreground/30"
              )}
              aria-pressed={uploadMode === "single"}
            >
              <UploadCloud className="h-4 w-4 shrink-0" />
              <div className="min-w-0">
                <p className="font-bold">Vidéo montée</p>
                <p className="text-[11px] font-normal text-foreground/55">1 fichier final</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => onModeChange("batch")}
              className={cn(
                "flex items-center gap-2.5 rounded-[14px] border-2 px-4 py-3 text-left text-[13px] font-semibold transition-all",
                uploadMode === "batch"
                  ? "border-secondary bg-secondary/[0.06] text-secondary"
                  : "border-line bg-white text-foreground/70 hover:border-foreground/30"
              )}
              aria-pressed={uploadMode === "batch"}
            >
              <Layers className="h-4 w-4 shrink-0" />
              <div className="min-w-0">
                <p className="font-bold">Lot de clips</p>
                <p className="text-[11px] font-normal text-foreground/55">
                  min. {minClips} scènes brutes
                </p>
              </div>
            </button>
          </div>
          {uploadMode === "batch" && (
            <p className="mt-2 text-[11px] text-foreground/50">
              Envoie tes scènes brutes sans montage — compte comme{" "}
              <span className="font-semibold text-secondary">1 vidéo</span> dans ton paiement.
            </p>
          )}
        </div>
      )}

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
/* Step 3b — Batch upload                                                     */
/* ────────────────────────────────────────────────────────────────────────── */

function StepBatchUpload({
  activeType,
  rate,
  uploading,
  batchFiles,
  batchProgress,
  batchClipCount,
  warningMessage,
  errorMessage,
  onBack,
  onFilesChange,
  onUpload
}: {
  activeType: VideoType;
  rate: number;
  uploading: boolean;
  batchFiles: File[];
  batchProgress: number[];
  batchClipCount: number;
  warningMessage: string | null;
  errorMessage: string | null;
  onBack: () => void;
  onFilesChange: (files: File[]) => void;
  onUpload: (files: File[]) => void;
}) {
  const Icon = TYPE_ICON[activeType] ?? Film;
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const minClips = BATCH_MIN_CLIPS[activeType] ?? 4;
  const canSubmit = batchFiles.length >= minClips && !uploading;
  const overallProgress =
    batchProgress.length > 0
      ? Math.round(batchProgress.reduce((s, p) => s + p, 0) / batchProgress.length)
      : 0;

  function addFiles(incoming: FileList | null) {
    if (!incoming) return;
    const next = [...batchFiles];
    for (const f of Array.from(incoming)) {
      if (!next.find((x) => x.name === f.name && x.size === f.size)) next.push(f);
    }
    onFilesChange(next);
  }

  function removeFile(index: number) {
    onFilesChange(batchFiles.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-6">
      {/* Recap bar */}
      <div className="flex items-center gap-3 rounded-[18px] border border-secondary/20 bg-secondary/[0.05] px-4 py-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-white">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-secondary">
            Lot · {VIDEO_TYPE_LABELS[activeType]}
          </p>
          <p className="truncate text-[12px] text-foreground/60">
            {formatCurrency(rate)} pour le lot validé · min. {minClips} clips
          </p>
        </div>
        {/* Clip count badge */}
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-xl text-center transition-colors",
            batchFiles.length >= minClips
              ? "bg-mint/15 text-mint"
              : batchFiles.length > 0
                ? "bg-amber-100 text-amber-700"
                : "bg-foreground/8 text-foreground/40"
          )}
          aria-label={`${batchFiles.length} clips sur ${minClips} minimum`}
        >
          <span className="font-display text-lg font-black leading-none">{batchFiles.length}</span>
          <span className="text-[9px] font-bold leading-none">/{minClips}</span>
        </div>
      </div>

      <div>
        <h2 className="font-display text-2xl font-black uppercase leading-tight text-secondary sm:text-[28px]">
          Ajoute tes clips
        </h2>
        <p className="mt-1 text-[13px] text-foreground/60">
          Sélectionne {minClips} scènes brutes minimum. Chaque clip est uploadé séparément — le lot
          compte comme 1 vidéo.
        </p>
      </div>

      {/* Hidden multi-file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        multiple
        className="sr-only"
        onChange={(e) => {
          addFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {/* Drop zone / add button */}
      {!uploading && (
        <div
          className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-[20px] border-2 border-dashed border-foreground/25 bg-frost/60 px-4 py-8 text-center transition-colors hover:border-secondary/50 hover:bg-secondary/[0.04]"
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          aria-label="Ajouter des clips vidéo"
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            addFiles(e.dataTransfer.files);
          }}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary/10 text-secondary">
            <Layers className="h-6 w-6" />
          </div>
          <div>
            <p className="font-display text-lg font-black uppercase text-secondary">
              Glisse tes clips ici
            </p>
            <p className="mt-0.5 text-[12px] text-foreground/60">
              ou clique pour sélectionner plusieurs fichiers
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-[22px] bg-secondary px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.1em] text-white shadow-[0_6px_0_0_hsl(var(--foreground)/0.12)]">
            <Layers className="h-3.5 w-3.5" />
            Ajouter des clips
          </span>
          <p className="text-[11px] text-foreground/40">
            MP4 / MOV · max 500 MB par clip · sélection multiple OK
          </p>
        </div>
      )}

      {/* Clip list */}
      {batchFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-foreground/55">
            Clips sélectionnés ({batchFiles.length})
          </p>
          <ul className="space-y-2" aria-label="Liste des clips">
            {batchFiles.map((file, i) => {
              const progress = uploading ? (batchProgress[i] ?? 0) : null;
              const isDone = progress === 100;
              return (
                <li
                  key={`${file.name}-${file.size}-${i}`}
                  className="flex items-center gap-3 rounded-[14px] border border-line bg-white px-3 py-2.5"
                >
                  <div
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[11px] font-black",
                      isDone
                        ? "bg-mint text-white"
                        : uploading
                          ? "bg-secondary/10 text-secondary"
                          : "bg-foreground/8 text-foreground/50"
                    )}
                    aria-hidden
                  >
                    {isDone ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : i + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] font-semibold text-foreground/80">
                      {file.name}
                    </p>
                    <p className="text-[11px] text-foreground/50">{formatFileSize(file.size)}</p>
                    {uploading && progress !== null && (
                      <div
                        className="mt-1 h-1.5 overflow-hidden rounded-full bg-foreground/10"
                        role="progressbar"
                        aria-valuenow={progress}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`Clip ${i + 1} : ${progress}%`}
                      >
                        <div
                          className="h-full bg-gradient-to-r from-secondary to-primary transition-[width]"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                  {!uploading && (
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-foreground/40 transition hover:bg-destructive/10 hover:text-destructive"
                      aria-label={`Retirer ${file.name}`}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Overall progress when uploading */}
      {uploading && (
        <div className="rounded-[16px] border border-secondary/20 bg-secondary/[0.05] p-4">
          <div className="flex items-center justify-between text-[12px]">
            <span className="font-semibold text-secondary">
              Upload en cours ({batchClipCount}/{batchFiles.length})
            </span>
            <span className="font-bold text-secondary">{overallProgress}%</span>
          </div>
          <div
            className="mt-2 h-2 overflow-hidden rounded-full bg-foreground/10"
            role="progressbar"
            aria-valuenow={overallProgress}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full bg-gradient-to-r from-secondary to-primary transition-[width]"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
          <p className="mt-2 text-center text-[11px] text-foreground/50">
            Ne ferme pas cette page pendant l&apos;upload
          </p>
        </div>
      )}

      {warningMessage && (
        <div
          className="flex items-start gap-3 rounded-2xl border border-amber-400/40 bg-amber-50 px-4 py-3 text-[13px] text-amber-900"
          role="alert"
        >
          <span className="mt-0.5 shrink-0 text-lg leading-none" aria-hidden="true">⚠</span>
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
        <button
          type="button"
          onClick={() => onUpload(batchFiles)}
          disabled={!canSubmit}
          className={cn(
            "inline-flex items-center gap-2 rounded-[22px] px-6 py-3 text-[12px] font-bold uppercase tracking-[0.1em] text-white transition active:scale-95",
            canSubmit
              ? "bg-secondary hover:bg-secondary/90"
              : "cursor-not-allowed bg-foreground/20 text-white/60"
          )}
        >
          {uploading ? (
            <>
              <UploadCloud className="h-4 w-4 animate-pulse" />
              Upload...
            </>
          ) : (
            <>
              <Layers className="h-4 w-4" />
              Envoyer le lot
            </>
          )}
        </button>
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
  uploadMode,
  clipCount,
  onUploadAnother
}: {
  activeType: VideoType;
  rate: number;
  uploadMode: UploadMode;
  clipCount: number;
  onUploadAnother: () => void;
}) {
  const isBatch = uploadMode === "batch";

  return (
    <div className="space-y-6 text-center">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-mint/15">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-mint text-white">
          <CheckCircle2 className="h-8 w-8" strokeWidth={2.5} />
        </div>
      </div>

      <div>
        <h2 className="font-display text-3xl font-black uppercase leading-tight text-secondary sm:text-[32px]">
          {isBatch ? "Lot envoyé\u00a0!" : "Vidéo envoyée\u00a0!"}
        </h2>
        <p className="mx-auto mt-2 max-w-sm text-[13px] text-foreground/60">
          {isBatch ? (
            <>
              Tes{" "}
              <span className="font-semibold text-secondary">{clipCount} clips</span>{" "}
              {VIDEO_TYPE_LABELS[activeType]} sont en attente de validation du lot. Réponse sous 48h.
            </>
          ) : (
            <>
              Ton upload{" "}
              <span className="font-semibold text-secondary">{VIDEO_TYPE_LABELS[activeType]}</span>{" "}
              est en attente de validation. Réponse sous 48h.
            </>
          )}
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
        {isBatch && (
          <div className="flex items-center justify-between gap-3 border-b border-line py-3">
            <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-foreground/55">
              Clips envoyés
            </span>
            <span className="font-display text-sm font-black uppercase text-secondary">
              {clipCount}
            </span>
          </div>
        )}
        <div className="flex items-center justify-between gap-3 pt-3">
          <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-foreground/55">
            Gain si validé{isBatch ? "" : "e"}
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
          {isBatch ? "Uploader un autre lot" : "Uploader une autre vidéo"}
        </button>
      </div>
    </div>
  );
}
