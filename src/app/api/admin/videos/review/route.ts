import { NextResponse } from "next/server";

import { reviewVideoUpload } from "@/application/use-cases/review-video-upload";
import { requireApiRole } from "@/features/auth/server/api-guards";
import { writeAdminAuditLog } from "@/features/admin/server/admin-audit-log";
import { rateLimit } from "@/lib/rate-limit";
import { getRequestId } from "@/lib/request-id";
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
  const requestId = getRequestId(request);
  const limited = rateLimit({ request, key: "admin:videos:review", limit: 120, windowMs: 60_000 });
  if (limited) {
    limited.headers.set("x-request-id", requestId);
    return limited;
  }

  const auth = await requireApiRole(request, "admin", { requestId });
  if (!auth.ok) {
    return auth.response;
  }

  let payload: ReviewVideoPayload;
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
    const result = await reviewVideoUpload({
      adminUserId: auth.session.userId,
      videoId: payload.videoId,
      decision: payload.decision,
      rejectionReason: payload.rejectionReason
    });

    void writeAdminAuditLog({
      request,
      requestId,
      adminUserId: auth.session.userId,
      action: `video.${payload.decision}`,
      entityType: "video",
      entityId: payload.videoId,
      metadata: {
        decision: payload.decision,
        rejectionReason: payload.rejectionReason ?? null
      }
    });

    const response = NextResponse.json(result, { status: 200 });
    response.headers.set("x-request-id", requestId);
    return response;
  } catch (error) {
    const response = NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to review video" },
      { status: 500 }
    );
    response.headers.set("x-request-id", requestId);
    return response;
  }
}
