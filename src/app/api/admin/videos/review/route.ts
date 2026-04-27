import { reviewVideoUpload } from "@/application/use-cases/review-video-upload";
import { getRepository } from "@/application/dependencies";
import {
  sendVideoApprovedEmail,
  sendVideoRejectedEmail,
  sendVideoRevisionRequestedEmail
} from "@/infrastructure/email/send-emails";
import { requireApiRole } from "@/features/auth/server/api-guards";
import { setAuthCookies } from "@/features/auth/server/auth-cookies";
import { writeAdminAuditLog } from "@/features/admin/server/admin-audit-log";
import { apiError, apiJson, createApiContext, handleBodyParseError } from "@/lib/api-response";
import { isAllowedOrigin } from "@/lib/origin";
import { rateLimit } from "@/lib/rate-limit";
import { readJsonBodyWithLimit } from "@/lib/request-body";
import { isUuid } from "@/lib/validation";
import { parseReviewDecision } from "../_parse-review-decision";

interface ReviewVideoPayload {
  videoId: string;
  decision: "approved" | "rejected" | "revision_requested";
  rejectionReason: string | null;
}

function parsePayload(body: unknown): ReviewVideoPayload {
  if (!body || typeof body !== "object") {
    throw new Error("Invalid payload");
  }

  const input = body as Record<string, unknown>;
  const videoId = typeof input.videoId === "string" ? input.videoId.trim() : "";

  if (!videoId || !isUuid(videoId)) {
    throw new Error("Invalid videoId");
  }

  const { decision, rejectionReason } = parseReviewDecision(input);
  return { videoId, decision, rejectionReason };
}

export async function POST(request: Request) {
  const ctx = createApiContext(request);
  if (!isAllowedOrigin(request)) {
    return apiError(ctx, { status: 403, code: "INVALID_ORIGIN", message: "Invalid origin" });
  }

  const limited = await rateLimit({
    ctx,
    request,
    key: "admin:videos:review",
    limit: 120,
    windowMs: 60_000
  });
  if (limited) {
    return limited;
  }

  const auth = await requireApiRole(request, "admin", { ctx });
  if (!auth.ok) {
    return auth.response;
  }

  // Per-user rate limit (stricter, scoped to authenticated admin)
  const userLimited = await rateLimit({
    ctx,
    request,
    key: "admin:videos:review",
    limit: 120,
    windowMs: 60_000,
    userId: auth.session.userId
  });
  if (userLimited) {
    return userLimited;
  }

  let payload: ReviewVideoPayload;
  try {
    payload = parsePayload(await readJsonBodyWithLimit(request, { maxBytes: 16 * 1024 }));
  } catch (error) {
    const response = handleBodyParseError(ctx, error);
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

    // Fire-and-forget email to creator for all review decisions
    getRepository()
      .getCreatorById(result.video.creatorId)
      .then((creator) => {
        if (!creator) return;
        if (payload.decision === "approved") {
          return sendVideoApprovedEmail({
            to: creator.email,
            creatorName: creator.displayName,
            videoType: result.video.videoType
          });
        }
        if (payload.decision === "rejected") {
          return sendVideoRejectedEmail({
            to: creator.email,
            creatorName: creator.displayName,
            videoType: result.video.videoType,
            reason: payload.rejectionReason
          });
        }
        return sendVideoRevisionRequestedEmail({
          to: creator.email,
          creatorName: creator.displayName,
          videoType: result.video.videoType,
          revisionNote: payload.rejectionReason ?? ""
        });
      })
      .catch(console.error);

    writeAdminAuditLog({
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
    }).catch(console.error);

    const response = apiJson(ctx, result, { status: 200 });
    if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
    return response;
  } catch (error) {
    const isConflict =
      error instanceof Error &&
      (error.message.includes("already approved") || error.message.includes("Cannot change status"));
    const response = apiError(ctx, {
      status: isConflict ? 409 : 500,
      code: isConflict ? "BAD_REQUEST" : "INTERNAL",
      message: isConflict ? error.message : "Unable to review video"
    });
    if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
    return response;
  }
}
