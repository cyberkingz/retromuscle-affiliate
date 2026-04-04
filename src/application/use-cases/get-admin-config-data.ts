import { getRepository } from "@/application/dependencies";
import { VIDEO_TYPE_LABELS } from "@/domain/constants/labels";
import type { VideoRate } from "@/domain/types";

export interface AdminConfigData {
  rates: Array<VideoRate & { label: string }>;
}

export async function getAdminConfigData(): Promise<AdminConfigData> {
  const repository = getRepository();
  const rates = await repository.listRates();

  return {
    rates: rates.map((rate) => ({
      ...rate,
      label: VIDEO_TYPE_LABELS[rate.videoType]
    }))
  };
}
