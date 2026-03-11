import type { VideoRate, VideoType, VideoTypeCount } from "@/domain/types";

export interface PayoutBreakdownItem {
  key: VideoType;
  delivered: number;
  rate: number;
  subtotal: number;
}

export interface PayoutResult {
  items: PayoutBreakdownItem[];
  monthlyCredits: number;
  total: number;
}

export function calculatePayout(
  deliveredByType: VideoTypeCount,
  rates: VideoRate[],
  monthlyCredits: number
): PayoutResult {
  if (monthlyCredits < 0) {
    throw new Error("monthlyCredits must be non-negative");
  }

  const items: PayoutBreakdownItem[] = rates.map((rate) => {
    const delivered = Math.max(0, deliveredByType[rate.videoType] ?? 0);
    return {
      key: rate.videoType,
      delivered,
      rate: rate.ratePerVideo,
      subtotal: delivered * rate.ratePerVideo
    };
  });

  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);

  return {
    items,
    monthlyCredits,
    total: subtotal + monthlyCredits
  };
}
