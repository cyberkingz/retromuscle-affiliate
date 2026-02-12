import { NextResponse } from "next/server";

import { reviewVideoUpload } from "@/application/use-cases/review-video-upload";
import { requireApiRole } from "@/features/auth/server/api-guards";
import { setAuthCookies } from "@/features/auth/server/auth-cookies";
import { writeAdminAuditLog } from "@/features/admin/server/admin-audit-log";
import { apiError, apiJson, createApiContext } from "@/lib/api-response";
import { isAllowedOrigin } from "@/lib/origin";
import { rateLimit } from "@/lib/rate-limit";
import { readJsonBodyWithLimit } from "@/lib/request-body";
import { isUuid } from "@/lib/validation";

interface ReviewVideoPayload {
  videoId: string;
  decision: "approved" | "rejected";
  rejectionReason?: string | null;
}

function parsePayload(body: unknown): ReviewVideoPayload {
  if (!body || typeof body !== "object") {
    throw new Error("Invalid payload");
  }

  const input = body as Record<string, unknown>;
  const videoId = typeof input.videoId === "string" ? input.videoId.trim() : "";
  const decision = input.decision;
  const rejectionReason = typeof input.rejectionReason === "string" ? input.rejectionReason.trim() : null;

  if (!videoId || !isUuid(videoId)) {
    throw new Error("Invalid videoId");
  }
  if (decision !== "approved" && decision !== "rejected") {
    throw new Error("Invalid decision");
  }
  if (rejectionReason && rejectionReason.length > 2000) {
    throw new Error("rejectionReason is too long");
  }

  return {
    videoId,
    decision,
    rejectionReason
  };
}

export async function POST(request: Request) {
  const ctx = createApiContext(request);
  if (!isAllowedOrigin(request)) {
    return apiError(ctx, { status: 403, code: "INVALID_ORIGIN", message: "Invalid origin" });
  }

  const limited = rateLimit({ ctx, request, key: "admin:videos:review", limit: 120, windowMs: 60_000 });
  if (limited) {
    return limited;
  }

  const auth = await requireApiRole(request, "admin", { ctx });
  if (!auth.ok) {
    return auth.response;
  }

  // Per-user rate limit (stricter, scoped to authenticated admin)
  const userLimited = rateLimit({ ctx, request, key: "admin:videos:review", limit: 120, windowMs: 60_000, userId: auth.session.userId });
  if (userLimited) {
    return userLimited;
  }

  let payload: ReviewVideoPayload;
  try {
    payload = parsePayload(await readJsonBodyWithLimit(request, { maxBytes: 16 * 1024 }));
  } catch (error) {
    const response = apiError(ctx, {
      status: error instanceof Error && error.message === "PAYLOAD_TOO_LARGE" ? 413 : 400,
      code: error instanceof Error && error.message === "PAYLOAD_TOO_LARGE" ? "PAYLOAD_TOO_LARGE" : "BAD_REQUEST",
      message:
        error instanceof Error && error.message === "PAYLOAD_TOO_LARGE"
          ? "Payload trop volumineux."
          : error instanceof Error && error.message === "INVALID_JSON"
            ? "Payload invalide."
            : error instanceof Error
              ? error.message
              : "Invalid payload"
    });
    if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
    return response;
  }

  try {
    const result = await reviewVideoUpload({
      adminUserId: auth.session.userId,
      videoId: payload.videoId,
      decision: payload.decision,
      rejectionReason: payload.rejectionReason
    });

    void writeAdminAuditLog({
      request,
      requestId: ctx.requestId,
      adminUserId: auth.session.userId,
      action: `video.${payload.decision}`,
      entityType: "video",
      entityId: payload.videoId,
      metadata: {
        decision: payload.decision,
        rejectionReason: payload.rejectionReason ?? null
        }
    });

    const response = apiJson(ctx, result, { status: 200 });
    if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
    return response;
  } catch (error) {
    const response = apiError(ctx, { status: 500, code: "INTERNAL", message: "Unable to review video" });
    if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
    return response;
  }
}
