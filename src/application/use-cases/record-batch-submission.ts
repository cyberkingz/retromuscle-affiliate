import { getRepository } from "@/application/dependencies";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server-client";
import { BATCH_MAX_CLIPS, BATCH_MIN_CLIPS } from "@/domain/constants/batch-rules";
import type { BatchSubmission, VideoType } from "@/domain/types";
import { resolveUploadTrackingForUser } from "./resolve-upload-tracking";

export async function recordBatchSubmission(input: {
  userId: string;
  monthlyTrackingId: string;
  videoType: VideoType;
  clipKeys: string[];
  clipSizesMb: number[];
  clipDurations?: number[];
  clipResolutions?: string[];
}): Promise<BatchSubmission> {
  const minClips = BATCH_MIN_CLIPS[input.videoType];
  if (!minClips) {
    throw new Error(`Batch upload not supported for type: ${input.videoType}`);
  }

  if (input.clipKeys.length < minClips) {
    throw new Error(`Minimum ${minClips} clips required for ${input.videoType}`);
  }

  if (input.clipKeys.length > BATCH_MAX_CLIPS) {
    throw new Error(`Maximum ${BATCH_MAX_CLIPS} clips per batch`);
  }

  if (input.clipKeys.length !== input.clipSizesMb.length) {
    throw new Error("clipKeys and clipSizesMb must have the same length");
  }

  if (new Set(input.clipKeys).size !== input.clipKeys.length) {
    throw new Error("Duplicate clip keys are not allowed");
  }

  const expectedPrefix = `${input.userId}/${input.monthlyTrackingId}/${input.videoType}/`;
  for (const key of input.clipKeys) {
    if (!key.startsWith(expectedPrefix)) {
      throw new Error("Invalid clip key: ownership or context mismatch");
    }
  }

  const context = await resolveUploadTrackingForUser({
    userId: input.userId,
    monthlyTrackingId: input.monthlyTrackingId,
  });

  const supabase = createSupabaseServerClient();
  const probes = await Promise.all(
    input.clipKeys.map((key) => supabase.storage.from("videos").createSignedUrl(key, 10))
  );
  const failedIdx = probes.findIndex(({ error }) => Boolean(error));
  if (failedIdx !== -1) {
    throw new Error(`Clip not found in storage: ${input.clipKeys[failedIdx]}`);
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
    await Promise.all(
      input.clipKeys.map((key, i) =>
        repository.addClipToBatch({
          batchSubmissionId: batch.id,
          monthlyTrackingId: context.monthlyTrackingId,
          creatorId: context.creatorId,
          videoType: input.videoType,
          fileUrl: key,
          fileSizeMb: Math.max(1, Math.ceil(input.clipSizesMb[i] ?? 1)),
          durationSeconds: input.clipDurations?.[i] ?? 1,
          resolution: input.clipResolutions?.[i] ?? "1080x1920",
        })
      )
    );
  } catch (clipError) {
    // Compensating rollback: remove the partial batch row so the admin queue
    // never shows an incomplete entry.
    await repository.deleteBatchSubmission(batch.id).catch(() => undefined);
    throw clipError;
  }

  return batch;
}
