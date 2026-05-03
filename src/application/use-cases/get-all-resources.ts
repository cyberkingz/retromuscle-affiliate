import type { PublicResource } from "@/domain/types";
import { getResourceRepository } from "@/application/dependencies";

export async function getAllResources(): Promise<PublicResource[]> {
  const repository = getResourceRepository();
  const resources = await repository.listAllResources();
  return resources.map(({ fileKey: _fileKey, ...rest }) => rest);
}
