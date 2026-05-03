import type { PublicResource, ResourceContentType } from "@/domain/types";
import { RESOURCE_CONTENT_TYPES } from "@/domain/types";
import { getResourceRepository } from "@/application/dependencies";

export interface CreateResourceInput {
  title: string;
  description: string | null;
  contentType: ResourceContentType;
  fileKey: string;
  fileName: string;
  fileSizeBytes: number;
  sortOrder?: number;
}

export async function createResource(input: CreateResourceInput): Promise<PublicResource> {
  if (!RESOURCE_CONTENT_TYPES.includes(input.contentType)) {
    throw new Error(`Invalid content type: ${input.contentType}`);
  }

  const repository = getResourceRepository();
  const resource = await repository.createResource({
    title: input.title,
    description: input.description,
    contentType: input.contentType,
    fileKey: input.fileKey,
    fileName: input.fileName,
    fileSizeBytes: input.fileSizeBytes,
    sortOrder: input.sortOrder ?? 0
  });

  const { fileKey: _fileKey, ...publicResource } = resource;
  return publicResource;
}
