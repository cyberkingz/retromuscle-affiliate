import { updateMixDefinition } from "@/application/use-cases/update-mix-definition";
import { requireApiRole } from "@/features/auth/server/api-guards";
import { setAuthCookies } from "@/features/auth/server/auth-cookies";
import { writeAdminAuditLog } from "@/features/admin/server/admin-audit-log";
import { apiError, apiJson, createApiContext, handleBodyParseError } from "@/lib/api-response";
import { isAllowedOrigin } from "@/lib/origin";
import { rateLimit } from "@/lib/rate-limit";
import { readJsonBodyWithLimit } from "@/lib/request-body";
import { MIX_NAMES } from "@/domain/types";

interface UpdateMixPayload {
  name: string;
  distribution: Record<string, number>;
  positioning: string;
}

function parsePayload(body: unknown): UpdateMixPayload {
  if (!body || typeof body !== "object") throw new Error("Invalid payload");
  const input = body as Record<string, unknown>;

  const name = typeof input.name === "string" ? input.name.trim() : "";
  if (!MIX_NAMES.includes(name as (typeof MIX_NAMES)[number])) throw new Error("Invalid mix name");

  const distribution = input.distribution;
  if (!distribution || typeof distribution !== "object") throw new Error("Invalid distribution");

  const positioning = typeof input.positioning === "string" ? input.positioning.trim() : "";
  if (positioning.length > 500) throw new Error("Positioning too long");

  return { name, distribution: distribution as Record<string, number>, positioning };
}

export async function PUT(request: Request) {
  const ctx = createApiContext(request);
  if (!isAllowedOrigin(request)) {
    return apiError(ctx, { status: 403, code: "INVALID_ORIGIN", message: "Invalid origin" });
  }

  const limited = await rateLimit({ ctx, request, key: "admin:config:mixes", limit: 30, windowMs: 60_000 });
  if (limited) return limited;

  const auth = await requireApiRole(request, "admin", { ctx });
  if (!auth.ok) return auth.response;

  let payload: UpdateMixPayload;
  try {
    payload = parsePayload(await readJsonBodyWithLimit(request, { maxBytes: 4 * 1024 }));
  } catch (error) {
    const response = handleBodyParseError(ctx, error);
    if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
    return response;
  }

  try {
    const result = await updateMixDefinition(payload);

    void writeAdminAuditLog({
      request,
      requestId: ctx.requestId,
      adminUserId: auth.session.userId,
      action: "config.mix.updated",
      entityType: "mix_definition",
      metadata: { name: payload.name, distribution: payload.distribution }
    });

    const response = apiJson(ctx, result, { status: 200 });
    if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
    return response;
  } catch (error) {
    const response = apiError(ctx, {
      status: 500,
      code: "INTERNAL",
      message: error instanceof Error ? error.message : "Unable to update mix"
    });
    if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
    return response;
  }
}
