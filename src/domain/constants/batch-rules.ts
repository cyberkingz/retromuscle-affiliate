import type { VideoType } from "@/domain/types";

export const BATCH_MIN_CLIPS: Partial<Record<VideoType, number>> = {
  OOTD: 4,
  TRAINING: 4,
  BEFORE_AFTER: 2,
  SPORTS_80S: 4,
  CINEMATIC: 4,
};

export const BATCH_MAX_CLIPS = 20;

export const BATCH_SUPPORTED_TYPES: VideoType[] = Object.keys(
  BATCH_MIN_CLIPS
) as VideoType[];
