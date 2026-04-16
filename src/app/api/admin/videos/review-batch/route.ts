import { reviewVideoUpload } from "@/application/use-cases/review-video-upload";
import { requireApiRole } from "@/features/auth/server/api-guards";
import { setAuthCookies } from "@/features/auth/server/auth-cookies";
import { writeAdminAuditLog } from "@/features/admin/server/admin-audit-log";
import { apiError, apiJson, createApiContext, handleBodyParseError } from "@/lib/api-response";
import { isAllowedOrigin } from "@/lib/origin";
import { rateLimit } from "@/lib/rate-limit";
import { readJsonBodyWithLimit } from "@/lib/request-body";
import { isUuid } from "@/lib/validation";

interface ReviewBatchPayload {
  videoIds: string[];
  decision: "approved" | "rejected";
  rejectionReason?: string | null;
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
  const decision = input.decision;
  const rejectionReason =
    typeof input.rejectionReason === "string" ? input.rejectionReason.trim() : null;

  if (decision !== "approved" && decision !== "rejected") {
    throw new Error("Invalid decision");
  }

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

  if (rejectionReason && rejectionReason.length > 2000) {
    throw new Error("rejectionReason is too long");
  }

  return {
    videoIds,
    decision,
    rejectionReason
  };
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
      await reviewVideoUpload({
        adminUserId: auth.session.userId,
        videoId,
        decision: payload.decision,
        rejectionReason: payload.rejectionReason
      });

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
