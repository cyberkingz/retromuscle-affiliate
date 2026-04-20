import { getRepository } from "@/application/dependencies";
import type { VideoAsset } from "@/domain/types";

export interface RecordRevisionUploadResult {
  newVideo: VideoAsset;
  /** The original video that was superseded. null if the non-fatal update failed. */
  supersededVideo: VideoAsset | null;
}

/**
 * Record a creator's revision re-upload for a video that was requested to be revised.
 *
 * Business rules:
 * 1. Creator must exist, be active, and have signed the contract.
 * 2. Original video must exist and be owned by the creator.
 * 3. Original video must have status "revision_requested".
 * 4. Original video must not already be superseded (idempotency guard).
 * 5. New video is created in "pending_review" status linked to the same tracking period.
 * 6. Original video's superseded_by is set to the new video's id (non-fatal).
 */
export async function recordRevisionUpload(input: {
  userId: string;
  originalVideoId: string;
  fileUrl: string;
  durationSeconds: number;
  resolution: VideoAsset["resolution"];
  fileSizeMb: number;
}): Promise<RecordRevisionUploadResult> {
  const repository = getRepository();

  // Input validation
  if (!input.fileUrl || typeof input.fileUrl !== "string") {
    throw new Error("fileUrl is required");
  }
  if (
    typeof input.durationSeconds !== "number" ||
    input.durationSeconds <= 0 ||
    input.durationSeconds > 600
  ) {
    throw new Error("durationSeconds must be between 1 and 600");
  }
  if (input.resolution !== "1080x1920" && input.resolution !== "1080x1080") {
    throw new Error(`Invalid resolution: ${input.resolution}`);
  }
  if (
    typeof input.fileSizeMb !== "number" ||
    input.fileSizeMb <= 0 ||
    input.fileSizeMb > 2048
  ) {
    throw new Error("fileSizeMb must be between 1 and 2048");
  }

  const creator = await repository.getCreatorByUserId(input.userId);
  if (!creator) {
    throw new Error("Creator not found");
  }

  if (!creator.contractSignedAt) {
    throw new Error("Contract not signed");
  }

  if (creator.status !== "actif") {
    throw new Error("Creator account is not active");
  }

  const originalVideo = await repository.getVideoById(input.originalVideoId);
  if (!originalVideo) {
    throw new Error("Video not found");
  }

  if (originalVideo.creatorId !== creator.id) {
    throw new Error("Access denied");
  }

  if (originalVideo.status !== "revision_requested") {
    throw new Error(
      `Cannot submit revision: video is not awaiting revision (status: ${originalVideo.status})`
    );
  }

  // Application-layer idempotency guard. Note: this check is inherently
  // subject to a TOCTOU race if two requests arrive concurrently — a
  // database-level unique constraint on superseded_by is the durable fix.
  if (originalVideo.supersededBy) {
    throw new Error("A revision has already been submitted for this video");
  }

  const rates = await repository.listRates();
  const rate = rates.find((r) => r.videoType === originalVideo.videoType);
  if (!rate || rate.isPlaceholder) {
    throw new Error(`Video type is disabled: ${originalVideo.videoType}`);
  }

  // Create the new revision video
  const newVideo = await repository.createVideoAsset({
    monthlyTrackingId: originalVideo.monthlyTrackingId,
    creatorId: creator.id,
    videoType: originalVideo.videoType,
    fileUrl: input.fileUrl,
    durationSeconds: input.durationSeconds,
    resolution: input.resolution,
    fileSizeMb: input.fileSizeMb,
    status: "pending_review"
  });

  // Non-fatally mark the original video as superseded.
  // If this fails the upload still succeeds; the admin will see both videos
  // and the superseded_by link can be repaired manually.
  let supersededVideo: VideoAsset | null = null;
  try {
    supersededVideo = await repository.markVideoSuperseded({
      videoId: originalVideo.id,
      supersededById: newVideo.id
    });
  } catch {
    // Intentionally swallowed — the revision video is already created.
    // Caller should log this condition if needed.
  }

  return { newVideo, supersededVideo };
}
