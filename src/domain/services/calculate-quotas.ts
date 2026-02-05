import { VIDEO_TYPES, type VideoTypeCount } from "@/domain/types";
import type { MixDefinition } from "@/domain/types";

const EPSILON = 1e-6;

function assertValidDistribution(mix: MixDefinition): void {
  const total = VIDEO_TYPES.reduce((sum, videoType) => sum + mix.distribution[videoType], 0);
  if (Math.abs(total - 1) > EPSILON) {
    throw new Error(`Invalid mix distribution for ${mix.name}. Expected 1, got ${total.toFixed(4)}`);
  }
}

export function calculateQuotas(quotaTotal: number, mix: MixDefinition): VideoTypeCount {
  assertValidDistribution(mix);

  const raw = VIDEO_TYPES.map((videoType) => ({
    videoType,
    exact: quotaTotal * mix.distribution[videoType]
  }));

  const base = Object.fromEntries(
    raw.map(({ videoType, exact }) => [videoType, Math.floor(exact)])
  ) as VideoTypeCount;

  const assigned = VIDEO_TYPES.reduce((sum, videoType) => sum + base[videoType], 0);
  const remainder = quotaTotal - assigned;

  const fractions = raw
    .map(({ videoType, exact }) => ({ videoType, fraction: exact - Math.floor(exact) }))
    .sort((a, b) => b.fraction - a.fraction);

  for (let index = 0; index < remainder; index += 1) {
    const target = fractions[index % fractions.length]?.videoType;
    if (!target) {
      break;
    }
    base[target] += 1;
  }

  return base;
}
