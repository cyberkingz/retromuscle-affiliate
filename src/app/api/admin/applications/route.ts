import { getAdminApplicationsData } from "@/application/use-cases/get-admin-applications-data";
import { requireApiRole } from "@/features/auth/server/api-guards";
import type { ApplicationStatus } from "@/domain/types";
import { setAuthCookies } from "@/features/auth/server/auth-cookies";
import { apiError, apiJson, createApiContext } from "@/lib/api-response";

function isApplicationStatus(value: unknown): value is ApplicationStatus {
  return value === "draft" || value === "pending_review" || value === "approved" || value === "rejected";
}

export async function GET(request: Request) {
  const ctx = createApiContext(request);
  const auth = await requireApiRole(request, "admin", { ctx });
  if (!auth.ok) {
    return auth.response;
  }

  const { searchParams } = new URL(request.url);
  const rawStatus = searchParams.get("status")?.trim();
  if (rawStatus && !isApplicationStatus(rawStatus)) {
    const response = apiError(ctx, { status: 400, code: "BAD_REQUEST", message: "Invalid status" });
    if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
    return response;
  }

  const status = rawStatus ? (rawStatus as ApplicationStatus) : undefined;

  const data = await getAdminApplicationsData({ status });
  const response = apiJson(ctx, data, { status: 200 });
  if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
  return response;
}
