"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import type { CreatorDashboardData } from "@/application/use-cases/get-creator-dashboard-data";
import { SectionHeading } from "@/components/ui/section-heading";
import { UploadWizard } from "@/features/creator-uploads/components/upload-wizard";
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
  const revisionCount = data.upload.recentVideos.filter(
    (v) => v.status === "revision_requested" && !v.supersededBy
  ).length;
  const strictRejectedCount = data.upload.recentVideos.filter(
    (v) => v.status === "rejected"
  ).length;

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Uploads"
        title={`Dépose tes contenus — ${monthToLabel(data.month)}`}
        subtitle="Upload, suis le statut (validation / rejet), et re-upload si besoin."
      />

      {/* Month navigation */}
      {availableMonths.length > 1 ? (
        <CardSection className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs uppercase tracking-[0.15em] text-foreground/70">Période</p>
            <select
              value={data.month}
              onChange={(event) => {
                const month = event.target.value;
                router.push(`/uploads?month=${month}`);
              }}
              aria-label="Sélectionner la période"
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
      <div className="grid gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-line bg-white/95 px-4 py-4 text-center">
          <p className="text-xs uppercase tracking-[0.12em] text-foreground/70">À valider</p>
          <p className="mt-1 font-display text-3xl uppercase leading-none text-foreground/80">
            {data.upload.pendingReviewCount}
          </p>
        </div>
        <div className="rounded-2xl border border-line bg-white/95 px-4 py-4 text-center">
          <p className="text-xs uppercase tracking-[0.12em] text-foreground/70">Approuvées</p>
          <p className="mt-1 font-display text-3xl uppercase leading-none text-mint">
            {approvedCount}
          </p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-center">
          <p className="text-xs uppercase tracking-[0.12em] text-amber-700/70">En révision</p>
          <p className="mt-1 font-display text-3xl uppercase leading-none text-amber-600">
            {revisionCount}
          </p>
        </div>
        <div className="rounded-2xl border border-line bg-white/95 px-4 py-4 text-center">
          <p className="text-xs uppercase tracking-[0.12em] text-foreground/70">Rejetées</p>
          <p className="mt-1 font-display text-3xl uppercase leading-none text-destructive">
            {strictRejectedCount}
          </p>
        </div>
      </div>

      {/* Revision requested banner */}
      {revisionCount > 0 ? (
        <div className="rounded-2xl border border-amber-300/40 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {revisionCount} vidéo{revisionCount > 1 ? "s" : ""} en attente de modification — consulte
          les instructions ci-dessous et re-uploade une version corrigée.
        </div>
      ) : null}

      {/* Rejected summary banner */}
      {strictRejectedCount > 0 ? (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {strictRejectedCount} vidéo{strictRejectedCount > 1 ? "s" : ""} rejetée
          {strictRejectedCount > 1 ? "s" : ""} — consulte les raisons ci-dessous et re-uploade une
          version corrigée.
        </div>
      ) : null}

      <UploadWizard
        monthlyTrackingId={data.upload.monthlyTrackingId}
        ratesByType={data.upload.ratesByType}
        specs={data.upload.specs}
      />

      {/* Full video list for the month */}
      <CardSection>
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs uppercase tracking-[0.15em] text-foreground/70">
            Tous les uploads — {monthToLabel(data.month)}
          </p>
          {data.upload.recentVideos.length > 0 && (
            <span className="rounded-full bg-foreground/8 px-2.5 py-0.5 text-[11px] font-semibold tabular-nums text-foreground/50">
              {data.upload.recentVideos.length}
            </span>
          )}
        </div>

        {data.upload.recentVideos.length === 0 ? (
          <p className="mt-4 text-sm text-foreground/70">
            Aucun upload pour le moment. Dépose ton premier contenu ci-dessus.
          </p>
        ) : (
          <div className="mt-4 space-y-2.5">
            {data.upload.recentVideos.map((video) => (
              <div
                key={video.id}
                className={
                  video.status === "rejected"
                    ? "overflow-hidden rounded-2xl border border-destructive/25 bg-destructive/[0.03]"
                    : video.status === "revision_requested"
                      ? "overflow-hidden rounded-2xl border border-amber-300/60 bg-amber-50/60"
                      : video.status === "approved"
                        ? "overflow-hidden rounded-2xl border border-mint/20 bg-mint/[0.03]"
                        : "overflow-hidden rounded-2xl border border-line bg-white/80"
                }
              >
                {/* Status accent stripe */}
                <div
                  className={
                    video.status === "rejected"
                      ? "h-0.5 w-full bg-destructive/40"
                      : video.status === "revision_requested"
                        ? "h-0.5 w-full bg-amber-400/60"
                        : video.status === "approved"
                          ? "h-0.5 w-full bg-mint/50"
                          : "h-0.5 w-full bg-foreground/8"
                  }
                />

                <div className="p-4">
                  {/* Header row */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* Status dot */}
                      <div
                        className={
                          "mt-px h-2 w-2 shrink-0 rounded-full " +
                          (video.status === "approved"
                            ? "bg-mint"
                            : video.status === "rejected"
                              ? "bg-destructive"
                              : video.status === "revision_requested"
                                ? "bg-amber-500"
                                : "bg-foreground/25")
                        }
                      />
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-[14px] leading-tight text-foreground">
                          {VIDEO_TYPE_LABELS[video.videoType]}
                        </p>
                        <p className="mt-0.5 text-[11px] text-foreground/45">
                          {toShortDate(video.createdAt)}
                        </p>
                      </div>
                    </div>
                    <StatusBadge
                      label={VIDEO_STATUS_LABELS[video.status as VideoStatus] ?? video.status}
                      tone={videoStatusTone(video.status)}
                    />
                  </div>

                  {/* Status-specific content */}
                  {video.status === "approved" ? (
                    <p className="mt-3 text-[12px] text-mint/90 font-medium">
                      ✓ Validée et comptabilisée dans tes gains
                    </p>
                  ) : null}

                  {video.status === "pending_review" ? (
                    <p className="mt-3 text-[12px] text-foreground/50">
                      En attente de validation — généralement sous 48h.
                    </p>
                  ) : null}

                  {video.status === "revision_requested" && video.rejectionReason ? (
                    <div className="mt-3 rounded-xl border border-amber-200/80 bg-white/50 px-3 py-2.5">
                      <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-amber-700/70">
                        Modifications demandées
                      </p>
                      <p className="mt-1 text-[13px] leading-relaxed text-amber-800">
                        {video.rejectionReason}
                      </p>
                    </div>
                  ) : null}

                  {video.status === "revision_requested" && !video.rejectionReason ? (
                    <p className="mt-3 text-[12px] text-amber-700">
                      Des modifications sont demandées — re-uploade une version corrigée.
                    </p>
                  ) : null}

                  {video.status === "revision_requested" && video.supersededBy ? (
                    <p className="mt-3 text-[12px] text-foreground/50">
                      ✓ Correction envoyée — en attente de validation.
                    </p>
                  ) : null}

                  {video.status === "revision_requested" && !video.supersededBy ? (
                    <Link
                      href={`/uploads/${video.id}/revision`}
                      className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-[11px] font-bold uppercase tracking-wide text-white transition hover:bg-amber-600 active:scale-95"
                    >
                      Corriger et re-uploader →
                    </Link>
                  ) : null}

                  {video.status === "rejected" && video.rejectionReason ? (
                    <div className="mt-3 rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-2.5">
                      <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-destructive/60">
                        Raison du rejet
                      </p>
                      <p className="mt-1 text-[13px] leading-relaxed text-destructive">
                        {video.rejectionReason}
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardSection>
    </div>
  );
}
