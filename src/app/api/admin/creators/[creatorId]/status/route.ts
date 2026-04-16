import { updateCreatorStatus } from "@/application/use-cases/update-creator-status";
import { requireApiRole } from "@/features/auth/server/api-guards";
import { setAuthCookies } from "@/features/auth/server/auth-cookies";
import { writeAdminAuditLog } from "@/features/admin/server/admin-audit-log";
import { apiError, apiJson, createApiContext, handleBodyParseError } from "@/lib/api-response";
import { isAllowedOrigin } from "@/lib/origin";
import { rateLimit } from "@/lib/rate-limit";
import { readJsonBodyWithLimit } from "@/lib/request-body";
import { isUuid } from "@/lib/validation";

const ALLOWED_STATUSES = ["actif", "pause", "inactif"] as const;
type AllowedStatus = (typeof ALLOWED_STATUSES)[number];

function parsePayload(body: unknown): { status: AllowedStatus } {
  if (!body || typeof body !== "object") {
    throw new Error("Invalid payload");
  }

  const input = body as Record<string, unknown>;
  const status = typeof input.status === "string" ? input.status.trim() : "";

  if (!ALLOWED_STATUSES.includes(status as AllowedStatus)) {
    throw new Error(`Invalid status. Must be one of: ${ALLOWED_STATUSES.join(", ")}`);
  }

  return { status: status as AllowedStatus };
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ creatorId: string }> }
) {
  const ctx = createApiContext(request);
  if (!isAllowedOrigin(request)) {
    return apiError(ctx, { status: 403, code: "INVALID_ORIGIN", message: "Invalid origin" });
  }

  const { creatorId } = await params;
  if (!creatorId || !isUuid(creatorId)) {
    return apiError(ctx, { status: 400, code: "BAD_REQUEST", message: "Invalid creatorId" });
  }

  const limited = await rateLimit({
    ctx,
    request,
    key: "admin:creators:status",
    limit: 60,
    windowMs: 60_000
  });
  if (limited) {
    return limited;
  }

  const auth = await requireApiRole(request, "admin", { ctx });
  if (!auth.ok) {
    return auth.response;
  }

  let payload: { status: AllowedStatus };
  try {
    payload = parsePayload(await readJsonBodyWithLimit(request, { maxBytes: 512 }));
  } catch (error) {
    const response = handleBodyParseError(ctx, error);
    if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
    return response;
  }

  try {
    const creator = await updateCreatorStatus({ creatorId, status: payload.status });

    writeAdminAuditLog({
      request,
      requestId: ctx.requestId,
      adminUserId: auth.session.userId,
      action: "creator.status_update",
      entityType: "creator",
      entityId: creatorId,
      metadata: { status: payload.status }
    }).catch(console.error);

    const response = apiJson(ctx, { creator }, { status: 200 });
    if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
    return response;
  } catch (error) {
    if (error instanceof Error && error.message.includes("not found")) {
      const response = apiError(ctx, {
        status: 404,
        code: "NOT_FOUND",
        message: "Créateur introuvable"
      });
      if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
      return response;
    }
    if (error instanceof Error && error.message.includes("candidat")) {
      const response = apiError(ctx, { status: 400, code: "BAD_REQUEST", message: error.message });
      if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
      return response;
    }

    // eslint-disable-next-line no-console
    console.error("[admin/creators/[creatorId]/status] unexpected error", {
      requestId: ctx.requestId,
      error
    });

    const response = apiError(ctx, {
      status: 500,
      code: "INTERNAL",
      message: "Unable to update creator status"
    });
    if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
    return response;
  }
}
