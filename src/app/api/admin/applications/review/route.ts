import { NextResponse } from "next/server";

import { reviewCreatorApplication } from "@/application/use-cases/review-creator-application";
import { readBearerToken, resolveAuthSessionFromAccessToken } from "@/features/auth/server/resolve-auth-session";
import { isSafeEntityId } from "@/lib/validation";

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

  if (!userId || !isSafeEntityId(userId)) {
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

  let payload: ReviewPayload;
  try {
    payload = parsePayload(await request.json());
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Invalid payload" },
      { status: 400 }
    );
  }

  try {
    const result = await reviewCreatorApplication(payload);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to review application" },
      { status: 500 }
    );
  }
}

