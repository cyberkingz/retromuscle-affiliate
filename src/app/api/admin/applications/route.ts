import { NextResponse } from "next/server";

import { getAdminApplicationsData } from "@/application/use-cases/get-admin-applications-data";
import { readBearerToken, resolveAuthSessionFromAccessToken } from "@/features/auth/server/resolve-auth-session";
import type { ApplicationStatus } from "@/domain/types";

function isApplicationStatus(value: unknown): value is ApplicationStatus {
  return value === "draft" || value === "pending_review" || value === "approved" || value === "rejected";
}

export async function GET(request: Request) {
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

  const { searchParams } = new URL(request.url);
  const rawStatus = searchParams.get("status")?.trim();
  const status = rawStatus && isApplicationStatus(rawStatus) ? rawStatus : undefined;

  const data = await getAdminApplicationsData({ status });
  return NextResponse.json(data);
}

