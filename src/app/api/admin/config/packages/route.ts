import { updatePackageDefinition } from "@/application/use-cases/update-package-definition";
import { requireApiRole } from "@/features/auth/server/api-guards";
import { setAuthCookies } from "@/features/auth/server/auth-cookies";
import { writeAdminAuditLog } from "@/features/admin/server/admin-audit-log";
import { apiError, apiJson, createApiContext } from "@/lib/api-response";
import { isAllowedOrigin } from "@/lib/origin";
import { rateLimit } from "@/lib/rate-limit";
import { readJsonBodyWithLimit } from "@/lib/request-body";

interface UpdatePackagePayload {
  tier: number;
  quotaVideos: number;
  monthlyCredits: number;
}

function parsePayload(body: unknown): UpdatePackagePayload {
  if (!body || typeof body !== "object") throw new Error("Invalid payload");
  const input = body as Record<string, unknown>;

  const tier = typeof input.tier === "number" ? input.tier : NaN;
  const quotaVideos = typeof input.quotaVideos === "number" ? input.quotaVideos : NaN;
  const monthlyCredits = typeof input.monthlyCredits === "number" ? input.monthlyCredits : NaN;

  if (![10, 20, 30, 40].includes(tier)) throw new Error("Invalid tier");
  if (!Number.isInteger(quotaVideos) || quotaVideos < 1) throw new Error("Invalid quotaVideos");
  if (isNaN(monthlyCredits) || monthlyCredits < 0) throw new Error("Invalid monthlyCredits");

  return { tier, quotaVideos, monthlyCredits };
}

export async function PUT(request: Request) {
  const ctx = createApiContext(request);
  if (!isAllowedOrigin(request)) {
    return apiError(ctx, { status: 403, code: "INVALID_ORIGIN", message: "Invalid origin" });
  }

  const limited = rateLimit({ ctx, request, key: "admin:config:packages", limit: 30, windowMs: 60_000 });
  if (limited) return limited;

  const auth = await requireApiRole(request, "admin", { ctx });
  if (!auth.ok) return auth.response;

  let payload: UpdatePackagePayload;
  try {
    payload = parsePayload(await readJsonBodyWithLimit(request, { maxBytes: 4 * 1024 }));
  } catch (error) {
    const response = apiError(ctx, {
      status: error instanceof Error && error.message === "PAYLOAD_TOO_LARGE" ? 413 : 400,
      code: error instanceof Error && error.message === "PAYLOAD_TOO_LARGE" ? "PAYLOAD_TOO_LARGE" : "BAD_REQUEST",
      message: error instanceof Error ? error.message : "Invalid payload"
    });
    if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
    return response;
  }

  try {
    const result = await updatePackageDefinition(payload);

    void writeAdminAuditLog({
      request,
      requestId: ctx.requestId,
      adminUserId: auth.session.userId,
      action: "config.package.updated",
      entityType: "package_definition",
      metadata: { tier: payload.tier, quotaVideos: payload.quotaVideos, monthlyCredits: payload.monthlyCredits }
    });

    const response = apiJson(ctx, result, { status: 200 });
    if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
    return response;
  } catch (error) {
    const response = apiError(ctx, {
      status: 500,
      code: "INTERNAL",
      message: error instanceof Error ? error.message : "Unable to update package"
    });
    if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
    return response;
  }
}
