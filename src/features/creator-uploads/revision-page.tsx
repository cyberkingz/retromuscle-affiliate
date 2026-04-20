"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { RevisionPageData } from "@/application/use-cases/get-revision-page-data";
import { VIDEO_TYPE_LABELS } from "@/domain/constants/labels";
import { RevisionPageHeader } from "@/features/creator-uploads/components/revision-page-header";
import { OriginalVideoCard } from "@/features/creator-uploads/components/original-video-card";
import { AdminInstructionsCard } from "@/features/creator-uploads/components/admin-instructions-card";
import { RevisionUploadCard } from "@/features/creator-uploads/components/revision-upload-card";
import { VideoHistoryTimeline } from "@/features/creator-uploads/components/video-history-timeline";

interface RevisionPageProps {
  data: RevisionPageData;
  signedVideoUrl: string | null;
}

export function RevisionPage({ data, signedVideoUrl }: RevisionPageProps) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const { originalVideo } = data;
  const videoTypeLabel =
    VIDEO_TYPE_LABELS[originalVideo.videoType] ?? originalVideo.videoType;

  function handleUploadSuccess() {
    setStep(3);
    router.refresh();
  }

  // Step 3 — success screen
  if (step === 3) {
    return (
      <div className="mx-auto max-w-lg space-y-6 py-10 text-center">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-mint/20 text-4xl">
          ✓
        </div>
        <div>
          <h2 className="font-display text-2xl uppercase leading-none text-foreground">
            Vidéo envoyée !
          </h2>
          <p className="mt-2 text-sm text-foreground/60">
            Ta version corrigée est en attente de validation par l&apos;équipe RetroMuscle.
          </p>
        </div>
        <button
          onClick={() => router.push("/uploads")}
          className="text-sm font-semibold text-primary underline-offset-2 hover:underline"
        >
          Retourner aux uploads
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <RevisionPageHeader videoTypeLabel={videoTypeLabel} step={step} />

      {/* 2-col desktop layout */}
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Left column: context */}
        <div className="space-y-4">
          <OriginalVideoCard
            signedUrl={signedVideoUrl}
            videoTypeLabel={videoTypeLabel}
            durationSeconds={originalVideo.durationSeconds}
            resolution={originalVideo.resolution}
            fileSizeMb={originalVideo.fileSizeMb}
            createdAt={originalVideo.createdAt}
          />

          {data.adminNote ? (
            <AdminInstructionsCard note={data.adminNote} />
          ) : null}

          {data.versionHistory.length > 1 ? (
            <VideoHistoryTimeline
              videos={data.versionHistory}
              currentVideoId={originalVideo.id}
            />
          ) : null}
        </div>

        {/* Right column: upload card */}
        <div>
          <RevisionUploadCard
            originalVideoId={originalVideo.id}
            monthlyTrackingId={data.monthlyTrackingId}
            videoType={originalVideo.videoType}
            videoTypeLabel={videoTypeLabel}
            onSuccess={handleUploadSuccess}
          />
        </div>
      </div>
    </div>
  );
}
