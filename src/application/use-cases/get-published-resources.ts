import type { PublicResource } from "@/domain/types";
import { getResourceRepository } from "@/application/dependencies";

export async function getPublishedResources(): Promise<PublicResource[]> {
  const repository = getResourceRepository();
  const resources = await repository.listPublishedResources();
  return resources.map(({ fileKey: _fileKey, ...rest }) => rest);
}
