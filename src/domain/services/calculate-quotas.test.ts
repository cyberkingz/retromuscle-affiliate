import { describe, expect, it } from "vitest";

import { calculateQuotas } from "@/domain/services/calculate-quotas";
import type { MixDefinition } from "@/domain/types";

describe("calculateQuotas", () => {
  it("allocates integers that sum to quotaTotal", () => {
    const mix: MixDefinition = {
      name: "EQUILIBRE",
      positioning: "Test mix",
      distribution: {
        OOTD: 0.4,
        TRAINING: 0.35,
        BEFORE_AFTER: 0.2,
        SPORTS_80S: 0,
        CINEMATIC: 0.05
      }
    };

    const quotas = calculateQuotas(10, mix);

    const total =
      quotas.OOTD + quotas.TRAINING + quotas.BEFORE_AFTER + quotas.SPORTS_80S + quotas.CINEMATIC;

    expect(total).toBe(10);
    expect(Object.values(quotas).every((value) => Number.isInteger(value) && value >= 0)).toBe(true);
  });

  it("throws when mix distribution does not sum to 1", () => {
    const mix: MixDefinition = {
      name: "VOLUME",
      positioning: "Bad mix",
      distribution: {
        OOTD: 0.5,
        TRAINING: 0.5,
        BEFORE_AFTER: 0.2,
        SPORTS_80S: 0,
        CINEMATIC: 0
      }
    };

    expect(() => calculateQuotas(10, mix)).toThrow(/Invalid mix distribution/i);
  });
});

