import type { VideoRate, VideoType, VideoTypeCount } from "@/domain/types";

export interface PayoutBreakdownItem {
  key: VideoType;
  delivered: number;
  rate: number;
  subtotal: number;
}

export interface PayoutResult {
  items: PayoutBreakdownItem[];
  total: number;
}

export function calculatePayout(
  deliveredByType: VideoTypeCount,
  rates: VideoRate[]
): PayoutResult {
  const items: PayoutBreakdownItem[] = rates.map((rate) => {
    const delivered = Math.max(0, deliveredByType[rate.videoType] ?? 0);
    return {
      key: rate.videoType,
      delivered,
      rate: rate.ratePerVideo,
      subtotal: delivered * rate.ratePerVideo
    };
  });

  const total = items.reduce((sum, item) => sum + item.subtotal, 0);

  return {
    items,
    total
  };
}
