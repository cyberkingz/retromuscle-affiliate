import type { VideoRate, VideoTypeCount } from "@/domain/types";

export interface PayoutBreakdownItem {
  key: string;
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
  const items = rates.map((rate) => {
    const delivered = deliveredByType[rate.videoType] ?? 0;
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
