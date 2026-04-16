import { revalidateTag } from "next/cache";

import { getRepository } from "@/application/dependencies";
import { VIDEO_TYPES, type VideoRate, type VideoType } from "@/domain/types";

export async function updateVideoRate(input: {
  videoType: string;
  ratePerVideo: number;
}): Promise<VideoRate> {
  if (!VIDEO_TYPES.includes(input.videoType as VideoType)) {
    throw new Error(`Invalid video type: ${input.videoType}`);
  }
  if (typeof input.ratePerVideo !== "number" || input.ratePerVideo < 0) {
    throw new Error("ratePerVideo must be a non-negative number");
  }

  const repository = getRepository();
  const result = await repository.updateVideoRate({
    videoType: input.videoType as VideoType,
    ratePerVideo: input.ratePerVideo
  });
  revalidateTag("rates");
  return result;
}
