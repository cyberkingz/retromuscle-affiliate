import { VIDEO_TYPES, type VideoTypeCount } from "@/domain/types";

export interface TrackingSummary {
  deliveredTotal: number;
  deliveredDetails: string;
}

export function summarizeTracking(delivered: VideoTypeCount): TrackingSummary {
  const deliveredTotal = VIDEO_TYPES.reduce((sum, type) => sum + delivered[type], 0);

  const deliveredByType = VIDEO_TYPES.map((videoType) => ({
    videoType,
    count: delivered[videoType]
  })).filter((entry) => entry.count > 0);

  const deliveredDetails =
    deliveredByType.length === 0
      ? "Aucune video"
      : deliveredByType.map((entry) => `${entry.count} ${entry.videoType}`).join(" | ");

  return {
    deliveredTotal,
    deliveredDetails
  };
}
