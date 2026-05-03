import { getResourceRepository } from "@/application/dependencies";

export interface ResourceUploadUrlResult {
  uploadUrl: string;
  fileKey: string;
}

export async function getResourceUploadUrl(fileName: string): Promise<ResourceUploadUrlResult> {
  const safeName = fileName
    .trim()
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(0, 96)
    .toLowerCase();

  const fileKey = `resources/${Date.now()}-${crypto.randomUUID()}-${safeName}`;
  const repository = getResourceRepository();
  const { signedUrl } = await repository.getSignedUploadUrl(fileKey);
  return { uploadUrl: signedUrl, fileKey };
}
