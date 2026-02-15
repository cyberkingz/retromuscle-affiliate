import { getRepository } from "@/application/dependencies";
import { MIX_LABELS, VIDEO_TYPE_LABELS } from "@/domain/constants/labels";
import type { MixDefinition, PackageDefinition, VideoRate } from "@/domain/types";

export interface AdminConfigData {
  packages: PackageDefinition[];
  mixes: Array<MixDefinition & { label: string }>;
  rates: Array<VideoRate & { label: string }>;
}

export async function getAdminConfigData(): Promise<AdminConfigData> {
  const repository = getRepository();
  const [packages, mixes, rates] = await Promise.all([
    repository.listPackageDefinitions(),
    repository.listMixDefinitions(),
    repository.listRates()
  ]);

  return {
    packages,
    mixes: mixes.map((mix) => ({
      ...mix,
      label: MIX_LABELS[mix.name]
    })),
    rates: rates.map((rate) => ({
      ...rate,
      label: VIDEO_TYPE_LABELS[rate.videoType]
    }))
  };
}
