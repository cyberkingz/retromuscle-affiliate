import type { VideoRate, VideoType } from "@/domain/types";

const RATES: Record<VideoType, { amount: number; isPlaceholder: boolean }> = {
  OOTD: { amount: 100, isPlaceholder: false },
  TRAINING: { amount: 95, isPlaceholder: false },
  BEFORE_AFTER: { amount: 120, isPlaceholder: false },
  SPORTS_80S: { amount: 140, isPlaceholder: false },
  CINEMATIC: { amount: 180, isPlaceholder: false }
};

export const VIDEO_RATES: VideoRate[] = Object.entries(RATES).map(
  ([videoType, { amount, isPlaceholder }]) => ({
    videoType: videoType as VideoType,
    ratePerVideo: amount,
    isPlaceholder
  })
);
