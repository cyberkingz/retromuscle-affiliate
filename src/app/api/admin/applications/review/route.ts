import { NextResponse } from "next/server";

import { reviewCreatorApplication } from "@/application/use-cases/review-creator-application";
import { requireApiRole } from "@/features/auth/server/api-guards";
import { writeAdminAuditLog } from "@/features/admin/server/admin-audit-log";
import { rateLimit } from "@/lib/rate-limit";
import { getRequestId } from "@/lib/request-id";
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
  const requestId = getRequestId(request);
  const limited = rateLimit({ request, key: "admin:applications:review", limit: 60, windowMs: 60_000 });
  if (limited) {
    limited.headers.set("x-request-id", requestId);
    return limited;
  }

  const auth = await requireApiRole(request, "admin", { requestId });
  if (!auth.ok) {
    return auth.response;
  }

  let payload: ReviewPayload;
  try {
    payload = parsePayload(await request.json());
  } catch (error) {
    const response = NextResponse.json(
      { message: error instanceof Error ? error.message : "Invalid payload" },
      { status: 400 }
    );
    response.headers.set("x-request-id", requestId);
    return response;
  }

  try {
    const result = await reviewCreatorApplication(payload);
    void writeAdminAuditLog({
      request,
      requestId,
      adminUserId: auth.session.userId,
      action: `application.${payload.decision}`,
      entityType: "creator_application",
      entityId: payload.userId,
      metadata: {
        decision: payload.decision,
        notes: payload.reviewNotes ?? null
      }
    });

    const response = NextResponse.json(result, { status: 200 });
    response.headers.set("x-request-id", requestId);
    return response;
  } catch (error) {
    const response = NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to review application" },
      { status: 500 }
    );
    response.headers.set("x-request-id", requestId);
    return response;
  }
}
