import { getRepository } from "@/application/dependencies";
import type { VideoAsset } from "@/domain/types";

export async function recordVideoUpload(input: {
  userId: string;
  monthlyTrackingId: string;
  videoType: VideoAsset["videoType"];
  fileUrl: string;
  durationSeconds: number;
  resolution: VideoAsset["resolution"];
  fileSizeMb: number;
}): Promise<VideoAsset> {
  const repository = getRepository();

  const creator = await repository.getCreatorByUserId(input.userId);
  if (!creator) {
    throw new Error("Creator not found");
  }

  const tracking = await repository.getMonthlyTrackingById(input.monthlyTrackingId);
  if (!tracking) {
    throw new Error("Monthly tracking not found");
  }

  if (tracking.creatorId !== creator.id) {
    throw new Error("Forbidden");
  }

  return repository.createVideoAsset({
    monthlyTrackingId: tracking.id,
    creatorId: creator.id,
    videoType: input.videoType,
    fileUrl: input.fileUrl,
    durationSeconds: input.durationSeconds,
    resolution: input.resolution,
    fileSizeMb: input.fileSizeMb,
    status: "pending_review"
  });
}

