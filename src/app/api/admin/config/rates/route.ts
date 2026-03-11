import { updateVideoRate } from "@/application/use-cases/update-video-rate";
import { requireApiRole } from "@/features/auth/server/api-guards";
import { setAuthCookies } from "@/features/auth/server/auth-cookies";
import { writeAdminAuditLog } from "@/features/admin/server/admin-audit-log";
import { apiError, apiJson, createApiContext, handleBodyParseError } from "@/lib/api-response";
import { isAllowedOrigin } from "@/lib/origin";
import { rateLimit } from "@/lib/rate-limit";
import { readJsonBodyWithLimit } from "@/lib/request-body";
import { VIDEO_TYPES } from "@/domain/types";

interface UpdateRatePayload {
  videoType: string;
  ratePerVideo: number;
}

function parsePayload(body: unknown): UpdateRatePayload {
  if (!body || typeof body !== "object") throw new Error("Invalid payload");
  const input = body as Record<string, unknown>;

  const videoType = typeof input.videoType === "string" ? input.videoType.trim() : "";
  if (!VIDEO_TYPES.includes(videoType as (typeof VIDEO_TYPES)[number])) throw new Error("Invalid video type");

  const ratePerVideo = typeof input.ratePerVideo === "number" ? input.ratePerVideo : NaN;
  if (isNaN(ratePerVideo) || ratePerVideo < 0) throw new Error("Invalid rate");

  return { videoType, ratePerVideo };
}

export async function PUT(request: Request) {
  const ctx = createApiContext(request);
  if (!isAllowedOrigin(request)) {
    return apiError(ctx, { status: 403, code: "INVALID_ORIGIN", message: "Invalid origin" });
  }

  const limited = await rateLimit({ ctx, request, key: "admin:config:rates", limit: 30, windowMs: 60_000 });
  if (limited) return limited;

  const auth = await requireApiRole(request, "admin", { ctx });
  if (!auth.ok) return auth.response;

  let payload: UpdateRatePayload;
  try {
    payload = parsePayload(await readJsonBodyWithLimit(request, { maxBytes: 4 * 1024 }));
  } catch (error) {
    const response = handleBodyParseError(ctx, error);
    if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
    return response;
  }

  try {
    const result = await updateVideoRate(payload);

    void writeAdminAuditLog({
      request,
      requestId: ctx.requestId,
      adminUserId: auth.session.userId,
      action: "config.rate.updated",
      entityType: "video_rate",
      metadata: { videoType: payload.videoType, ratePerVideo: payload.ratePerVideo }
    });

    const response = apiJson(ctx, result, { status: 200 });
    if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
    return response;
  } catch (error) {
    const response = apiError(ctx, {
      status: 500,
      code: "INTERNAL",
      message: error instanceof Error ? error.message : "Unable to update rate"
    });
    if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
    return response;
  }
}
