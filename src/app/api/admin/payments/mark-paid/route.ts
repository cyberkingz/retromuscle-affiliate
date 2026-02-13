import { markMonthlyTrackingPaid } from "@/application/use-cases/mark-monthly-tracking-paid";
import { requireApiRole } from "@/features/auth/server/api-guards";
import { setAuthCookies } from "@/features/auth/server/auth-cookies";
import { writeAdminAuditLog } from "@/features/admin/server/admin-audit-log";
import { apiError, apiJson, createApiContext } from "@/lib/api-response";
import { isAllowedOrigin } from "@/lib/origin";
import { rateLimit } from "@/lib/rate-limit";
import { readJsonBodyWithLimit } from "@/lib/request-body";
import { isUuid } from "@/lib/validation";

interface MarkPaidPayload {
  monthlyTrackingId: string;
}

function parsePayload(body: unknown): MarkPaidPayload {
  if (!body || typeof body !== "object") {
    throw new Error("Invalid payload");
  }

  const input = body as Record<string, unknown>;
  const monthlyTrackingId = typeof input.monthlyTrackingId === "string" ? input.monthlyTrackingId.trim() : "";

  if (!monthlyTrackingId || !isUuid(monthlyTrackingId)) {
    throw new Error("Invalid monthlyTrackingId");
  }

  return { monthlyTrackingId };
}

export async function POST(request: Request) {
  const ctx = createApiContext(request);
  if (!isAllowedOrigin(request)) {
    return apiError(ctx, { status: 403, code: "INVALID_ORIGIN", message: "Invalid origin" });
  }

  const limited = rateLimit({ ctx, request, key: "admin:payments:mark-paid", limit: 60, windowMs: 60_000 });
  if (limited) {
    return limited;
  }

  const auth = await requireApiRole(request, "admin", { ctx });
  if (!auth.ok) {
    return auth.response;
  }

  // Per-user rate limit (stricter, scoped to authenticated admin)
  const userLimited = rateLimit({ ctx, request, key: "admin:payments:mark-paid", limit: 60, windowMs: 60_000, userId: auth.session.userId });
  if (userLimited) {
    return userLimited;
  }

  let payload: MarkPaidPayload;
  try {
    payload = parsePayload(await readJsonBodyWithLimit(request, { maxBytes: 6 * 1024 }));
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
    const tracking = await markMonthlyTrackingPaid({ monthlyTrackingId: payload.monthlyTrackingId });

    void writeAdminAuditLog({
      request,
      requestId: ctx.requestId,
      adminUserId: auth.session.userId,
      action: "payment.mark_paid",
      entityType: "monthly_tracking",
      entityId: payload.monthlyTrackingId,
      metadata: {
        month: tracking.month,
        creatorId: tracking.creatorId,
        paidAt: tracking.paidAt ?? null
      }
    });

    const response = apiJson(ctx, { tracking }, { status: 200 });
    if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to mark paid";
    const isValidation = message.startsWith("Impossible:");
    const response = apiError(ctx, {
      status: isValidation ? 400 : 500,
      code: isValidation ? "BAD_REQUEST" : "INTERNAL",
      message
    });
    if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
    return response;
  }
}

