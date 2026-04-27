import { reviewBatchSubmission } from "@/application/use-cases/review-batch-submission";
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

interface ReviewBatchPayload {
  batchId: string;
  decision: "approved" | "rejected" | "revision_requested";
  rejectionReason?: string | null;
}

function parsePayload(body: unknown): ReviewBatchPayload {
  if (!body || typeof body !== "object") {
    throw new Error("Invalid payload");
  }

  const input = body as Record<string, unknown>;
  const batchId = typeof input.batchId === "string" ? input.batchId.trim() : "";
  const decision = input.decision;
  const rejectionReason =
    typeof input.rejectionReason === "string" ? input.rejectionReason.trim() : null;

  if (!batchId || !isUuid(batchId)) {
    throw new Error("Invalid batchId");
  }
  if (decision !== "approved" && decision !== "rejected" && decision !== "revision_requested") {
    throw new Error("Invalid decision");
  }
  if ((decision === "revision_requested" || decision === "rejected") && !rejectionReason) {
    throw new Error("rejectionReason is required when rejecting or requesting a revision");
  }
  if (rejectionReason && rejectionReason.length > 2000) {
    throw new Error("rejectionReason is too long");
  }

  return { batchId, decision, rejectionReason };
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
    limit: 120,
    windowMs: 60_000
  });
  if (limited) return limited;

  const auth = await requireApiRole(request, "admin", { ctx });
  if (!auth.ok) return auth.response;

  const userLimited = await rateLimit({
    ctx,
    request,
    key: "admin:videos:review-batch",
    limit: 120,
    windowMs: 60_000,
    userId: auth.session.userId
  });
  if (userLimited) return userLimited;

  let payload: ReviewBatchPayload;
  try {
    payload = parsePayload(await readJsonBodyWithLimit(request, { maxBytes: 16 * 1024 }));
  } catch (error) {
    const response = handleBodyParseError(ctx, error);
    if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
    return response;
  }

  try {
    const result = await reviewBatchSubmission({
      adminUserId: auth.session.userId,
      batchId: payload.batchId,
      decision: payload.decision,
      rejectionReason: payload.rejectionReason
    });

    // Fire-and-forget creator email notification
    getRepository()
      .getCreatorById(result.batch.creatorId)
      .then((creator) => {
        if (!creator) return;
        if (payload.decision === "approved") {
          return sendVideoApprovedEmail({
            to: creator.email,
            creatorName: creator.displayName,
            videoType: result.batch.videoType
          });
        }
        if (payload.decision === "rejected") {
          return sendVideoRejectedEmail({
            to: creator.email,
            creatorName: creator.displayName,
            videoType: result.batch.videoType,
            reason: payload.rejectionReason
          });
        }
        return sendVideoRevisionRequestedEmail({
          to: creator.email,
          creatorName: creator.displayName,
          videoType: result.batch.videoType,
          revisionNote: payload.rejectionReason ?? ""
        });
      })
      .catch(console.error);

    writeAdminAuditLog({
      request,
      requestId: ctx.requestId,
      adminUserId: auth.session.userId,
      action: `batch.${payload.decision}`,
      entityType: "batch_submission",
      entityId: payload.batchId,
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
    const isNotFound = error instanceof Error && error.message.includes("not found");

    const response = apiError(ctx, {
      status: isConflict ? 409 : isNotFound ? 404 : 500,
      code: isConflict ? "BAD_REQUEST" : isNotFound ? "NOT_FOUND" : "INTERNAL",
      message:
        isConflict || isNotFound
          ? (error as Error).message
          : "Unable to review batch submission"
    });
    if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
    return response;
  }
}
