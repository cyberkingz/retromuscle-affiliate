import { getRepository } from "@/application/dependencies";
import { VIDEO_TYPES, type VideoTypeCount } from "@/domain/types";

function createZeroDelivered(): VideoTypeCount {
  return VIDEO_TYPES.reduce((acc, type) => {
    acc[type] = 0;
    return acc;
  }, {} as VideoTypeCount);
}

function isMissingAtomicReviewRpc(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return (
    message.includes("review_video_and_update_tracking") &&
    (message.includes("could not find") || message.includes("does not exist"))
  );
}

export async function reviewVideoUpload(input: {
  adminUserId: string;
  videoId: string;
  decision: "approved" | "rejected";
  rejectionReason?: string | null;
}) {
  const repository = getRepository();

  try {
    // Prefer atomic RPC when available.
    return await repository.reviewVideoAndUpdateTracking({
      videoId: input.videoId,
      status: input.decision,
      rejectionReason: input.decision === "rejected" ? input.rejectionReason ?? null : null,
      reviewedBy: input.adminUserId
    });
  } catch (error) {
    if (!isMissingAtomicReviewRpc(error)) {
      throw error;
    }

    // Fallback path for environments where the atomic RPC is missing.
    // Keep behavior correct by recomputing delivered counts from reviewed videos.
    const video = await repository.reviewVideoAsset({
      videoId: input.videoId,
      status: input.decision,
      rejectionReason: input.decision === "rejected" ? input.rejectionReason ?? null : null,
      reviewedBy: input.adminUserId
    });

    const videos = await repository.listVideosByTracking(video.monthlyTrackingId);
    const delivered = createZeroDelivered();

    for (const item of videos) {
      if (item.status === "approved") {
        delivered[item.videoType] += 1;
      }
    }

    const tracking = await repository.updateTrackingDelivered({
      monthlyTrackingId: video.monthlyTrackingId,
      delivered
    });

    return { video, tracking };
  }
}
