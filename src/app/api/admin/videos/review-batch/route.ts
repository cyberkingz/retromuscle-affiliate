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

interface ReviewBatchPayload {
  videoIds: string[];
  decision: "approved" | "rejected" | "revision_requested";
  rejectionReason: string | null;
}

interface ReviewBatchResult {
  videoId: string;
  ok: boolean;
  error?: string;
}

function sanitizeBatchError(error: unknown): string {
  if (!(error instanceof Error)) {
    return "Review impossible";
  }

  const raw = error.message.toLowerCase();
  if (raw.includes("not found")) {
    return "Video introuvable";
  }
  if (raw.includes("invalid status")) {
    return "Statut de review invalide";
  }
  if (raw.includes("already approved")) {
    return "Vidéo déjà approuvée";
  }

  return "Review impossible";
}

function parsePayload(body: unknown): ReviewBatchPayload {
  if (!body || typeof body !== "object") {
    throw new Error("Invalid payload");
  }

  const input = body as Record<string, unknown>;
  const { decision, rejectionReason } = parseReviewDecision(input);

  if (!Array.isArray(input.videoIds) || input.videoIds.length === 0) {
    throw new Error("videoIds must be a non-empty array");
  }

  if (input.videoIds.length > 100) {
    throw new Error("videoIds must contain at most 100 entries");
  }

  const videoIds: string[] = [];
  for (const raw of input.videoIds) {
    if (typeof raw !== "string") {
      throw new Error("Each videoId must be a string");
    }
    const trimmed = raw.trim();
    if (!trimmed || !isUuid(trimmed)) {
      throw new Error(`Invalid videoId: ${trimmed}`);
    }
    videoIds.push(trimmed);
  }

  return { videoIds, decision, rejectionReason };
}

export async function POST(request: Request) {
  const ctx = createApiContext(request);
  if (!isAllowedOrigin(request)) {
    return apiError(ctx, { status: 403, code: "INVALID_ORIGIN", message: "Invalid origin" });
  }

  const limited = await rateLimit({
    ctx,
    request,
    key: "admin:videos:review-batch",
    limit: 30,
    windowMs: 60_000
  });
  if (limited) {
    return limited;
  }

  const auth = await requireApiRole(request, "admin", { ctx });
  if (!auth.ok) {
    return auth.response;
  }

  const userLimited = await rateLimit({
    ctx,
    request,
    key: "admin:videos:review-batch",
    limit: 30,
    windowMs: 60_000,
    userId: auth.session.userId
  });
  if (userLimited) {
    return userLimited;
  }

  let payload: ReviewBatchPayload;
  try {
    payload = parsePayload(await readJsonBodyWithLimit(request, { maxBytes: 64 * 1024 }));
  } catch (error) {
    const response = handleBodyParseError(ctx, error);
    if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
    return response;
  }

  const results: ReviewBatchResult[] = [];

  for (const videoId of payload.videoIds) {
    try {
      const result = await reviewVideoUpload({
        adminUserId: auth.session.userId,
        videoId,
        decision: payload.decision,
        rejectionReason: payload.rejectionReason
      });

      // Fire-and-forget creator email notification
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
        entityId: videoId,
        metadata: {
          decision: payload.decision,
          rejectionReason: payload.rejectionReason ?? null,
          batch: true
        }
      }).catch(console.error);

      results.push({ videoId, ok: true });
    } catch (caught) {
      results.push({
        videoId,
        ok: false,
        error: sanitizeBatchError(caught)
      });
    }
  }

  const response = apiJson(ctx, { results }, { status: 200 });
  if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
  return response;
}
