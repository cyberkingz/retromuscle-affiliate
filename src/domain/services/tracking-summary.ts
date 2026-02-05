import { VIDEO_TYPES, type VideoTypeCount } from "@/domain/types";

export interface TrackingSummary {
  deliveredTotal: number;
  remainingTotal: number;
  status: "OK" | "EN_ATTENTE";
  remainingDetails: string;
}

export function summarizeTracking(quotas: VideoTypeCount, delivered: VideoTypeCount): TrackingSummary {
  const deliveredTotal = VIDEO_TYPES.reduce((sum, type) => sum + delivered[type], 0);
  const quotaTotal = VIDEO_TYPES.reduce((sum, type) => sum + quotas[type], 0);
  const remainingTotal = Math.max(quotaTotal - deliveredTotal, 0);

  const remainingByType = VIDEO_TYPES.map((videoType) => {
    const remaining = Math.max(quotas[videoType] - delivered[videoType], 0);
    return { videoType, remaining };
  }).filter((entry) => entry.remaining > 0);

  const remainingDetails =
    remainingByType.length === 0
      ? "Objectif complet"
      : remainingByType.map((entry) => `${entry.remaining} ${entry.videoType}`).join(" | ");

  return {
    deliveredTotal,
    remainingTotal,
    status: remainingTotal === 0 ? "OK" : "EN_ATTENTE",
    remainingDetails
  };
}
