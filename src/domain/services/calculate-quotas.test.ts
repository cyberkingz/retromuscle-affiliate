import { describe, expect, it } from "vitest";

import { calculateQuotas } from "@/domain/services/calculate-quotas";
import { VIDEO_TYPES, type MixDefinition } from "@/domain/types";

function makeValidMix(distribution: Record<string, number>): MixDefinition {
  return {
    name: "EQUILIBRE",
    positioning: "Test mix",
    distribution: distribution as MixDefinition["distribution"]
  };
}

function totalOf(quotas: Record<string, number>): number {
  return VIDEO_TYPES.reduce((sum, type) => sum + quotas[type], 0);
}

describe("calculateQuotas", () => {
  it("allocates integers that sum to quotaTotal", () => {
    const mix = makeValidMix({
      OOTD: 0.4,
      TRAINING: 0.35,
      BEFORE_AFTER: 0.2,
      SPORTS_80S: 0,
      CINEMATIC: 0.05
    });

    const quotas = calculateQuotas(10, mix);
    expect(totalOf(quotas)).toBe(10);
    expect(Object.values(quotas).every((value) => Number.isInteger(value) && value >= 0)).toBe(true);
  });

  it("throws when mix distribution does not sum to 1", () => {
    const mix = makeValidMix({
      OOTD: 0.5,
      TRAINING: 0.5,
      BEFORE_AFTER: 0.2,
      SPORTS_80S: 0,
      CINEMATIC: 0
    });

    expect(() => calculateQuotas(10, mix)).toThrow(/Invalid mix distribution/i);
  });

  it("handles quotaTotal of 0", () => {
    const mix = makeValidMix({
      OOTD: 0.4,
      TRAINING: 0.3,
      BEFORE_AFTER: 0.2,
      SPORTS_80S: 0.05,
      CINEMATIC: 0.05
    });

    const quotas = calculateQuotas(0, mix);
    expect(totalOf(quotas)).toBe(0);
    expect(Object.values(quotas).every((v) => v === 0)).toBe(true);
  });

  it("handles quotaTotal of 1 (assigns to highest-weighted type)", () => {
    const mix = makeValidMix({
      OOTD: 0.5,
      TRAINING: 0.3,
      BEFORE_AFTER: 0.1,
      SPORTS_80S: 0.05,
      CINEMATIC: 0.05
    });

    const quotas = calculateQuotas(1, mix);
    expect(totalOf(quotas)).toBe(1);
    // The single video should go to the type with the highest fractional remainder
    // 0.5 -> floor(0.5)=0, frac=0.5 (OOTD)
    // 0.3 -> floor(0.3)=0, frac=0.3 (TRAINING)
    // So OOTD gets the single allocation
    expect(quotas.OOTD).toBe(1);
  });

  it("distributes a large quotaTotal correctly (40 videos)", () => {
    const mix = makeValidMix({
      OOTD: 0.4,
      TRAINING: 0.35,
      BEFORE_AFTER: 0.2,
      SPORTS_80S: 0,
      CINEMATIC: 0.05
    });

    const quotas = calculateQuotas(40, mix);
    expect(totalOf(quotas)).toBe(40);
    // With exact division: OOTD=16, TRAINING=14, BEFORE_AFTER=8, SPORTS_80S=0, CINEMATIC=2
    expect(quotas.OOTD).toBe(16);
    expect(quotas.TRAINING).toBe(14);
    expect(quotas.BEFORE_AFTER).toBe(8);
    expect(quotas.SPORTS_80S).toBe(0);
    expect(quotas.CINEMATIC).toBe(2);
  });

  it("handles a mix where all weight is on one type", () => {
    const mix = makeValidMix({
      OOTD: 1.0,
      TRAINING: 0,
      BEFORE_AFTER: 0,
      SPORTS_80S: 0,
      CINEMATIC: 0
    });

    const quotas = calculateQuotas(15, mix);
    expect(totalOf(quotas)).toBe(15);
    expect(quotas.OOTD).toBe(15);
    expect(quotas.TRAINING).toBe(0);
  });

  it("handles equal distribution across all types", () => {
    const mix = makeValidMix({
      OOTD: 0.2,
      TRAINING: 0.2,
      BEFORE_AFTER: 0.2,
      SPORTS_80S: 0.2,
      CINEMATIC: 0.2
    });

    const quotas = calculateQuotas(10, mix);
    expect(totalOf(quotas)).toBe(10);
    // Exactly 2 each
    expect(quotas.OOTD).toBe(2);
    expect(quotas.TRAINING).toBe(2);
    expect(quotas.BEFORE_AFTER).toBe(2);
    expect(quotas.SPORTS_80S).toBe(2);
    expect(quotas.CINEMATIC).toBe(2);
  });

  it("handles equal distribution with non-divisible total (remainder allocation)", () => {
    const mix = makeValidMix({
      OOTD: 0.2,
      TRAINING: 0.2,
      BEFORE_AFTER: 0.2,
      SPORTS_80S: 0.2,
      CINEMATIC: 0.2
    });

    const quotas = calculateQuotas(7, mix);
    expect(totalOf(quotas)).toBe(7);
    // 7 / 5 = 1.4 each, floor=1 each (total 5), remainder=2
    // All have same fraction (0.4), so first 2 in sorted order get +1
    expect(Object.values(quotas).every((v) => v >= 1)).toBe(true);
  });

  it("all allocated values are non-negative integers", () => {
    const mix = makeValidMix({
      OOTD: 0.33,
      TRAINING: 0.33,
      BEFORE_AFTER: 0.17,
      SPORTS_80S: 0.10,
      CINEMATIC: 0.07
    });

    const quotas = calculateQuotas(13, mix);
    expect(totalOf(quotas)).toBe(13);
    for (const type of VIDEO_TYPES) {
      expect(Number.isInteger(quotas[type])).toBe(true);
      expect(quotas[type]).toBeGreaterThanOrEqual(0);
    }
  });

  it("rejects distribution that sums to less than 1", () => {
    const mix = makeValidMix({
      OOTD: 0.3,
      TRAINING: 0.3,
      BEFORE_AFTER: 0.1,
      SPORTS_80S: 0.1,
      CINEMATIC: 0.1
    });

    expect(() => calculateQuotas(10, mix)).toThrow(/Invalid mix distribution/i);
  });
});
