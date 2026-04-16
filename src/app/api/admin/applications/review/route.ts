import {
  reviewCreatorApplication,
  ReviewCreatorApplicationError
} from "@/application/use-cases/review-creator-application";
import {
  sendApplicationApprovedEmail,
  sendApplicationRejectedEmail
} from "@/infrastructure/email/send-emails";
import { requireApiRole } from "@/features/auth/server/api-guards";
import { setAuthCookies } from "@/features/auth/server/auth-cookies";
import { writeAdminAuditLog } from "@/features/admin/server/admin-audit-log";
import { apiError, apiJson, createApiContext, handleBodyParseError } from "@/lib/api-response";
import { isAllowedOrigin } from "@/lib/origin";
import { rateLimit } from "@/lib/rate-limit";
import { readJsonBodyWithLimit } from "@/lib/request-body";
import { isUuid } from "@/lib/validation";

interface ReviewPayload {
  userId: string;
  decision: "approved" | "rejected";
  reviewNotes?: string | null;
}

function parsePayload(body: unknown): ReviewPayload {
  if (!body || typeof body !== "object") {
    throw new Error("Invalid payload");
  }

  const input = body as Record<string, unknown>;
  const userId = typeof input.userId === "string" ? input.userId.trim() : "";
  const decision = input.decision;
  const reviewNotes = typeof input.reviewNotes === "string" ? input.reviewNotes.trim() : null;

  if (!userId || !isUuid(userId)) {
    throw new Error("Invalid userId");
  }
  if (decision !== "approved" && decision !== "rejected") {
    throw new Error("Invalid decision");
  }
  if (decision === "rejected" && !reviewNotes) {
    throw new Error("reviewNotes is required when rejecting");
  }
  if (reviewNotes && reviewNotes.length > 2000) {
    throw new Error("reviewNotes is too long");
  }

  return {
    userId,
    decision,
    reviewNotes
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
    key: "admin:applications:review",
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

  // Per-user rate limit (stricter, scoped to authenticated admin)
  const userLimited = await rateLimit({
    ctx,
    request,
    key: "admin:applications:review",
    limit: 60,
    windowMs: 60_000,
    userId: auth.session.userId
  });
  if (userLimited) {
    return userLimited;
  }

  let payload: ReviewPayload;
  try {
    payload = parsePayload(await readJsonBodyWithLimit(request, { maxBytes: 16 * 1024 }));
  } catch (error) {
    const response = handleBodyParseError(ctx, error);
    if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
    return response;
  }

  try {
    const result = await reviewCreatorApplication(payload);

    // Fire-and-forget — email failure must never break the review flow
    if (payload.decision === "approved") {
      sendApplicationApprovedEmail({
        to: result.application.email,
        fullName: result.application.fullName
      }).catch(console.error);
    } else {
      sendApplicationRejectedEmail({
        to: result.application.email,
        fullName: result.application.fullName,
        notes: payload.reviewNotes
      }).catch(console.error);
    }

    writeAdminAuditLog({
      request,
      requestId: ctx.requestId,
      adminUserId: auth.session.userId,
      action: `application.${payload.decision}`,
      entityType: "creator_application",
      entityId: payload.userId,
      metadata: {
        decision: payload.decision,
        notes: payload.reviewNotes ?? null
      }
    }).catch(console.error);

    const response = apiJson(ctx, result, { status: 200 });
    if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
    return response;
  } catch (error) {
    if (error instanceof ReviewCreatorApplicationError) {
      const mapped = (() => {
        switch (error.code) {
          case "APPLICATION_NOT_FOUND":
            return { status: 404 as const, code: "NOT_FOUND" as const };
          case "APPLICATION_ALREADY_REVIEWED":
            return { status: 409 as const, code: "BAD_REQUEST" as const };
          case "INVALID_APPLICATION_STATE":
            return { status: 400 as const, code: "BAD_REQUEST" as const };
          case "HANDLE_CONFLICT":
          case "EMAIL_CONFLICT":
            return { status: 409 as const, code: "BAD_REQUEST" as const };
          default:
            return { status: 400 as const, code: "BAD_REQUEST" as const };
        }
      })();

      const response = apiError(ctx, {
        status: mapped.status,
        code: mapped.code,
        message: error.message
      });
      if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
      return response;
    }

    // eslint-disable-next-line no-console
    console.error("[admin/applications/review] unexpected error", {
      requestId: ctx.requestId,
      error
    });

    const response = apiError(ctx, {
      status: 500,
      code: "INTERNAL",
      message: "Unable to review application"
    });
    if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
    return response;
  }
}
