import { NextResponse } from "next/server";

import { getAdminApplicationsData } from "@/application/use-cases/get-admin-applications-data";
import { requireApiRole } from "@/features/auth/server/api-guards";
import type { ApplicationStatus } from "@/domain/types";

function isApplicationStatus(value: unknown): value is ApplicationStatus {
  return value === "draft" || value === "pending_review" || value === "approved" || value === "rejected";
}

export async function GET(request: Request) {
  const auth = await requireApiRole(request, "admin");
  if (!auth.ok) {
    return auth.response;
  }

  const { searchParams } = new URL(request.url);
  const rawStatus = searchParams.get("status")?.trim();
  const status = rawStatus && isApplicationStatus(rawStatus) ? rawStatus : undefined;

  const data = await getAdminApplicationsData({ status });
  const response = NextResponse.json(data);
  response.headers.set("x-request-id", auth.requestId);
  return response;
}
