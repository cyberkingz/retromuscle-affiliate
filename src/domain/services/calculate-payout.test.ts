import { describe, expect, it } from "vitest";

import { calculatePayout } from "@/domain/services/calculate-payout";
import type { VideoRate, VideoTypeCount } from "@/domain/types";

const ALL_RATES: VideoRate[] = [
  { videoType: "OOTD", ratePerVideo: 100, isPlaceholder: false },
  { videoType: "TRAINING", ratePerVideo: 120, isPlaceholder: false },
  { videoType: "BEFORE_AFTER", ratePerVideo: 150, isPlaceholder: false },
  { videoType: "SPORTS_80S", ratePerVideo: 90, isPlaceholder: false },
  { videoType: "CINEMATIC", ratePerVideo: 180, isPlaceholder: false }
];

const ZERO_DELIVERED: VideoTypeCount = {
  OOTD: 0,
  TRAINING: 0,
  BEFORE_AFTER: 0,
  SPORTS_80S: 0,
  CINEMATIC: 0
};

describe("calculatePayout", () => {
  it("adds monthly credits to delivered subtotals", () => {
    const delivered: VideoTypeCount = {
      OOTD: 2,
      TRAINING: 1,
      BEFORE_AFTER: 0,
      SPORTS_80S: 0,
      CINEMATIC: 1
    };

    const result = calculatePayout(delivered, ALL_RATES, 25);
    expect(result.monthlyCredits).toBe(25);
    expect(result.total).toBe(2 * 100 + 1 * 120 + 1 * 180 + 25);
    expect(result.items).toHaveLength(5);
  });

  it("returns only monthly credits when zero videos are delivered", () => {
    const result = calculatePayout(ZERO_DELIVERED, ALL_RATES, 50);
    expect(result.total).toBe(50);
    expect(result.monthlyCredits).toBe(50);
    expect(result.items.every((item) => item.subtotal === 0)).toBe(true);
  });

  it("returns zero total when no credits and no videos", () => {
    const result = calculatePayout(ZERO_DELIVERED, ALL_RATES, 0);
    expect(result.total).toBe(0);
    expect(result.monthlyCredits).toBe(0);
  });

  it("computes correctly when only OOTD videos are delivered", () => {
    const delivered: VideoTypeCount = { ...ZERO_DELIVERED, OOTD: 5 };
    const result = calculatePayout(delivered, ALL_RATES, 0);
    expect(result.total).toBe(5 * 100);
    const ootdItem = result.items.find((item) => item.key === "OOTD");
    expect(ootdItem?.delivered).toBe(5);
    expect(ootdItem?.subtotal).toBe(500);
  });

  it("computes correctly when only TRAINING videos are delivered", () => {
    const delivered: VideoTypeCount = { ...ZERO_DELIVERED, TRAINING: 3 };
    const result = calculatePayout(delivered, ALL_RATES, 0);
    expect(result.total).toBe(3 * 120);
  });

  it("computes correctly when only BEFORE_AFTER videos are delivered", () => {
    const delivered: VideoTypeCount = { ...ZERO_DELIVERED, BEFORE_AFTER: 2 };
    const result = calculatePayout(delivered, ALL_RATES, 0);
    expect(result.total).toBe(2 * 150);
  });

  it("computes correctly when only SPORTS_80S videos are delivered", () => {
    const delivered: VideoTypeCount = { ...ZERO_DELIVERED, SPORTS_80S: 4 };
    const result = calculatePayout(delivered, ALL_RATES, 0);
    expect(result.total).toBe(4 * 90);
  });

  it("computes correctly when only CINEMATIC videos are delivered", () => {
    const delivered: VideoTypeCount = { ...ZERO_DELIVERED, CINEMATIC: 1 };
    const result = calculatePayout(delivered, ALL_RATES, 0);
    expect(result.total).toBe(1 * 180);
  });

  it("computes correctly when all video types are at maximum (e.g. 10 each)", () => {
    const delivered: VideoTypeCount = {
      OOTD: 10,
      TRAINING: 10,
      BEFORE_AFTER: 10,
      SPORTS_80S: 10,
      CINEMATIC: 10
    };
    const result = calculatePayout(delivered, ALL_RATES, 100);
    const expectedSubtotal = 10 * 100 + 10 * 120 + 10 * 150 + 10 * 90 + 10 * 180;
    expect(result.total).toBe(expectedSubtotal + 100);
  });

  it("each item in the breakdown has correct key, delivered, rate, and subtotal", () => {
    const delivered: VideoTypeCount = {
      OOTD: 1,
      TRAINING: 2,
      BEFORE_AFTER: 3,
      SPORTS_80S: 4,
      CINEMATIC: 5
    };
    const result = calculatePayout(delivered, ALL_RATES, 0);

    for (const item of result.items) {
      const rate = ALL_RATES.find((r) => r.videoType === item.key);
      expect(rate).toBeDefined();
      expect(item.rate).toBe(rate!.ratePerVideo);
      expect(item.subtotal).toBe(item.delivered * item.rate);
    }
  });

  it("handles an empty rates array gracefully", () => {
    const delivered: VideoTypeCount = { ...ZERO_DELIVERED, OOTD: 5 };
    const result = calculatePayout(delivered, [], 10);
    expect(result.items).toHaveLength(0);
    expect(result.total).toBe(10);
  });
});
