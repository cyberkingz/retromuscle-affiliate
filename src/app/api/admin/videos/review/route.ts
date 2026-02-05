import { NextResponse } from "next/server";

import { reviewVideoUpload } from "@/application/use-cases/review-video-upload";
import { readBearerToken, resolveAuthSessionFromAccessToken } from "@/features/auth/server/resolve-auth-session";
import { isSafeEntityId } from "@/lib/validation";

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

  if (!videoId || !isSafeEntityId(videoId)) {
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
  const token = readBearerToken(request.headers.get("authorization"));
  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  let authSession: Awaited<ReturnType<typeof resolveAuthSessionFromAccessToken>>;
  try {
    authSession = await resolveAuthSessionFromAccessToken(token);
  } catch {
    return NextResponse.json({ message: "Unable to resolve auth session" }, { status: 500 });
  }

  if (!authSession) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  if (authSession.role !== "admin") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  let payload: ReviewVideoPayload;
  try {
    payload = parsePayload(await request.json());
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Invalid payload" },
      { status: 400 }
    );
  }

  try {
    const result = await reviewVideoUpload({
      adminUserId: authSession.userId,
      videoId: payload.videoId,
      decision: payload.decision,
      rejectionReason: payload.rejectionReason
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to review video" },
      { status: 500 }
    );
  }
}

