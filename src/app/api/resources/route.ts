import { revalidatePath } from "next/cache";
import { getAllResources } from "@/application/use-cases/get-all-resources";
import { getPublishedResources } from "@/application/use-cases/get-published-resources";
import { createResource } from "@/application/use-cases/create-resource";
import { getResourceUploadUrl } from "@/application/use-cases/get-resource-upload-url";
import { requireApiRole } from "@/features/auth/server/api-guards";
import { requireApiSession } from "@/features/auth/server/api-guards";
import { setAuthCookies } from "@/features/auth/server/auth-cookies";
import { writeAdminAuditLog } from "@/features/admin/server/admin-audit-log";
import { apiError, apiJson, createApiContext, handleBodyParseError } from "@/lib/api-response";
import { isAllowedOrigin } from "@/lib/origin";
import { rateLimit } from "@/lib/rate-limit";
import { readJsonBodyWithLimit } from "@/lib/request-body";
import { RESOURCE_CONTENT_TYPES } from "@/domain/types";
import type { ResourceContentType } from "@/domain/types";

const MAX_FILE_SIZE_BYTES = 52_428_800; // 50 MB

interface CreateResourcePayload {
  title: string;
  description: string | null;
  contentType: ResourceContentType;
  fileName: string;
  fileSizeBytes: number;
  sortOrder?: number;
}

function parseCreatePayload(body: unknown): CreateResourcePayload {
  if (!body || typeof body !== "object") throw new Error("Invalid payload");
  const input = body as Record<string, unknown>;

  const title = typeof input.title === "string" ? input.title.trim() : "";
  if (title.length < 2 || title.length > 120) throw new Error("Title must be 2–120 characters");

  const description =
    input.description === null
      ? null
      : typeof input.description === "string"
        ? input.description.trim().slice(0, 500) || null
        : null;

  const contentType = typeof input.contentType === "string" ? input.contentType : "";
  if (!RESOURCE_CONTENT_TYPES.includes(contentType as ResourceContentType)) {
    throw new Error(`Invalid content type: ${contentType}`);
  }

  const fileName = typeof input.fileName === "string" ? input.fileName.trim() : "";
  if (!fileName || !fileName.toLowerCase().endsWith(".pdf")) {
    throw new Error("fileName must be a .pdf file");
  }

  const fileSizeBytes = typeof input.fileSizeBytes === "number" ? input.fileSizeBytes : NaN;
  if (!Number.isFinite(fileSizeBytes) || fileSizeBytes <= 0 || fileSizeBytes > MAX_FILE_SIZE_BYTES) {
    throw new Error(`fileSizeBytes must be between 1 and ${MAX_FILE_SIZE_BYTES}`);
  }

  const sortOrder = typeof input.sortOrder === "number" ? Math.max(0, Math.floor(input.sortOrder)) : 0;

  return {
    title,
    description,
    contentType: contentType as ResourceContentType,
    fileName,
    fileSizeBytes,
    sortOrder
  };
}

/** GET /api/resources — list resources (published for creators, all for admins) */
export async function GET(request: Request) {
  const ctx = createApiContext(request);

  const limited = await rateLimit({ ctx, request, key: "resources:list", limit: 120, windowMs: 60_000 });
  if (limited) return limited;

  const auth = await requireApiSession(request, { ctx });
  if (!auth.ok) return auth.response;

  // Active-creator check for affiliates (must have redirect target "/dashboard")
  if (auth.session.role === "affiliate" && auth.session.target !== "/dashboard") {
    const response = apiError(ctx, { status: 403, code: "FORBIDDEN", message: "Accès réservé aux créateurs actifs." });
    if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
    return response;
  }

  try {
    const resources =
      auth.session.role === "admin" ? await getAllResources() : await getPublishedResources();
    const response = apiJson(ctx, { resources }, { status: 200 });
    if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
    return response;
  } catch {
    const response = apiError(ctx, { status: 500, code: "INTERNAL", message: "Unable to fetch resources" });
    if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
    return response;
  }
}

/** POST /api/resources — create resource + get signed upload URL (admin only) */
export async function POST(request: Request) {
  const ctx = createApiContext(request);

  if (!isAllowedOrigin(request)) {
    return apiError(ctx, { status: 403, code: "INVALID_ORIGIN", message: "Invalid origin" });
  }

  const limited = await rateLimit({ ctx, request, key: "admin:resources:create", limit: 30, windowMs: 60_000 });
  if (limited) return limited;

  const auth = await requireApiRole(request, "admin", { ctx });
  if (!auth.ok) return auth.response;

  let payload: CreateResourcePayload;
  try {
    payload = parseCreatePayload(await readJsonBodyWithLimit(request, { maxBytes: 16 * 1024 }));
  } catch (error) {
    const response = handleBodyParseError(ctx, error);
    if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
    return response;
  }

  try {
    const { uploadUrl, fileKey } = await getResourceUploadUrl(payload.fileName);
    const resource = await createResource({ ...payload, fileKey });

    revalidatePath("/resources");
    revalidatePath("/admin/resources");

    writeAdminAuditLog({
      request,
      requestId: ctx.requestId,
      adminUserId: auth.session.userId,
      action: "resource.created",
      entityType: "resource",
      metadata: { resourceId: resource.id, title: resource.title, contentType: resource.contentType }
    }).catch(console.error);

    const response = apiJson(ctx, { resource, uploadUrl }, { status: 201 });
    if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
    return response;
  } catch {
    const response = apiError(ctx, { status: 500, code: "INTERNAL", message: "Unable to create resource" });
    if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
    return response;
  }
}
