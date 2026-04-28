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
  sanitizeFilename,
  uploadFileToSignedUrl
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

const TYPE_ACCENT: Record<VideoType, string> = {
  OOTD: "hsl(var(--primary))",
  TRAINING: "hsl(55 98% 60%)",
  BEFORE_AFTER: "hsl(var(--mint))",
  SPORTS_80S: "hsl(var(--primary))",
  CINEMATIC: "hsl(var(--secondary))"
};

const TYPE_ACCENT_CLASS: Record<VideoType, { bg: string; text: string; border: string; glow: string }> = {
  OOTD: {
    bg: "bg-primary/10",
    text: "text-primary",
    border: "border-primary",
    glow: "shadow-[0_0_0_3px_hsl(var(--primary)/0.22),0_8px_24px_-8px_hsl(var(--primary)/0.35)]"
  },
  TRAINING: {
    bg: "bg-amber-50",
    text: "text-amber-600",
    border: "border-amber-400",
    glow: "shadow-[0_0_0_3px_hsl(55_98%_60%/0.25),0_8px_24px_-8px_hsl(55_98%_60%/0.35)]"
  },
  BEFORE_AFTER: {
    bg: "bg-mint/10",
    text: "text-mint",
    border: "border-mint",
    glow: "shadow-[0_0_0_3px_hsl(var(--mint)/0.22),0_8px_24px_-8px_hsl(var(--mint)/0.35)]"
  },
  SPORTS_80S: {
    bg: "bg-primary/10",
    text: "text-primary",
    border: "border-primary",
    glow: "shadow-[0_0_0_3px_hsl(var(--primary)/0.22),0_8px_24px_-8px_hsl(var(--primary)/0.35)]"
  },
  CINEMATIC: {
    bg: "bg-secondary/10",
    text: "text-secondary",
    border: "border-secondary",
    glow: "shadow-[0_0_0_3px_hsl(var(--secondary)/0.22),0_8px_24px_-8px_hsl(var(--secondary)/0.28)]"
  }
};

/* ────────────────────────────────────────────────────────────────────────── */
/* Types                                                                      */
/* ────────────────────────────────────────────────────────────────────────── */

