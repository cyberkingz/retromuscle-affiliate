import type { SupabaseClient } from "@supabase/supabase-js";
import type { Resource, ResourceContentType } from "@/domain/types";
import { RESOURCE_CONTENT_TYPES } from "@/domain/types";
import type { IResourceRepository } from "@/application/repositories/resource-repository";

const RESOURCE_COLS =
  "id, title, description, content_type, file_key, file_name, file_size_bytes, is_published, sort_order, created_at, updated_at";

type ResourceRow = {
  id: string;
  title: string;
  description: string | null;
  content_type: string;
  file_key: string | null;
  file_name: string | null;
  file_size_bytes: number | null;
  is_published: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

function toResourceContentType(value: string): ResourceContentType {
  if (RESOURCE_CONTENT_TYPES.includes(value as ResourceContentType)) {
    return value as ResourceContentType;
  }
  return "GENERAL";
}

function mapResource(row: ResourceRow): Resource {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    contentType: toResourceContentType(row.content_type),
    fileKey: row.file_key,
    fileName: row.file_name,
    fileSizeBytes: row.file_size_bytes,
    isPublished: row.is_published,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export class SupabaseResourceRepository implements IResourceRepository {
  constructor(private readonly client: SupabaseClient) {}

  async listPublishedResources(): Promise<Resource[]> {
    const { data, error } = await this.client
      .from("resources")
      .select(RESOURCE_COLS)
      .eq("is_published", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) throw new Error(`listPublishedResources: ${error.message}`);
    return (data as ResourceRow[]).map(mapResource);
  }

  async listAllResources(): Promise<Resource[]> {
    const { data, error } = await this.client
      .from("resources")
      .select(RESOURCE_COLS)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) throw new Error(`listAllResources: ${error.message}`);
    return (data as ResourceRow[]).map(mapResource);
  }

  async getResourceById(id: string): Promise<Resource | null> {
    const { data, error } = await this.client
      .from("resources")
      .select(RESOURCE_COLS)
      .eq("id", id)
      .maybeSingle();

    if (error) throw new Error(`getResourceById: ${error.message}`);
    return data ? mapResource(data as ResourceRow) : null;
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
    const { data, error } = await this.client
      .from("resources")
      .insert({
        title: input.title,
        description: input.description,
        content_type: input.contentType,
        file_key: input.fileKey,
        file_name: input.fileName,
        file_size_bytes: input.fileSizeBytes,
        sort_order: input.sortOrder,
        is_published: false
      })
      .select(RESOURCE_COLS)
      .single();

    if (error) throw new Error(`createResource: ${error.message}`);
    return mapResource(data as ResourceRow);
  }

  async updateResource(input: {
    id: string;
    title?: string;
    description?: string | null;
    contentType?: ResourceContentType;
    isPublished?: boolean;
    sortOrder?: number;
  }): Promise<Resource> {
    const patch: Record<string, unknown> = {};
    if (input.title !== undefined) patch.title = input.title;
    if (input.description !== undefined) patch.description = input.description;
    if (input.contentType !== undefined) patch.content_type = input.contentType;
    if (input.isPublished !== undefined) patch.is_published = input.isPublished;
    if (input.sortOrder !== undefined) patch.sort_order = input.sortOrder;

    const { data, error } = await this.client
      .from("resources")
      .update(patch)
      .eq("id", input.id)
      .select(RESOURCE_COLS)
      .single();

    if (error) throw new Error(`updateResource: ${error.message}`);
    return mapResource(data as ResourceRow);
  }

  async deleteResource(id: string): Promise<void> {
    const resource = await this.getResourceById(id);
    if (!resource) throw new Error(`Resource not found: ${id}`);

    // Best-effort storage deletion — DB row is source of truth
    if (resource.fileKey) {
      const { error: storageError } = await this.client.storage
        .from("assets")
        .remove([resource.fileKey]);
      if (storageError) {
        console.error(`deleteResource storage: ${storageError.message} (fileKey=${resource.fileKey})`);
      }
    }

    const { error } = await this.client.from("resources").delete().eq("id", id);
    if (error) throw new Error(`deleteResource: ${error.message}`);
  }

  async getSignedDownloadUrl(fileKey: string, expiresInSeconds = 60): Promise<string> {
    const { data, error } = await this.client.storage
      .from("assets")
      .createSignedUrl(fileKey, expiresInSeconds);

    if (error || !data?.signedUrl) {
      throw new Error(`getSignedDownloadUrl: ${error?.message ?? "no URL returned"}`);
    }
    return data.signedUrl;
  }

  async getSignedUploadUrl(fileKey: string): Promise<{ signedUrl: string; path: string }> {
    const { data, error } = await this.client.storage
      .from("assets")
      .createSignedUploadUrl(fileKey);

    if (error || !data?.signedUrl) {
      throw new Error(`getSignedUploadUrl: ${error?.message ?? "no URL returned"}`);
    }
    return { signedUrl: data.signedUrl, path: data.path };
  }
}
