import { describe, expect, it } from "vitest";

import { calculatePayout } from "@/domain/services/calculate-payout";
import type { VideoRate, VideoTypeCount } from "@/domain/types";

describe("calculatePayout", () => {
  it("adds monthly credits to delivered subtotals", () => {
    const delivered: VideoTypeCount = {
      OOTD: 2,
      TRAINING: 1,
      BEFORE_AFTER: 0,
      SPORTS_80S: 0,
      CINEMATIC: 1
    };

    const rates: VideoRate[] = [
      { videoType: "OOTD", ratePerVideo: 100, isPlaceholder: false },
      { videoType: "TRAINING", ratePerVideo: 120, isPlaceholder: false },
      { videoType: "BEFORE_AFTER", ratePerVideo: 150, isPlaceholder: false },
      { videoType: "SPORTS_80S", ratePerVideo: 90, isPlaceholder: false },
      { videoType: "CINEMATIC", ratePerVideo: 180, isPlaceholder: false }
    ];

    const result = calculatePayout(delivered, rates, 25);
    expect(result.monthlyCredits).toBe(25);
    expect(result.total).toBe(2 * 100 + 1 * 120 + 1 * 180 + 25);
    expect(result.items).toHaveLength(5);
  });
});

