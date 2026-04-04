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
  it("sums delivered subtotals correctly", () => {
    const delivered: VideoTypeCount = {
      OOTD: 2,
      TRAINING: 1,
      BEFORE_AFTER: 0,
      SPORTS_80S: 0,
      CINEMATIC: 1
    };

    const result = calculatePayout(delivered, ALL_RATES);
    expect(result.total).toBe(2 * 100 + 1 * 120 + 1 * 180);
    expect(result.items).toHaveLength(5);
  });

  it("returns zero total when no videos are delivered", () => {
    const result = calculatePayout(ZERO_DELIVERED, ALL_RATES);
    expect(result.total).toBe(0);
    expect(result.items.every((item) => item.subtotal === 0)).toBe(true);
  });

  it("computes correctly when only OOTD videos are delivered", () => {
    const delivered: VideoTypeCount = { ...ZERO_DELIVERED, OOTD: 5 };
    const result = calculatePayout(delivered, ALL_RATES);
    expect(result.total).toBe(5 * 100);
    const ootdItem = result.items.find((item) => item.key === "OOTD");
    expect(ootdItem?.delivered).toBe(5);
    expect(ootdItem?.subtotal).toBe(500);
  });

  it("computes correctly when all video types are delivered", () => {
    const delivered: VideoTypeCount = {
      OOTD: 10,
      TRAINING: 10,
      BEFORE_AFTER: 10,
      SPORTS_80S: 10,
      CINEMATIC: 10
    };
    const result = calculatePayout(delivered, ALL_RATES);
    const expected = 10 * 100 + 10 * 120 + 10 * 150 + 10 * 90 + 10 * 180;
    expect(result.total).toBe(expected);
  });

  it("each item in the breakdown has correct key, delivered, rate, and subtotal", () => {
    const delivered: VideoTypeCount = {
      OOTD: 1,
      TRAINING: 2,
      BEFORE_AFTER: 3,
      SPORTS_80S: 4,
      CINEMATIC: 5
    };
    const result = calculatePayout(delivered, ALL_RATES);

    for (const item of result.items) {
      const rate = ALL_RATES.find((r) => r.videoType === item.key);
      expect(rate).toBeDefined();
      expect(item.rate).toBe(rate!.ratePerVideo);
      expect(item.subtotal).toBe(item.delivered * item.rate);
    }
  });

  it("handles an empty rates array gracefully", () => {
    const delivered: VideoTypeCount = { ...ZERO_DELIVERED, OOTD: 5 };
    const result = calculatePayout(delivered, []);
    expect(result.items).toHaveLength(0);
    expect(result.total).toBe(0);
  });

  it("clamps negative delivered counts to zero", () => {
    const delivered: VideoTypeCount = {
      OOTD: -5,
      TRAINING: 0,
      BEFORE_AFTER: 0,
      SPORTS_80S: 0,
      CINEMATIC: 0
    };
    const result = calculatePayout(delivered, ALL_RATES);
    const ootdItem = result.items.find((item) => item.key === "OOTD");
    expect(ootdItem?.delivered).toBe(0);
    expect(ootdItem?.subtotal).toBe(0);
    expect(result.total).toBe(0);
  });

  it("handles a subset of rates (not all video types)", () => {
    const partialRates: VideoRate[] = [
      { videoType: "OOTD", ratePerVideo: 100, isPlaceholder: false },
      { videoType: "CINEMATIC", ratePerVideo: 180, isPlaceholder: false }
    ];
    const delivered: VideoTypeCount = {
      OOTD: 3,
      TRAINING: 5,
      BEFORE_AFTER: 2,
      SPORTS_80S: 1,
      CINEMATIC: 1
    };
    const result = calculatePayout(delivered, partialRates);
    expect(result.items).toHaveLength(2);
    expect(result.total).toBe(3 * 100 + 1 * 180);
  });

  it("handles very large delivery numbers without overflow", () => {
    const delivered: VideoTypeCount = {
      OOTD: 1_000_000,
      TRAINING: 0,
      BEFORE_AFTER: 0,
      SPORTS_80S: 0,
      CINEMATIC: 0
    };
    const result = calculatePayout(delivered, ALL_RATES);
    expect(result.total).toBe(1_000_000 * 100);
  });
});
