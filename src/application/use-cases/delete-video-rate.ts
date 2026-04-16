import { revalidateTag } from "next/cache";

import { getRepository } from "@/application/dependencies";
import { VIDEO_TYPES, type VideoRate, type VideoType } from "@/domain/types";

export async function deleteVideoRate(input: { videoType: string }): Promise<VideoRate> {
  if (!VIDEO_TYPES.includes(input.videoType as VideoType)) {
    throw new Error(`Invalid video type: ${input.videoType}`);
  }

  const repository = getRepository();
  const rates = await repository.listRates();
  const existingRate = rates.find((rate) => rate.videoType === input.videoType);

  if (!existingRate) {
    throw new Error(`Rate not found: ${input.videoType}`);
  }

  if (existingRate.isPlaceholder) {
    throw new Error(`Rate already disabled: ${input.videoType}`);
  }

  const activeRatesCount = rates.filter((rate) => !rate.isPlaceholder).length;
  if (activeRatesCount <= 1) {
    throw new Error("At least one video type must remain configured");
  }

  const result = await repository.deleteVideoRate({
    videoType: input.videoType as VideoType
  });
  revalidateTag("rates");
  return result;
}
