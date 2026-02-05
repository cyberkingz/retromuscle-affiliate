import type { VideoRate, VideoType } from "@/domain/types";

// OOTD is validated in the PRD. Other rates are provisional placeholders until business validation.
const PROVISIONAL_RATES: Record<VideoType, { amount: number; isPlaceholder: boolean }> = {
  OOTD: { amount: 100, isPlaceholder: false },
  TRAINING: { amount: 95, isPlaceholder: true },
  BEFORE_AFTER: { amount: 120, isPlaceholder: true },
  SPORTS_80S: { amount: 140, isPlaceholder: true },
  CINEMATIC: { amount: 180, isPlaceholder: true }
};

export const VIDEO_RATES: VideoRate[] = Object.entries(PROVISIONAL_RATES).map(
  ([videoType, { amount, isPlaceholder }]) => ({
    videoType: videoType as VideoType,
    ratePerVideo: amount,
    isPlaceholder
  })
);
