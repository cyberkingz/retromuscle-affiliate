import { getRepository } from "@/application/dependencies";
import { VIDEO_TYPES, type VideoAsset, type VideoTypeCount } from "@/domain/types";

function computeDeliveredFromApproved(videos: VideoAsset[]): VideoTypeCount {
  const delivered = VIDEO_TYPES.reduce((acc, type) => {
    acc[type] = 0;
    return acc;
  }, {} as VideoTypeCount);

  for (const video of videos) {
    if (video.status !== "approved") {
      continue;
    }
    delivered[video.videoType] += 1;
  }

  return delivered;
}

export async function reviewVideoUpload(input: {
  adminUserId: string;
  videoId: string;
  decision: "approved" | "rejected";
  rejectionReason?: string | null;
}) {
  const repository = getRepository();

  const updatedVideo = await repository.reviewVideoAsset({
    videoId: input.videoId,
    status: input.decision,
    rejectionReason: input.decision === "rejected" ? input.rejectionReason ?? null : null,
    reviewedBy: input.adminUserId
  });

  const allVideos = await repository.listVideosByTracking(updatedVideo.monthlyTrackingId);
  const delivered = computeDeliveredFromApproved(allVideos);
  const tracking = await repository.updateTrackingDelivered({
    monthlyTrackingId: updatedVideo.monthlyTrackingId,
    delivered
  });

  return {
    video: updatedVideo,
    tracking
  };
}

