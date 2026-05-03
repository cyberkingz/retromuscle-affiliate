import { getResourceRepository } from "@/application/dependencies";

export interface ResourceDownloadUrlResult {
  url: string;
  expiresIn: number;
}

export async function getResourceDownloadUrl(input: {
  id: string;
  isAdmin: boolean;
}): Promise<ResourceDownloadUrlResult> {
  const repository = getResourceRepository();
  const resource = await repository.getResourceById(input.id);

  if (!resource) {
    throw new Error("NOT_FOUND");
  }

  // Non-admins can only download published resources with an attached file
  if (!input.isAdmin && (!resource.isPublished || !resource.fileKey)) {
    throw new Error("NOT_FOUND");
  }

  if (!resource.fileKey) {
    throw new Error("Resource has no file attached");
  }

  const url = await repository.getSignedDownloadUrl(resource.fileKey, 60);
  return { url, expiresIn: 60 };
}
