import { revalidatePath, revalidateTag } from "next/cache";
import { updateVideoRate } from "@/application/use-cases/update-video-rate";
import { deleteVideoRate } from "@/application/use-cases/delete-video-rate";
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

function parseVideoType(body: unknown): string {
  if (!body || typeof body !== "object") throw new Error("Invalid payload");
  const input = body as Record<string, unknown>;

  const videoType = typeof input.videoType === "string" ? input.videoType.trim() : "";
  if (!VIDEO_TYPES.includes(videoType as (typeof VIDEO_TYPES)[number]))
    throw new Error("Invalid video type");

  return videoType;
}

function parseUpdatePayload(body: unknown): UpdateRatePayload {
  const videoType = parseVideoType(body);
  const input = body as Record<string, unknown>;
  const ratePerVideo = typeof input.ratePerVideo === "number" ? input.ratePerVideo : NaN;
  if (isNaN(ratePerVideo) || ratePerVideo < 0) throw new Error("Invalid rate");

  return { videoType, ratePerVideo };
}

function resolveDeleteErrorStatus(error: unknown): number {
  if (!(error instanceof Error)) return 500;

  if (
    error.message.startsWith("Invalid video type:") ||
    error.message.startsWith("Rate not found:") ||
    error.message.startsWith("Rate already disabled:") ||
    error.message === "At least one video type must remain configured"
  ) {
    return 400;
  }

  return 500;
}

export async function PUT(request: Request) {
  const ctx = createApiContext(request);
  if (!isAllowedOrigin(request)) {
    return apiError(ctx, { status: 403, code: "INVALID_ORIGIN", message: "Invalid origin" });
  }

  const limited = await rateLimit({
    ctx,
    request,
    key: "admin:config:rates",
    limit: 30,
    windowMs: 60_000
  });
  if (limited) return limited;

  const auth = await requireApiRole(request, "admin", { ctx });
  if (!auth.ok) return auth.response;

  let payload: UpdateRatePayload;
  try {
    payload = parseUpdatePayload(await readJsonBodyWithLimit(request, { maxBytes: 4 * 1024 }));
  } catch (error) {
    const response = handleBodyParseError(ctx, error);
    if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
    return response;
  }

  try {
    const result = await updateVideoRate(payload);
    revalidateTag("rates");
    revalidatePath("/", "page");
    revalidatePath("/creators", "page");

    writeAdminAuditLog({
      request,
      requestId: ctx.requestId,
      adminUserId: auth.session.userId,
      action: "config.rate.updated",
      entityType: "video_rate",
      metadata: { videoType: payload.videoType, ratePerVideo: payload.ratePerVideo }
    }).catch(console.error);

    const response = apiJson(ctx, result, { status: 200 });
    if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
    return response;
  } catch {
    const response = apiError(ctx, {
      status: 500,
      code: "INTERNAL",
      message: "Unable to update rate"
    });
    if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
    return response;
  }
}

export async function DELETE(request: Request) {
  const ctx = createApiContext(request);
  if (!isAllowedOrigin(request)) {
    return apiError(ctx, { status: 403, code: "INVALID_ORIGIN", message: "Invalid origin" });
  }

  const limited = await rateLimit({
    ctx,
    request,
    key: "admin:config:rates",
    limit: 30,
    windowMs: 60_000
  });
  if (limited) return limited;

  const auth = await requireApiRole(request, "admin", { ctx });
  if (!auth.ok) return auth.response;

  let videoType: string;
  try {
    videoType = parseVideoType(await readJsonBodyWithLimit(request, { maxBytes: 4 * 1024 }));
  } catch (error) {
    const response = handleBodyParseError(ctx, error);
    if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
    return response;
  }

  try {
    const result = await deleteVideoRate({ videoType });
    revalidateTag("rates");
    revalidatePath("/", "page");
    revalidatePath("/creators", "page");

    writeAdminAuditLog({
      request,
      requestId: ctx.requestId,
      adminUserId: auth.session.userId,
      action: "config.rate.disabled",
      entityType: "video_rate",
      metadata: { videoType }
    }).catch(console.error);

    const response = apiJson(ctx, result, { status: 200 });
    if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
    return response;
  } catch (error) {
    const status = resolveDeleteErrorStatus(error);
    const response = apiError(ctx, {
      status,
      code: status === 400 ? "BAD_REQUEST" : "INTERNAL",
      message: status === 400 && error instanceof Error ? error.message : "Unable to disable rate"
    });
    if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
    return response;
  }
}