type WizardStep = 1 | 2 | 3 | 4 | 5;

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
  const [batchFiles, setBatchFiles] = useState<File[]>([]);
  const [batchProgress, setBatchProgress] = useState<number[]>([]);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resolvedTrackingId, setResolvedTrackingId] = useState(monthlyTrackingId);
  const batchAbortRef = useRef<AbortController | null>(null);

  const hasActiveVideoTypes = ratesByType.length > 0;
  const isBatchEligible = activeType !== null && BATCH_SUPPORTED_TYPES.includes(activeType);

  useEffect(() => {
    setResolvedTrackingId(monthlyTrackingId);
  }, [monthlyTrackingId]);

  useEffect(() => {
    return () => { batchAbortRef.current?.abort(); };
  }, []);

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
    setWarningMessage(null);
    setErrorMessage(null);
  }

  function goFromStep1() {
    if (activeType && BATCH_SUPPORTED_TYPES.includes(activeType)) {
      setStep(2);
    } else {
      setUploadMode("single");
      setStep(3);
    }
  }

  async function handleFile(file: File) {
    if (!auth.user) { router.replace("/login"); return; }
    if (!activeType) { setErrorMessage("Sélectionne un type de contenu."); return; }

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
          warnings.push(`Résolution ${meta.width}x${meta.height} hors recommandation (1080x1920 ou 1080x1080).`);
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
        body: JSON.stringify({ monthlyTrackingId: resolvedTrackingId, videoType: activeType, filename })
      });

      const signedPayload = (await signed.json().catch(() => null)) as {
        key?: string; signedUrl?: string; monthlyTrackingId?: string; message?: string;
      } | null;

      if (!signed.ok || !signedPayload?.key || !signedPayload.signedUrl) {
        throw new Error(signedPayload?.message ?? "Impossible de préparer l'upload.");
      }

      const trackingIdForUpload = signedPayload.monthlyTrackingId ?? resolvedTrackingId;
      if (!trackingIdForUpload) throw new Error("Suivi mensuel introuvable.");
      setResolvedTrackingId(trackingIdForUpload);

      setUploadProgress(0);
      await uploadFileToSignedUrl(signedPayload.signedUrl, file, setUploadProgress);

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

      setStep(5);
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

    batchAbortRef.current?.abort();
    batchAbortRef.current = new AbortController();
    const { signal } = batchAbortRef.current;

    setUploading(true);
    setWarningMessage(null);
    setErrorMessage(null);
    setBatchProgress(files.map(() => 0));

    try {
      const collectedKeys: string[] = [];
      const collectedSizes: number[] = [];
      let batchTrackingId = resolvedTrackingId;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const filename = sanitizeFilename(file.name);

        const signed = await fetch("/api/creator/uploads/video/signed-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ monthlyTrackingId: batchTrackingId, videoType: activeType, filename })
        });

        const signedPayload = (await signed.json().catch(() => null)) as {
          key?: string; signedUrl?: string; monthlyTrackingId?: string; message?: string;
        } | null;

        if (!signed.ok || !signedPayload?.key || !signedPayload.signedUrl) {
          throw new Error(signedPayload?.message ?? `Impossible de préparer l'upload du clip ${i + 1}.`);
        }

        if (i === 0 && signedPayload.monthlyTrackingId) {
          batchTrackingId = signedPayload.monthlyTrackingId;
          setResolvedTrackingId(batchTrackingId);
        }

        await uploadFileToSignedUrl(signedPayload.signedUrl, file, (pct) => {
          setBatchProgress((prev) => {
            const next = [...prev];
            next[i] = pct;
            return next;
          });
        }, signal);

        collectedKeys.push(signedPayload.key);
        collectedSizes.push(Math.max(1, Math.ceil(file.size / (1024 * 1024))));
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

      setStep(5);
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
    <div className="overflow-hidden rounded-[24px] border-2 border-foreground/10 bg-white shadow-[0_12px_40px_-16px_rgba(6,13,56,0.22)]">
      <WizardHeader step={step} isBatchEligible={isBatchEligible} />

      <div className="px-5 py-7 sm:px-8 sm:py-8">
        {step === 1 && (
          <StepChooseType
            ratesByType={ratesByType}
            activeType={activeType}
            onSelect={(type) => {
              setActiveType(type);
              if (type && !BATCH_SUPPORTED_TYPES.includes(type)) setUploadMode("single");
            }}
            onContinue={goFromStep1}
          />
        )}

        {step === 2 && activeType && isBatchEligible && (
          <StepChooseMode
            activeType={activeType}
            uploadMode={uploadMode}
            onModeChange={setUploadMode}
            onBack={() => setStep(1)}
            onContinue={() => setStep(3)}
          />
        )}

        {step === 3 && activeType && activeRate && (
          <StepSpecs
            activeType={activeType}
            rate={activeRate.ratePerVideo}
            specs={specs}
            onBack={() => { if (isBatchEligible) setStep(2); else setStep(1); }}
            onContinue={() => setStep(4)}
          />
        )}

        {step === 4 && activeType && activeRate && uploadMode === "single" && (
          <StepUpload
            activeType={activeType}
            rate={activeRate.ratePerVideo}
            dragActive={dragActive}
            uploading={uploading}
            uploadProgress={uploadProgress}
            warningMessage={warningMessage}
            errorMessage={errorMessage}
            onBack={() => { if (!uploading) setStep(3); }}
            onDragActive={setDragActive}
            onFile={(file) => void handleFile(file)}
          />
        )}

        {step === 4 && activeType && activeRate && uploadMode === "batch" && (
          <StepBatchUpload
            activeType={activeType}
            rate={activeRate.ratePerVideo}
            uploading={uploading}
            batchFiles={batchFiles}
            batchProgress={batchProgress}
            warningMessage={warningMessage}
            errorMessage={errorMessage}
            onBack={() => { if (!uploading) setStep(3); }}
            onFilesChange={setBatchFiles}
            onUpload={(files) => void handleBatchFiles(files)}
          />
        )}

        {step === 5 && activeType && activeRate && (
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
/* Wizard header                                                              */
/* ────────────────────────────────────────────────────────────────────────── */

function WizardHeader({ step, isBatchEligible }: { step: WizardStep; isBatchEligible: boolean }) {
  const stepsFor5: Array<{ n: WizardStep; label: string }> = [
    { n: 1, label: "Type" },
    { n: 2, label: "Mode" },
    { n: 3, label: "Specs" },
    { n: 4, label: "Upload" },
    { n: 5, label: "Envoyé" }
  ];
  const stepsFor4: Array<{ n: WizardStep; label: string }> = [
    { n: 1, label: "Type" },
    { n: 3, label: "Specs" },
    { n: 4, label: "Upload" },
    { n: 5, label: "Envoyé" }
  ];
  const steps = isBatchEligible ? stepsFor5 : stepsFor4;
  const displayIndex = steps.findIndex((s) => s.n === step);
  const currentDisplay = displayIndex >= 0 ? displayIndex + 1 : 1;
  const currentLabel = steps[displayIndex >= 0 ? displayIndex : 0]?.label ?? "Type";

  return (
    <div className="border-b border-foreground/10 bg-white px-5 py-4 sm:px-8">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[10px] font-black text-white">
            {currentDisplay}
          </span>
          <p className="text-[12px] font-black uppercase tracking-[0.12em] text-foreground/60">
            {currentLabel}
          </p>
        </div>
        <p className="text-[11px] font-bold tabular-nums text-foreground/35">
          {currentDisplay}&thinsp;/&thinsp;{steps.length}
        </p>
      </div>
      <div className="flex items-center gap-1">
        {steps.map((s, idx) => {
          const stepIdx = steps.findIndex((x) => x.n === step);
          const isDone = idx < stepIdx;
          const isActive = idx === stepIdx;
          return (
            <div
              key={s.n}
              className={cn(
                "h-1 flex-1 rounded-full transition-all duration-300",
                isDone ? "bg-mint" : isActive ? "bg-primary" : "bg-foreground/12"
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
        <p className="mt-1 text-[13px] text-foreground/55">
          Chaque type a son tarif et ses règles. Choisis celui qui correspond à ta vidéo.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {ratesByType.map((rate) => {
          const Icon = TYPE_ICON[rate.videoType] ?? Film;
          const isActive = activeType === rate.videoType;
          const accent = TYPE_ACCENT_CLASS[rate.videoType];

          return (
            <button
              key={rate.videoType}
              type="button"
              onClick={() => onSelect(rate.videoType)}
              className={cn(
                "group relative overflow-hidden rounded-[20px] border-2 p-4 text-left transition-all duration-200",
                isActive
                  ? "border-primary bg-primary/[0.05] shadow-[0_0_0_3px_hsl(var(--primary)/0.15)]"
                  : "border-foreground/10 bg-white hover:border-foreground/25 hover:bg-frost hover:shadow-sm"
              )}
              aria-pressed={isActive}
            >
              {isActive && (
                <span className="absolute right-3 top-3 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white">
                  <Check className="h-3 w-3" strokeWidth={3} />
                </span>
              )}

              <div className="flex items-start gap-3">
                <div className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] transition-all duration-200",
                  isActive ? "bg-primary text-white" : "bg-foreground/7 text-foreground/45"
                )}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-[13px] font-black uppercase leading-none text-secondary">
                    {VIDEO_TYPE_LABELS[rate.videoType]}
                  </p>
                  <p className={cn(
                    "mt-1.5 font-display text-[22px] font-black leading-none tracking-tight",
                    isActive ? "text-primary" : "text-foreground/35"
                  )}>
                    {formatCurrency(rate.ratePerVideo)}
                  </p>
                  <p className="mt-1.5 text-[11px] leading-[1.5] text-foreground/50">
                    {TYPE_DESCRIPTION[rate.videoType]}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-end pt-1">
        <button
          type="button"
          onClick={onContinue}
          disabled={!activeType}
          className={cn(
            "inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-[11px] font-black uppercase tracking-[0.14em] text-white transition-all duration-200",
            "bg-secondary",
            "shadow-[0_6px_0_0_rgba(6,13,56,0.28)] active:translate-y-[3px] active:shadow-[0_3px_0_0_rgba(6,13,56,0.28)]",
            "hover:bg-primary",
            "disabled:cursor-not-allowed disabled:from-foreground/20 disabled:to-foreground/15 disabled:shadow-none disabled:translate-y-0 disabled:text-white/50"
          )}
        >
          Suivant
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Step 2 — Choose mode                                                       */
/* ────────────────────────────────────────────────────────────────────────── */

function StepChooseMode({
  activeType,
  uploadMode,
  onModeChange,
  onBack,
  onContinue
}: {
  activeType: VideoType;
  uploadMode: UploadMode;
  onModeChange: (mode: UploadMode) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  const Icon = TYPE_ICON[activeType] ?? Film;
  const accent = TYPE_ACCENT_CLASS[activeType];
  const minClips = BATCH_MIN_CLIPS[activeType] ?? 4;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 rounded-[16px] border border-foreground/10 bg-foreground/[0.03] px-4 py-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-white">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-foreground/45">
            Type sélectionné
          </p>
          <p className="font-display text-[15px] font-black uppercase leading-none text-secondary">
            {VIDEO_TYPE_LABELS[activeType]}
          </p>
        </div>
      </div>

      <div>
        <h2 className="font-display text-2xl font-black uppercase leading-tight text-secondary sm:text-[28px]">
          Comment veux-tu uploader ?
        </h2>
        <p className="mt-1 text-[13px] text-foreground/55">
          Choisis entre une vidéo montée ou un lot de clips bruts.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => onModeChange("single")}
          aria-pressed={uploadMode === "single"}
          className={cn(
            "relative overflow-hidden rounded-[20px] border-2 p-5 text-left transition-all duration-200",
            uploadMode === "single"
              ? "border-primary bg-primary/[0.06] shadow-[0_0_0_3px_hsl(var(--primary)/0.18),0_8px_24px_-8px_hsl(var(--primary)/0.28)]"
              : "border-foreground/10 bg-white hover:border-foreground/25 hover:bg-frost hover:shadow-sm"
          )}
        >
          {uploadMode === "single" && (
            <span className="absolute right-3 top-3 inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white">
              <Check className="h-3.5 w-3.5" strokeWidth={3} />
            </span>
          )}
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-[16px] bg-primary/10">
            <UploadCloud className="h-6 w-6 text-primary" />
          </div>
          <p className="font-display text-lg font-black uppercase leading-tight text-secondary">
            Vidéo montée
          </p>
          <p className="mt-1.5 text-[12px] leading-[1.5] text-foreground/60">
            1 fichier prêt à publier. Montage, son, cadrages inclus.
          </p>
          <div className="mt-3 inline-flex items-center rounded-full border border-primary/20 bg-primary/8 px-3 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-primary">
            1 fichier
          </div>
        </button>

        <button
          type="button"
          onClick={() => onModeChange("batch")}
          aria-pressed={uploadMode === "batch"}
          className={cn(
            "relative overflow-hidden rounded-[20px] border-2 p-5 text-left transition-all duration-200",
            uploadMode === "batch"
              ? "border-secondary bg-secondary/[0.05] shadow-[0_0_0_3px_hsl(var(--secondary)/0.18),0_8px_24px_-8px_hsl(var(--secondary)/0.25)]"
              : "border-foreground/10 bg-white hover:border-foreground/25 hover:bg-frost hover:shadow-sm"
          )}
        >
          {uploadMode === "batch" && (
            <span className="absolute right-3 top-3 inline-flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-white">
              <Check className="h-3.5 w-3.5" strokeWidth={3} />
            </span>
          )}
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-[16px] bg-secondary/10">
            <Layers className="h-6 w-6 text-secondary" />
          </div>
          <p className="font-display text-lg font-black uppercase leading-tight text-secondary">
            Lot de clips
          </p>
          <p className="mt-1.5 text-[12px] leading-[1.5] text-foreground/60">
            Min. {minClips} scènes brutes — compte comme{" "}
            <span className="font-semibold text-secondary">1 vidéo</span> dans ton paiement.
          </p>
          <div className="mt-3 inline-flex items-center rounded-full border border-secondary/20 bg-secondary/8 px-3 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-secondary">
            Multi-clips
          </div>
        </button>
      </div>

      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 rounded-full border-2 border-foreground/15 px-5 py-3 text-[11px] font-black uppercase tracking-[0.1em] text-foreground/60 transition hover:border-foreground/30 hover:bg-frost active:scale-95"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </button>
        <button
          type="button"
          onClick={onContinue}
          className="inline-flex items-center gap-2 rounded-full bg-secondary px-7 py-3.5 text-[11px] font-black uppercase tracking-[0.14em] text-white shadow-[0_6px_0_0_rgba(6,13,56,0.28)] transition-all hover:bg-primary active:translate-y-[3px] active:shadow-[0_3px_0_0_rgba(6,13,56,0.28)]"
        >
          Voir les specs
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Step 3 — Specs                                                             */
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
  const accent = TYPE_ACCENT_CLASS[activeType];

  return (
    <div className="space-y-6">
      <div
        className="flex items-center gap-3 rounded-[16px] border border-foreground/10 bg-foreground/[0.03] px-4 py-3"
      >
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white"
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-foreground/45">
            Type choisi
          </p>
          <p className="font-display text-[15px] font-black uppercase leading-none text-secondary">
            {VIDEO_TYPE_LABELS[activeType]}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black uppercase tracking-[0.1em] text-foreground/45">Tarif</p>
          <p className="font-display text-[22px] font-black leading-none text-primary">
            {formatCurrency(rate)}
          </p>
        </div>
      </div>

      <div>
        <h2 className="font-display text-2xl font-black uppercase leading-tight text-secondary sm:text-[28px]">
          Specs techniques
        </h2>
        <p className="mt-1 text-[13px] text-foreground/55">
          Respecte ces règles pour maximiser tes chances de validation.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <SpecTile label="Format" value="MP4 / MOV" />
        <SpecTile label="Résolution" value="1080×1920" hint="ou 1080×1080" />
        <SpecTile label="Durée" value="15–60s" />
      </div>

      {specs.length > 0 && (
        <div className="rounded-[18px] border border-foreground/10 bg-frost/70 p-4">
          <p className="mb-3 text-[10px] font-black uppercase tracking-[0.16em] text-foreground/50">
            Règles générales
          </p>
          <ul className="space-y-2">
            {specs.map((spec) => (
              <li key={spec} className="flex items-start gap-2.5 text-[13px] text-foreground/70">
                <span
                  className="mt-[3px] flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-mint/15"
                  aria-hidden
                >
                  <Check className="h-2.5 w-2.5 text-mint" strokeWidth={3} />
                </span>
                <span>{spec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 rounded-full border-2 border-foreground/15 px-5 py-3 text-[11px] font-black uppercase tracking-[0.1em] text-foreground/60 transition hover:border-foreground/30 hover:bg-frost active:scale-95"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </button>
        <button
          type="button"
          onClick={onContinue}
          className="inline-flex items-center gap-2 rounded-full bg-secondary px-7 py-3.5 text-[11px] font-black uppercase tracking-[0.14em] text-white shadow-[0_6px_0_0_rgba(6,13,56,0.28)] transition-all hover:bg-primary active:translate-y-[3px] active:shadow-[0_3px_0_0_rgba(6,13,56,0.28)]"
        >
          Uploader
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function SpecTile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-[16px] border-2 border-foreground/8 bg-white px-3 py-3.5 text-center shadow-sm sm:px-4 sm:py-4">
      <p className="text-[9px] font-black uppercase tracking-[0.14em] text-foreground/45">{label}</p>
      <p className="mt-1.5 font-display text-base font-black uppercase leading-none text-secondary sm:text-[18px]">
        {value}
      </p>
      {hint && <p className="mt-1 text-[10px] text-foreground/45">{hint}</p>}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Step 4a — Single upload                                                    */
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
  const accent = TYPE_ACCENT_CLASS[activeType];
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [localFile, setLocalFile] = useState<File | null>(null);
  const canInteract = !uploading;

  return (
    <div className="space-y-6">
      <div
        className="flex items-center gap-3 rounded-[16px] border border-foreground/10 bg-foreground/[0.03] px-4 py-3"
      >
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white"
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-foreground/45">
            Upload {VIDEO_TYPE_LABELS[activeType]}
          </p>
          <p className="truncate text-[12px] text-foreground/55">
            {formatCurrency(rate)} par vidéo validée · réponse sous 48h
          </p>
        </div>
      </div>

      <div>
        <h2 className="font-display text-2xl font-black uppercase leading-tight text-secondary sm:text-[28px]">
          Dépose ton fichier
        </h2>
        <p className="mt-1 text-[13px] text-foreground/55">
          Glisse ta vidéo ou parcours tes fichiers. Formats recommandés : MP4 / MOV.
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) { setLocalFile(file); onFile(file); }
        }}
      />

      <div
        className={cn(
          "relative overflow-hidden rounded-[22px] border-2 border-dashed px-4 py-10 text-center transition-all duration-200 sm:px-6 sm:py-14",
          dragActive
            ? "scale-[1.01] border-primary bg-primary/[0.07] shadow-[0_0_0_4px_hsl(var(--primary)/0.15)]"
            : uploading
              ? "border-secondary/40 bg-secondary/[0.04]"
              : "cursor-pointer border-foreground/20 bg-frost/50 hover:border-primary/50 hover:bg-primary/[0.03] hover:shadow-sm",
          !canInteract && !uploading && "cursor-wait"
        )}
        onClick={() => { if (canInteract) fileInputRef.current?.click(); }}
        onDragEnter={(e) => { e.preventDefault(); if (canInteract) onDragActive(true); }}
        onDragOver={(e) => { e.preventDefault(); if (canInteract) onDragActive(true); }}
        onDragLeave={(e) => { e.preventDefault(); onDragActive(false); }}
        onDrop={(e) => {
          e.preventDefault();
          onDragActive(false);
          if (!canInteract) return;
          const file = e.dataTransfer.files?.[0];
          if (file) { setLocalFile(file); onFile(file); }
        }}
        role="button"
        tabIndex={0}
        aria-label="Zone de glisser-déposer vidéo"
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && canInteract) { e.preventDefault(); fileInputRef.current?.click(); }
        }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.035]"
          style={{ backgroundImage: "radial-gradient(hsl(var(--foreground)) 1px, transparent 1px)", backgroundSize: "16px 16px" }}
          aria-hidden
        />

        {uploading ? (
          <div className="relative space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary text-white shadow-lg shadow-secondary/30">
              <UploadCloud className="h-8 w-8 animate-pulse" />
            </div>
            <div>
              <p className="font-display text-xl font-black uppercase text-secondary">Upload en cours...</p>
              <p className="mt-1 font-display text-3xl font-black leading-none text-primary">{uploadProgress}%</p>
            </div>
            {localFile && (
              <p className="truncate text-[12px] text-foreground/55">{localFile.name} · {formatFileSize(localFile.size)}</p>
            )}
            <div
              className="mx-auto h-2.5 max-w-xs overflow-hidden rounded-full bg-foreground/10"
              role="progressbar"
              aria-valuenow={uploadProgress}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-secondary transition-[width] duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="relative">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary/8 text-secondary">
              <UploadCloud className="h-8 w-8" />
            </div>
            <p className="font-display text-xl font-black uppercase text-secondary">
              {dragActive ? "Relâche ici !" : "Glisse ta vidéo ici"}
            </p>
            <p className="mt-1.5 text-[12px] text-foreground/55">ou clique pour parcourir tes fichiers</p>
            <div className="mt-5 flex justify-center">
              <span className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-[11px] font-black uppercase tracking-[0.12em] text-white shadow-[0_6px_0_0_rgba(6,13,56,0.22)]">
                <UploadCloud className="h-3.5 w-3.5" />
                Parcourir les fichiers
              </span>
            </div>
            <p className="mt-4 text-[11px] text-foreground/40">MP4 / MOV · max 500 MB · 1080×1920 ou 1080×1080</p>
          </div>
        )}
      </div>

      {warningMessage && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-300/50 bg-amber-50 px-4 py-3.5 text-[13px] text-amber-800" role="alert">
          <span className="mt-px shrink-0 text-lg leading-none" aria-hidden>⚠</span>
          <span>{warningMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/[0.07] px-4 py-3.5 text-[13px] font-medium text-destructive" role="alert">
          {errorMessage}
        </div>
      )}

      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={onBack}
          disabled={uploading}
          className="inline-flex items-center gap-1.5 rounded-full border-2 border-foreground/15 px-5 py-3 text-[11px] font-black uppercase tracking-[0.1em] text-foreground/60 transition hover:border-foreground/30 hover:bg-frost active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </button>
        <p className="text-[11px] text-foreground/45">
          {uploading ? "Ne ferme pas cette page" : "Upload dès que tu déposes le fichier"}
        </p>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Step 4b — Batch upload                                                     */
/* ────────────────────────────────────────────────────────────────────────── */

function StepBatchUpload({
  activeType,
  rate,
  uploading,
  batchFiles,
  batchProgress,
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
  warningMessage: string | null;
  errorMessage: string | null;
  onBack: () => void;
  onFilesChange: (files: File[]) => void;
  onUpload: (files: File[]) => void;
}) {
  const Icon = TYPE_ICON[activeType] ?? Film;
  const accent = TYPE_ACCENT_CLASS[activeType];
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const minClips = BATCH_MIN_CLIPS[activeType] ?? 4;
  const canSubmit = batchFiles.length >= minClips && !uploading;
  const doneCount = batchProgress.filter((p) => p === 100).length;
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

  return (
    <div className="space-y-6">
      <div
        className="flex items-center gap-3 rounded-[16px] border border-foreground/10 bg-foreground/[0.03] px-4 py-3"
      >
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white"
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-foreground/45">
            Lot · {VIDEO_TYPE_LABELS[activeType]}
          </p>
          <p className="truncate text-[12px] text-foreground/55">
            {formatCurrency(rate)} pour le lot validé · min. {minClips} clips
          </p>
        </div>
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-xl text-center transition-colors",
            batchFiles.length >= minClips ? "bg-mint/15 text-mint" : batchFiles.length > 0 ? "bg-amber-100 text-amber-700" : "bg-foreground/8 text-foreground/40"
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
        <p className="mt-1 text-[13px] text-foreground/55">
          Sélectionne {minClips} scènes brutes minimum. Le lot compte comme 1 vidéo dans ton paiement.
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        multiple
        className="sr-only"
        onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }}
      />

      {!uploading && (
        <div
          className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-[20px] border-2 border-dashed border-foreground/20 bg-frost/50 px-4 py-8 text-center transition-colors hover:border-secondary/50 hover:bg-secondary/[0.03]"
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          aria-label="Ajouter des clips vidéo"
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fileInputRef.current?.click(); } }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary/10 text-secondary">
            <Layers className="h-6 w-6" />
          </div>
          <div>
            <p className="font-display text-lg font-black uppercase text-secondary">Glisse tes clips ici</p>
            <p className="mt-0.5 text-[12px] text-foreground/55">ou clique pour sélectionner plusieurs fichiers</p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-5 py-2.5 text-[11px] font-black uppercase tracking-[0.12em] text-white shadow-[0_6px_0_0_rgba(6,13,56,0.22)]">
            <Layers className="h-3.5 w-3.5" />
            Ajouter des clips
          </span>
          <p className="text-[11px] text-foreground/40">MP4 / MOV · max 500 MB par clip</p>
        </div>
      )}

      {batchFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-foreground/50">
            Clips sélectionnés ({batchFiles.length})
          </p>
          <ul className="space-y-2" aria-label="Liste des clips">
            {batchFiles.map((file, i) => {
              const progress = uploading ? (batchProgress[i] ?? 0) : null;
              const isDone = progress === 100;
              return (
                <li
                  key={`${file.name}-${file.size}-${i}`}
                  className="flex items-center gap-3 rounded-[14px] border-2 border-foreground/8 bg-white px-3 py-2.5"
                >
                  <div
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[11px] font-black",
                      isDone ? "bg-mint text-white" : uploading ? "bg-secondary/10 text-secondary" : "bg-foreground/8 text-foreground/50"
                    )}
                    aria-hidden
                  >
                    {isDone ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : i + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] font-semibold text-foreground/80">{file.name}</p>
                    <p className="text-[11px] text-foreground/45">{formatFileSize(file.size)}</p>
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
                          className="h-full rounded-full bg-gradient-to-r from-secondary to-primary transition-[width] duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                  {!uploading && (
                    <button
                      type="button"
                      onClick={() => onFilesChange(batchFiles.filter((_, j) => j !== i))}
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-foreground/35 transition hover:bg-destructive/10 hover:text-destructive"
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

      {uploading && (
        <div className="rounded-[16px] border-2 border-secondary/20 bg-secondary/[0.04] p-4">
          <div className="flex items-center justify-between text-[12px]">
            <span className="font-black uppercase tracking-wide text-secondary">
              Upload en cours ({doneCount}/{batchFiles.length})
            </span>
            <span className="font-display text-lg font-black text-primary">{overallProgress}%</span>
          </div>
          <div
            className="mt-2 h-2.5 overflow-hidden rounded-full bg-foreground/10"
            role="progressbar"
            aria-valuenow={overallProgress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Progression globale : ${overallProgress}%`}
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-secondary to-primary transition-[width] duration-300"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
          <p className="mt-2 text-center text-[11px] text-foreground/50">Ne ferme pas cette page pendant l&apos;upload</p>
        </div>
      )}

      {warningMessage && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-300/50 bg-amber-50 px-4 py-3.5 text-[13px] text-amber-800" role="alert">
          <span className="mt-px shrink-0 text-lg leading-none" aria-hidden>⚠</span>
          <span>{warningMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/[0.07] px-4 py-3.5 text-[13px] font-medium text-destructive" role="alert">
          {errorMessage}
        </div>
      )}

      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={onBack}
          disabled={uploading}
          className="inline-flex items-center gap-1.5 rounded-full border-2 border-foreground/15 px-5 py-3 text-[11px] font-black uppercase tracking-[0.1em] text-foreground/60 transition hover:border-foreground/30 hover:bg-frost active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </button>
        <button
          type="button"
          onClick={() => onUpload(batchFiles)}
          disabled={!canSubmit}
          className={cn(
            "inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-[11px] font-black uppercase tracking-[0.14em] text-white transition-all active:scale-95",
            canSubmit
              ? "bg-secondary shadow-[0_6px_0_0_rgba(6,13,56,0.28)] hover:bg-primary active:translate-y-[3px] active:shadow-[0_3px_0_0_rgba(6,13,56,0.28)]"
              : "cursor-not-allowed bg-foreground/20 text-white/50"
          )}
        >
          {uploading ? (
            <><UploadCloud className="h-4 w-4 animate-pulse" />Upload...</>
          ) : (
            <><Layers className="h-4 w-4" />Envoyer le lot</>
          )}
        </button>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Step 5 — Success                                                           */
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
      <div className="relative mx-auto h-24 w-24">
        <div className="absolute inset-0 animate-ping rounded-full bg-mint/20" aria-hidden />
        <div className="absolute inset-2 rounded-full bg-mint/15" aria-hidden />
        <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-mint/15">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-mint text-white shadow-lg shadow-mint/40">
            <CheckCircle2 className="h-9 w-9" strokeWidth={2.5} />
          </div>
        </div>
      </div>

      <div>
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-mint">Upload confirmé</p>
        <h2 className="mt-1 font-display text-3xl font-black uppercase leading-tight text-secondary sm:text-[34px]">
          {isBatch ? "Lot envoyé\u00a0!" : "Vidéo envoyée\u00a0!"}
        </h2>
        <p className="mx-auto mt-2 max-w-sm text-[13px] text-foreground/60">
          {isBatch ? (
            <>Tes <span className="font-bold text-secondary">{clipCount} clips</span>{" "}{VIDEO_TYPE_LABELS[activeType]} sont en attente de validation. Réponse sous 48h.</>
          ) : (
            <>Ton upload <span className="font-bold text-secondary">{VIDEO_TYPE_LABELS[activeType]}</span> est en attente de validation. Réponse sous 48h.</>
          )}
        </p>
      </div>

      <div className="mx-auto max-w-sm overflow-hidden rounded-[20px] border-2 border-foreground/10 bg-white shadow-sm">
        <div className="border-b border-foreground/8 px-5 py-3.5">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[10px] font-black uppercase tracking-[0.14em] text-foreground/45">Type</span>
            <span className="font-display text-[13px] font-black uppercase text-secondary">{VIDEO_TYPE_LABELS[activeType]}</span>
          </div>
        </div>
        {isBatch && (
          <div className="border-b border-foreground/8 px-5 py-3.5">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[10px] font-black uppercase tracking-[0.14em] text-foreground/45">Clips envoyés</span>
              <span className="font-display text-[13px] font-black uppercase text-secondary">{clipCount}</span>
            </div>
          </div>
        )}
        <div className="px-5 py-3.5">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[10px] font-black uppercase tracking-[0.14em] text-foreground/45">
              Gain si validé{isBatch ? "" : "e"}
            </span>
            <span className="font-display text-[20px] font-black uppercase text-primary">{formatCurrency(rate)}</span>
          </div>
        </div>
        <div className="h-1.5 w-full bg-gradient-to-r from-primary via-secondary to-mint" />
      </div>

      <div className="flex flex-col items-center gap-2 pt-1 sm:flex-row sm:justify-center sm:gap-3">
        <button
          type="button"
          onClick={onUploadAnother}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-7 py-3.5 text-[11px] font-black uppercase tracking-[0.14em] text-white shadow-[0_6px_0_0_rgba(6,13,56,0.22)] transition-all hover:from-secondary hover:to-secondary/90 active:translate-y-[3px] active:shadow-[0_3px_0_0_rgba(6,13,56,0.22)] sm:w-auto"
        >
          <UploadCloud className="h-4 w-4" />
          {isBatch ? "Uploader un autre lot" : "Uploader une autre vidéo"}
        </button>
      </div>
    </div>
  );
}
