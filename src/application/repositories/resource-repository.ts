import type { Resource, ResourceContentType } from "@/domain/types";

export interface IResourceRepository {
  listPublishedResources(): Promise<Resource[]>;
  listAllResources(): Promise<Resource[]>;
  getResourceById(id: string): Promise<Resource | null>;
  createResource(input: {
    title: string;
    description: string | null;
    contentType: ResourceContentType;
    fileKey: string;
    fileName: string;
    fileSizeBytes: number;
    sortOrder: number;
  }): Promise<Resource>;
  updateResource(input: {
    id: string;
    title?: string;
    description?: string | null;
    contentType?: ResourceContentType;
    isPublished?: boolean;
    sortOrder?: number;
  }): Promise<Resource>;
  deleteResource(id: string): Promise<void>;
  getSignedDownloadUrl(fileKey: string, expiresInSeconds?: number): Promise<string>;
  getSignedUploadUrl(fileKey: string): Promise<{ signedUrl: string; path: string }>;
}
