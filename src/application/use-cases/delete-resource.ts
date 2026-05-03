import { getResourceRepository } from "@/application/dependencies";

export async function deleteResource(id: string): Promise<void> {
  const repository = getResourceRepository();
  const resource = await repository.getResourceById(id);
  if (!resource) throw new Error(`Resource not found: ${id}`);
  await repository.deleteResource(id);
}
