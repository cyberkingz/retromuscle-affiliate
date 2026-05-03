import type { PublicResource, ResourceContentType } from "@/domain/types";
import { RESOURCE_CONTENT_TYPES } from "@/domain/types";
import { getResourceRepository } from "@/application/dependencies";

export interface UpdateResourceInput {
  id: string;
  title?: string;
  description?: string | null;
  contentType?: ResourceContentType;
  isPublished?: boolean;
  sortOrder?: number;
}

export async function updateResource(input: UpdateResourceInput): Promise<PublicResource> {
  if (input.contentType !== undefined && !RESOURCE_CONTENT_TYPES.includes(input.contentType)) {
    throw new Error(`Invalid content type: ${input.contentType}`);
  }

  const repository = getResourceRepository();
  const resource = await repository.updateResource(input);
  const { fileKey: _fileKey, ...publicResource } = resource;
  return publicResource;
}
