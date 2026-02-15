import { getRepository } from "@/application/dependencies";
import { MIX_NAMES, VIDEO_TYPES, type MixDefinition, type MixName, type VideoType } from "@/domain/types";

export async function updateMixDefinition(input: {
  name: string;
  distribution: Record<string, number>;
  positioning: string;
}): Promise<MixDefinition> {
  if (!MIX_NAMES.includes(input.name as MixName)) {
    throw new Error(`Invalid mix name: ${input.name}`);
  }

  // Validate distribution: must have all video types, values must sum to ~1.0
  const distribution = {} as Record<VideoType, number>;
  let total = 0;

  for (const videoType of VIDEO_TYPES) {
    const value = input.distribution[videoType];
    if (typeof value !== "number" || value < 0 || value > 1) {
      throw new Error(`Invalid distribution value for ${videoType}: ${value}`);
    }
    distribution[videoType] = value;
    total += value;
  }

  if (Math.abs(total - 1) > 0.01) {
    throw new Error(`Distribution must sum to 1.0, got ${total.toFixed(4)}`);
  }

  if (typeof input.positioning !== "string" || input.positioning.length > 500) {
    throw new Error("Invalid positioning");
  }

  const repository = getRepository();
  return repository.updateMixDefinition({
    name: input.name as MixName,
    distribution,
    positioning: input.positioning.trim()
  });
}
