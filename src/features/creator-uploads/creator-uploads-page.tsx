import type { CreatorDashboardData } from "@/application/use-cases/get-creator-dashboard-data";
import { SectionHeading } from "@/components/ui/section-heading";
import { UploadCard } from "@/features/creator-dashboard/components/upload-card";
import { CardSection } from "@/components/layout/card-section";
import { StatusBadge } from "@/components/ui/status-badge";
import { videoStatusTone } from "@/lib/status-tone";
import { toShortDate } from "@/lib/date";
import { VIDEO_TYPE_LABELS } from "@/domain/constants/labels";

interface CreatorUploadsPageProps {
  data: CreatorDashboardData;
}

export function CreatorUploadsPage({ data }: CreatorUploadsPageProps) {
  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Uploads"
        title="Depose tes contenus"
        subtitle="Upload, suis le statut (validation / rejet), et re-upload si besoin."
      />

      <UploadCard
        monthlyTrackingId={data.upload.monthlyTrackingId}
        specs={data.upload.specs}
        tips={data.upload.tips}
        pendingReviewCount={data.upload.pendingReviewCount}
        rejectedCount={data.upload.rejectedCount}
        recentVideos={data.upload.recentVideos}
      />

      <CardSection>
        <p className="text-xs uppercase tracking-[0.15em] text-foreground/55">Derniers uploads</p>

        {data.upload.recentVideos.length === 0 ? (
          <p className="mt-4 text-sm text-foreground/70">
            Aucun upload pour le moment. Depose ton premier contenu ci-dessus.
          </p>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {data.upload.recentVideos.map((video) => (
              <div key={video.id} className="rounded-2xl border border-line bg-frost/60 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{VIDEO_TYPE_LABELS[video.videoType]}</p>
                    <p className="text-xs text-foreground/60">{toShortDate(video.createdAt)}</p>
                  </div>
                  <StatusBadge label={video.status} tone={videoStatusTone(video.status)} />
                </div>

                {video.status === "rejected" && video.rejectionReason ? (
                  <p className="mt-3 text-sm text-destructive/90">
                    Rejete: {video.rejectionReason}
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
