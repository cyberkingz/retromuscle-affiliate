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
  it("returns zero total when nothing is delivered", () => {
    const summary = summarizeTracking(ZERO_COUNTS);
    expect(summary.deliveredTotal).toBe(0);
    expect(summary.deliveredDetails).toBe("Aucune video");
  });

  it("sums delivered videos across all types", () => {
    const delivered: VideoTypeCount = {
      OOTD: 3,
      TRAINING: 5,
      BEFORE_AFTER: 2,
      SPORTS_80S: 0,
      CINEMATIC: 7
    };

    const summary = summarizeTracking(delivered);
    expect(summary.deliveredTotal).toBe(17);
  });

  it("lists only types with deliveries in details", () => {
    const delivered: VideoTypeCount = {
      OOTD: 2,
      TRAINING: 0,
      BEFORE_AFTER: 0,
      SPORTS_80S: 0,
      CINEMATIC: 1
    };

    const summary = summarizeTracking(delivered);
    expect(summary.deliveredDetails).toContain("2 OOTD");
    expect(summary.deliveredDetails).toContain("1 CINEMATIC");
    expect(summary.deliveredDetails).not.toContain("TRAINING");
  });

  it("uses pipe separator between delivered types", () => {
    const delivered: VideoTypeCount = {
      OOTD: 1,
      TRAINING: 1,
      BEFORE_AFTER: 1,
      SPORTS_80S: 1,
      CINEMATIC: 1
    };

    const summary = summarizeTracking(delivered);
    expect(summary.deliveredDetails).toContain(" | ");
    const parts = summary.deliveredDetails.split(" | ");
    expect(parts).toHaveLength(5);
  });

  it("lists types in VIDEO_TYPES order", () => {
    const delivered: VideoTypeCount = {
      OOTD: 1,
      TRAINING: 1,
      BEFORE_AFTER: 1,
      SPORTS_80S: 1,
      CINEMATIC: 1
    };

    const summary = summarizeTracking(delivered);
    const parts = summary.deliveredDetails.split(" | ");
    expect(parts[0]).toBe("1 OOTD");
    expect(parts[1]).toBe("1 TRAINING");
    expect(parts[4]).toBe("1 CINEMATIC");
  });
});
