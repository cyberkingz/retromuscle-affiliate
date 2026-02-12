"use client";

import { useRouter } from "next/navigation";

import type { CreatorDashboardData } from "@/application/use-cases/get-creator-dashboard-data";
import { SectionHeading } from "@/components/ui/section-heading";
import { UploadCard } from "@/features/creator-dashboard/components/upload-card";
import { CardSection } from "@/components/layout/card-section";
import { StatusBadge } from "@/components/ui/status-badge";
import { videoStatusTone } from "@/lib/status-tone";
import { monthToLabel, toShortDate } from "@/lib/date";
import { VIDEO_STATUS_LABELS, VIDEO_TYPE_LABELS } from "@/domain/constants/labels";
import type { VideoStatus } from "@/domain/types";

interface CreatorUploadsPageProps {
  data: CreatorDashboardData;
}

export function CreatorUploadsPage({ data }: CreatorUploadsPageProps) {
  const router = useRouter();

  const availableMonths = data.paymentHistory
    .map((h) => h.month)
    .sort((a, b) => b.localeCompare(a));

  const approvedCount = data.upload.recentVideos.filter((v) => v.status === "approved").length;

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Uploads"
        title={`Depose tes contenus — ${monthToLabel(data.month)}`}
        subtitle="Upload, suis le statut (validation / rejet), et re-upload si besoin."
      />

      {/* Month navigation */}
      {availableMonths.length > 1 ? (
        <CardSection className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs uppercase tracking-[0.15em] text-foreground/55">Periode</p>
            <select
              value={data.month}
              onChange={(event) => {
                const month = event.target.value;
                router.push(`/uploads?month=${month}`);
              }}
              className="h-9 rounded-xl border border-line bg-white px-3 text-sm capitalize"
            >
              {availableMonths.map((m) => (
                <option key={m} value={m}>
                  {monthToLabel(m)}
                </option>
              ))}
            </select>
          </div>
        </CardSection>
      ) : null}

      {/* Status summary */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-line bg-white/95 px-4 py-4 text-center">
          <p className="text-xs uppercase tracking-[0.12em] text-foreground/55">A valider</p>
          <p className="mt-1 font-display text-3xl uppercase leading-none text-foreground/80">
            {data.upload.pendingReviewCount}
          </p>
        </div>
        <div className="rounded-2xl border border-line bg-white/95 px-4 py-4 text-center">
          <p className="text-xs uppercase tracking-[0.12em] text-foreground/55">Approuvees</p>
          <p className="mt-1 font-display text-3xl uppercase leading-none text-mint">
            {approvedCount}
          </p>
        </div>
        <div className="rounded-2xl border border-line bg-white/95 px-4 py-4 text-center">
          <p className="text-xs uppercase tracking-[0.12em] text-foreground/55">Rejetees</p>
          <p className="mt-1 font-display text-3xl uppercase leading-none text-destructive">
            {data.upload.rejectedCount}
          </p>
        </div>
      </div>

      {/* Rejected summary banner */}
      {data.upload.rejectedCount > 0 ? (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {data.upload.rejectedCount} video{data.upload.rejectedCount > 1 ? "s" : ""} rejetee{data.upload.rejectedCount > 1 ? "s" : ""} — consulte les raisons ci-dessous et re-uploade une version corrigee.
        </div>
      ) : null}

      <UploadCard
        monthlyTrackingId={data.upload.monthlyTrackingId}
        specs={data.upload.specs}
        tips={data.upload.tips}
        pendingReviewCount={data.upload.pendingReviewCount}
        rejectedCount={data.upload.rejectedCount}
        recentVideos={data.upload.recentVideos}
      />

      {/* Full video list for the month */}
      <CardSection>
        <p className="text-xs uppercase tracking-[0.15em] text-foreground/55">
          Tous les uploads — {monthToLabel(data.month)}
        </p>

        {data.upload.recentVideos.length === 0 ? (
          <p className="mt-4 text-sm text-foreground/70">
            Aucun upload pour le moment. Depose ton premier contenu ci-dessus.
          </p>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {data.upload.recentVideos.map((video) => (
              <div
                key={video.id}
                className={
                  video.status === "rejected"
                    ? "rounded-2xl border border-destructive/25 bg-destructive/5 p-4"
                    : "rounded-2xl border border-line bg-frost/60 p-4"
                }
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{VIDEO_TYPE_LABELS[video.videoType]}</p>
                    <p className="text-xs text-foreground/60">{toShortDate(video.createdAt)}</p>
                  </div>
                  <StatusBadge
                    label={VIDEO_STATUS_LABELS[video.status as VideoStatus] ?? video.status}
                    tone={videoStatusTone(video.status)}
                  />
                </div>

                {video.status === "rejected" && video.rejectionReason ? (
                  <div className="mt-3 rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-2">
                    <p className="text-xs uppercase tracking-[0.1em] text-destructive/70">Raison du rejet</p>
                    <p className="mt-1 text-sm text-destructive">{video.rejectionReason}</p>
                  </div>
                ) : null}

                {video.status === "pending_review" ? (
                  <p className="mt-3 text-xs text-foreground/60">
                    En attente de validation par l&apos;equipe RetroMuscle.
                  </p>
                ) : null}

                {video.status === "approved" ? (
                  <p className="mt-3 text-xs text-mint">
                    Video validee et comptabilisee.
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </CardSection>
    </div>
  );
}
