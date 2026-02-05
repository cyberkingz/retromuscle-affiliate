import type { PackageDefinition, PackageTier } from "@/domain/types";

export const PACKAGE_DEFINITIONS: Record<PackageTier, PackageDefinition> = {
  10: { tier: 10, quotaVideos: 10, monthlyCredits: 0 },
  20: { tier: 20, quotaVideos: 20, monthlyCredits: 25 },
  30: { tier: 30, quotaVideos: 30, monthlyCredits: 38 },
  40: { tier: 40, quotaVideos: 40, monthlyCredits: 50 }
};
