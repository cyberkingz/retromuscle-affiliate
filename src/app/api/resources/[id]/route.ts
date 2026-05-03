import { revalidatePath } from "next/cache";
import { updateResource } from "@/application/use-cases/update-resource";
import { deleteResource } from "@/application/use-cases/delete-resource";
import { requireApiRole } from "@/features/auth/server/api-guards";
import { setAuthCookies } from "@/features/auth/server/auth-cookies";
import { writeAdminAuditLog } from "@/features/admin/server/admin-audit-log";
import { apiError, apiJson, createApiContext, handleBodyParseError } from "@/lib/api-response";
import { isAllowedOrigin } from "@/lib/origin";
import { rateLimit } from "@/lib/rate-limit";
import { readJsonBodyWithLimit } from "@/lib/request-body";
import { RESOURCE_CONTENT_TYPES } from "@/domain/types";
import type { ResourceContentType } from "@/domain/types";

interface UpdateResourcePayload {
  title?: string;
  description?: string | null;
  contentType?: ResourceContentType;
  isPublished?: boolean;
  sortOrder?: number;
}

function parseUpdatePayload(body: unknown): UpdateResourcePayload {
  if (!body || typeof body !== "object") throw new Error("Invalid payload");
  const input = body as Record<string, unknown>;
  const patch: UpdateResourcePayload = {};

  if ("title" in input) {
    const title = typeof input.title === "string" ? input.title.trim() : "";
    if (title.length < 2 || title.length > 120) throw new Error("Title must be 2–120 characters");
    patch.title = title;
  }

  if ("description" in input) {
    patch.description =
      input.description === null
        ? null
        : typeof input.description === "string"
          ? input.description.trim().slice(0, 500) || null
          : null;
  }

  if ("contentType" in input) {
    const ct = input.contentType;
    if (!RESOURCE_CONTENT_TYPES.includes(ct as ResourceContentType)) {
      throw new Error(`Invalid content type: ${String(ct)}`);
    }
    patch.contentType = ct as ResourceContentType;
  }

  if ("isPublished" in input) {
    if (typeof input.isPublished !== "boolean") throw new Error("isPublished must be a boolean");
    patch.isPublished = input.isPublished;
  }

  if ("sortOrder" in input) {
    const so = typeof input.sortOrder === "number" ? input.sortOrder : NaN;
    if (!Number.isFinite(so)) throw new Error("sortOrder must be a number");
    patch.sortOrder = Math.max(0, Math.floor(so));
  }

  return patch;
}

/** PATCH /api/resources/[id] — update resource metadata (admin only) */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = createApiContext(request);

  if (!isAllowedOrigin(request)) {
    return apiError(ctx, { status: 403, code: "INVALID_ORIGIN", message: "Invalid origin" });
  }

  const limited = await rateLimit({ ctx, request, key: "admin:resources:update", limit: 60, windowMs: 60_000 });
  if (limited) return limited;

  const auth = await requireApiRole(request, "admin", { ctx });
  if (!auth.ok) return auth.response;

  const { id } = await params;

  let payload: UpdateResourcePayload;
  try {
    payload = parseUpdatePayload(await readJsonBodyWithLimit(request, { maxBytes: 8 * 1024 }));
  } catch (error) {
    const response = handleBodyParseError(ctx, error);
    if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
    return response;
  }

  try {
    const resource = await updateResource({ id, ...payload });

    revalidatePath("/resources");
    revalidatePath("/admin/resources");

    writeAdminAuditLog({
      request,
      requestId: ctx.requestId,
      adminUserId: auth.session.userId,
      action: "resource.updated",
      entityType: "resource",
      metadata: { resourceId: id, ...payload }
    }).catch(console.error);

    const response = apiJson(ctx, { resource }, { status: 200 });
    if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
    return response;
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Resource not found")) {
      const response = apiError(ctx, { status: 404, code: "NOT_FOUND", message: "Resource not found" });
      if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
      return response;
    }
    const response = apiError(ctx, { status: 500, code: "INTERNAL", message: "Unable to update resource" });
    if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
    return response;
  }
}

/** DELETE /api/resources/[id] — delete resource + storage file (admin only) */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = createApiContext(request);

  if (!isAllowedOrigin(request)) {
    return apiError(ctx, { status: 403, code: "INVALID_ORIGIN", message: "Invalid origin" });
  }

  const limited = await rateLimit({ ctx, request, key: "admin:resources:delete", limit: 30, windowMs: 60_000 });
  if (limited) return limited;

  const auth = await requireApiRole(request, "admin", { ctx });
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    await deleteResource(id);

    revalidatePath("/resources");
    revalidatePath("/admin/resources");

    writeAdminAuditLog({
      request,
      requestId: ctx.requestId,
      adminUserId: auth.session.userId,
      action: "resource.deleted",
      entityType: "resource",
      metadata: { resourceId: id }
    }).catch(console.error);

    const response = apiJson(ctx, { ok: true }, { status: 200 });
    if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
    return response;
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Resource not found")) {
      const response = apiError(ctx, { status: 404, code: "NOT_FOUND", message: "Resource not found" });
      if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
      return response;
    }
    const response = apiError(ctx, { status: 500, code: "INTERNAL", message: "Unable to delete resource" });
    if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
    return response;
  }
}
