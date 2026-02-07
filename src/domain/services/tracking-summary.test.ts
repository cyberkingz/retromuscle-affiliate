import { describe, expect, it } from "vitest";

import { summarizeTracking } from "@/domain/services/tracking-summary";
import type { VideoTypeCount } from "@/domain/types";

describe("summarizeTracking", () => {
  it("returns OK when fully delivered", () => {
    const quotas: VideoTypeCount = {
      OOTD: 1,
      TRAINING: 1,
      BEFORE_AFTER: 1,
      SPORTS_80S: 1,
      CINEMATIC: 1
    };
    const delivered: VideoTypeCount = { ...quotas };

    const summary = summarizeTracking(quotas, delivered);
    expect(summary.deliveredTotal).toBe(5);
    expect(summary.remainingTotal).toBe(0);
    expect(summary.status).toBe("OK");
    expect(summary.remainingDetails).toMatch(/Objectif complet/i);
  });

  it("returns EN_ATTENTE with remaining details when incomplete", () => {
    const quotas: VideoTypeCount = {
      OOTD: 2,
      TRAINING: 1,
      BEFORE_AFTER: 0,
      SPORTS_80S: 0,
      CINEMATIC: 1
    };
    const delivered: VideoTypeCount = {
      OOTD: 1,
      TRAINING: 1,
      BEFORE_AFTER: 0,
      SPORTS_80S: 0,
      CINEMATIC: 0
    };

    const summary = summarizeTracking(quotas, delivered);
    expect(summary.deliveredTotal).toBe(2);
    expect(summary.remainingTotal).toBe(2);
    expect(summary.status).toBe("EN_ATTENTE");
    expect(summary.remainingDetails).toContain("1 OOTD");
    expect(summary.remainingDetails).toContain("1 CINEMATIC");
  });
});

