import { describe, expect, it } from "vitest";

import { summarizeTracking } from "@/domain/services/tracking-summary";
import type { VideoTypeCount } from "@/domain/types";

const ZERO_COUNTS: VideoTypeCount = {
  OOTD: 0,
  TRAINING: 0,
  BEFORE_AFTER: 0,
  SPORTS_80S: 0,
  CINEMATIC: 0
};

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

  it("returns OK when quotas and delivered are both zero", () => {
    const summary = summarizeTracking(ZERO_COUNTS, ZERO_COUNTS);
    expect(summary.deliveredTotal).toBe(0);
    expect(summary.remainingTotal).toBe(0);
    expect(summary.status).toBe("OK");
    expect(summary.remainingDetails).toMatch(/Objectif complet/i);
  });

  it("returns EN_ATTENTE when nothing is delivered but quotas exist", () => {
    const quotas: VideoTypeCount = {
      OOTD: 3,
      TRAINING: 2,
      BEFORE_AFTER: 1,
      SPORTS_80S: 0,
      CINEMATIC: 0
    };

    const summary = summarizeTracking(quotas, ZERO_COUNTS);
    expect(summary.deliveredTotal).toBe(0);
    expect(summary.remainingTotal).toBe(6);
    expect(summary.status).toBe("EN_ATTENTE");
    expect(summary.remainingDetails).toContain("3 OOTD");
    expect(summary.remainingDetails).toContain("2 TRAINING");
    expect(summary.remainingDetails).toContain("1 BEFORE_AFTER");
  });

  it("does not list video types with zero remaining in details", () => {
    const quotas: VideoTypeCount = {
      OOTD: 2,
      TRAINING: 0,
      BEFORE_AFTER: 0,
      SPORTS_80S: 0,
      CINEMATIC: 1
    };
    const delivered: VideoTypeCount = {
      OOTD: 2,
      TRAINING: 0,
      BEFORE_AFTER: 0,
      SPORTS_80S: 0,
      CINEMATIC: 0
    };

    const summary = summarizeTracking(quotas, delivered);
    expect(summary.status).toBe("EN_ATTENTE");
    expect(summary.remainingDetails).not.toContain("OOTD");
    expect(summary.remainingDetails).not.toContain("TRAINING");
    expect(summary.remainingDetails).toContain("1 CINEMATIC");
  });

  it("handles over-delivery gracefully (remaining is clamped to 0)", () => {
    const quotas: VideoTypeCount = {
      OOTD: 1,
      TRAINING: 1,
      BEFORE_AFTER: 0,
      SPORTS_80S: 0,
      CINEMATIC: 0
    };
    const delivered: VideoTypeCount = {
      OOTD: 5,
      TRAINING: 3,
      BEFORE_AFTER: 0,
      SPORTS_80S: 0,
      CINEMATIC: 0
    };

    const summary = summarizeTracking(quotas, delivered);
    // Over-delivered, so remaining should be clamped to 0
    expect(summary.remainingTotal).toBe(0);
    expect(summary.status).toBe("OK");
    expect(summary.remainingDetails).toMatch(/Objectif complet/i);
  });

  it("uses pipe separator between remaining types", () => {
    const quotas: VideoTypeCount = {
      OOTD: 1,
      TRAINING: 1,
      BEFORE_AFTER: 1,
      SPORTS_80S: 1,
      CINEMATIC: 1
    };

    const summary = summarizeTracking(quotas, ZERO_COUNTS);
    expect(summary.remainingDetails).toContain(" | ");
    const parts = summary.remainingDetails.split(" | ");
    expect(parts).toHaveLength(5);
  });

  it("reports correct deliveredTotal across all types", () => {
    const quotas: VideoTypeCount = {
      OOTD: 10,
      TRAINING: 10,
      BEFORE_AFTER: 10,
      SPORTS_80S: 10,
      CINEMATIC: 10
    };
    const delivered: VideoTypeCount = {
      OOTD: 3,
      TRAINING: 5,
      BEFORE_AFTER: 2,
      SPORTS_80S: 0,
      CINEMATIC: 7
    };

    const summary = summarizeTracking(quotas, delivered);
    expect(summary.deliveredTotal).toBe(3 + 5 + 2 + 0 + 7);
    expect(summary.remainingTotal).toBe(50 - 17);
  });
});
