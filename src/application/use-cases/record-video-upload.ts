import { getRepository } from "@/application/dependencies";
import { resolveUploadTrackingForUser } from "@/application/use-cases/resolve-upload-tracking";
import { VIDEO_TYPES, type VideoAsset, type VideoType } from "@/domain/types";

export async function recordVideoUpload(input: {
  userId: string;
  monthlyTrackingId: string;
  videoType: VideoAsset["videoType"];
  fileUrl: string;
  durationSeconds: number;
  resolution: VideoAsset["resolution"];
  fileSizeMb: number;
}): Promise<VideoAsset> {
  // Input validation (H-05)
  if (!VIDEO_TYPES.includes(input.videoType as VideoType)) {
    throw new Error(`Invalid videoType: ${input.videoType}`);
  }
  if (!input.fileUrl || typeof input.fileUrl !== "string") {
    throw new Error("fileUrl is required");
  }
  if (typeof input.durationSeconds !== "number" || input.durationSeconds <= 0 || input.durationSeconds > 600) {
    throw new Error("durationSeconds must be between 1 and 600");
  }
  if (input.resolution !== "1080x1920" && input.resolution !== "1080x1080") {
    throw new Error(`Invalid resolution: ${input.resolution}`);
  }
  if (typeof input.fileSizeMb !== "number" || input.fileSizeMb <= 0 || input.fileSizeMb > 2048) {
    throw new Error("fileSizeMb must be between 1 and 2048");
  }

  const repository = getRepository();
  const context = await resolveUploadTrackingForUser({
    userId: input.userId,
    monthlyTrackingId: input.monthlyTrackingId
  });

  return repository.createVideoAsset({
    monthlyTrackingId: context.monthlyTrackingId,
    creatorId: context.creatorId,
    videoType: input.videoType,
    fileUrl: input.fileUrl,
    durationSeconds: input.durationSeconds,
    resolution: input.resolution,
    fileSizeMb: input.fileSizeMb,
    status: "pending_review"
  });
}
