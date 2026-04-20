import { cn } from "@/lib/cn";
import { VIDEO_STATUS_LABELS } from "@/domain/constants/labels";
import { toShortDate } from "@/lib/date";
import type { VideoAsset, VideoStatus } from "@/domain/types";

interface VideoHistoryTimelineProps {
  videos: VideoAsset[];
  currentVideoId: string;
}

const STATUS_TONE: Record<string, string> = {
  approved: "bg-mint/20 text-mint",
  rejected: "bg-destructive/15 text-destructive",
  revision_requested: "bg-amber-100 text-amber-700",
  pending_review: "bg-foreground/8 text-foreground/55",
  uploaded: "bg-foreground/8 text-foreground/55"
};

export function VideoHistoryTimeline({ videos, currentVideoId }: VideoHistoryTimelineProps) {
  if (videos.length <= 1) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-foreground/55">
        Historique des versions
      </p>

      <div className="relative pl-5">
        {/* Vertical line */}
        <div
          className="absolute left-[9px] top-2 bottom-2 w-px bg-foreground/10"
          aria-hidden
        />

        <ol className="space-y-3">
          {videos.map((video, idx) => {
            const isCurrent = video.id === currentVideoId;
            const statusLabel =
              VIDEO_STATUS_LABELS[video.status as VideoStatus] ?? video.status;
            const toneCls = STATUS_TONE[video.status] ?? STATUS_TONE.uploaded;

            return (
              <li key={video.id} className="relative flex items-start gap-3">
                {/* Dot */}
                <span
                  className={cn(
                    "absolute left-[-18px] top-[5px] h-3 w-3 rounded-full border-2 shrink-0",
                    isCurrent
                      ? "border-primary bg-primary"
                      : "border-foreground/25 bg-background"
                  )}
                  aria-hidden
                />

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-foreground/55">
                      Version {idx + 1}
                    </span>
                    {isCurrent && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                        En cours
                      </span>
                    )}
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                        toneCls
                      )}
                    >
                      {statusLabel}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-foreground/45">
                    {toShortDate(video.createdAt)}
                  </p>
                  {video.rejectionReason && !isCurrent && (
                    <p className="mt-1 text-xs text-foreground/55 line-clamp-2">
                      {video.rejectionReason}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
