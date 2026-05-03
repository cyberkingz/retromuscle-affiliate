import type { Resource, ResourceContentType } from "@/domain/types";
import type { IResourceRepository } from "@/application/repositories/resource-repository";

function makeStubResource(overrides: Partial<Resource> & { id: string; title: string; contentType: ResourceContentType }): Resource {
  return {
    description: null,
    fileKey: null,
    fileName: null,
    fileSizeBytes: null,
    isPublished: false,
    sortOrder: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides
  };
}

export class InMemoryResourceRepository implements IResourceRepository {
  private resources: Resource[] = [];

  async listPublishedResources(): Promise<Resource[]> {
    return this.resources.filter((r) => r.isPublished);
  }

  async listAllResources(): Promise<Resource[]> {
    return [...this.resources];
  }

  async getResourceById(id: string): Promise<Resource | null> {
    return this.resources.find((r) => r.id === id) ?? null;
  }

  async createResource(input: {
    title: string;
    description: string | null;
    contentType: ResourceContentType;
    fileKey: string;
    fileName: string;
    fileSizeBytes: number;
    sortOrder: number;
  }): Promise<Resource> {
    const resource = makeStubResource({
      id: crypto.randomUUID(),
      title: input.title,
      description: input.description,
      contentType: input.contentType,
      fileKey: input.fileKey,
      fileName: input.fileName,
      fileSizeBytes: input.fileSizeBytes,
      sortOrder: input.sortOrder,
      isPublished: false
    });
    this.resources.push(resource);
    return resource;
  }

  async updateResource(input: {
    id: string;
    title?: string;
    description?: string | null;
    contentType?: ResourceContentType;
    isPublished?: boolean;
    sortOrder?: number;
  }): Promise<Resource> {
    const idx = this.resources.findIndex((r) => r.id === input.id);
    if (idx === -1) throw new Error(`Resource not found: ${input.id}`);
    const updated = { ...this.resources[idx], ...input, updatedAt: new Date().toISOString() };
    this.resources[idx] = updated;
    return updated;
  }

  async deleteResource(id: string): Promise<void> {
    this.resources = this.resources.filter((r) => r.id !== id);
  }

  async getSignedDownloadUrl(_fileKey: string, _expiresInSeconds?: number): Promise<string> {
    return "https://example.com/mock-signed-url";
  }

  async getSignedUploadUrl(fileKey: string): Promise<{ signedUrl: string; path: string }> {
    return { signedUrl: "https://example.com/mock-upload-url", path: fileKey };
  }
}
