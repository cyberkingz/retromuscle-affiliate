import { getRepository } from "@/application/dependencies";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server-client";
import { BATCH_MIN_CLIPS, BATCH_SUPPORTED_TYPES } from "@/domain/constants/batch-rules";
import { VIDEO_TYPES, type BatchSubmission, type VideoType } from "@/domain/types";
import { resolveUploadTrackingForUser } from "./resolve-upload-tracking";

export async function recordBatchSubmission(input: {
  userId: string;
  monthlyTrackingId: string;
  videoType: VideoType;
  clipKeys: string[];
  clipSizesMb: number[];
}): Promise<BatchSubmission> {
  if (!VIDEO_TYPES.includes(input.videoType)) {
    throw new Error(`Invalid videoType: ${input.videoType}`);
  }

  if (!BATCH_SUPPORTED_TYPES.includes(input.videoType)) {
    throw new Error(`Batch upload not supported for type: ${input.videoType}`);
  }

  const minClips = BATCH_MIN_CLIPS[input.videoType];
  if (!minClips) {
    throw new Error(`Batch upload not supported for type: ${input.videoType}`);
  }

  if (input.clipKeys.length < minClips) {
    throw new Error(`Minimum ${minClips} clips required for ${input.videoType}`);
  }

  if (input.clipKeys.length !== input.clipSizesMb.length) {
    throw new Error("clipKeys and clipSizesMb must have the same length");
  }

  for (const key of input.clipKeys) {
    if (!key.startsWith(`${input.userId}/`)) {
      throw new Error("Invalid clip key: ownership mismatch");
    }
  }

  const context = await resolveUploadTrackingForUser({
    userId: input.userId,
    monthlyTrackingId: input.monthlyTrackingId,
  });

  // Verify every clip exists in storage before creating any DB rows.
  // Same probe pattern as the single-video upload route.
  const supabase = createSupabaseServerClient();
  for (const key of input.clipKeys) {
    const { error } = await supabase.storage.from("videos").createSignedUrl(key, 10);
    if (error) {
      throw new Error(`Clip not found in storage: ${key}`);
    }
  }

  const repository = getRepository();

  const rates = await repository.listRates();
  const rate = rates.find((r) => r.videoType === input.videoType);
  if (!rate || rate.isPlaceholder) {
    throw new Error(`Video type is disabled: ${input.videoType}`);
  }

  const batch = await repository.createBatchSubmission({
    monthlyTrackingId: context.monthlyTrackingId,
    creatorId: context.creatorId,
    videoType: input.videoType,
    minClipsRequired: minClips,
  });

  try {
    for (let i = 0; i < input.clipKeys.length; i++) {
      await repository.addClipToBatch({
        batchSubmissionId: batch.id,
        monthlyTrackingId: context.monthlyTrackingId,
        creatorId: context.creatorId,
        videoType: input.videoType,
        fileUrl: input.clipKeys[i],
        fileSizeMb: Math.max(1, Math.ceil(input.clipSizesMb[i] ?? 1)),
      });
    }
  } catch (clipError) {
    // Compensating rollback: remove the partial batch row so the admin queue
    // never shows an incomplete entry. Storage files are already uploaded and
    // will be cleaned up by the storage lifecycle policy or a periodic job.
    await repository.deleteBatchSubmission(batch.id).catch(() => undefined);
    throw clipError;
  }

  return batch;
}
