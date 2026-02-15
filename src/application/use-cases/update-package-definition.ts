import { getRepository } from "@/application/dependencies";
import type { PackageDefinition, PackageTier } from "@/domain/types";

const VALID_TIERS: PackageTier[] = [10, 20, 30, 40];

export async function updatePackageDefinition(input: {
  tier: number;
  quotaVideos: number;
  monthlyCredits: number;
}): Promise<PackageDefinition> {
  if (!VALID_TIERS.includes(input.tier as PackageTier)) {
    throw new Error(`Invalid tier: ${input.tier}`);
  }
  if (!Number.isInteger(input.quotaVideos) || input.quotaVideos < 1) {
    throw new Error("quotaVideos must be a positive integer");
  }
  if (typeof input.monthlyCredits !== "number" || input.monthlyCredits < 0) {
    throw new Error("monthlyCredits must be a non-negative number");
  }

  const repository = getRepository();
  return repository.updatePackageDefinition({
    tier: input.tier as PackageTier,
    quotaVideos: input.quotaVideos,
    monthlyCredits: input.monthlyCredits
  });
}
