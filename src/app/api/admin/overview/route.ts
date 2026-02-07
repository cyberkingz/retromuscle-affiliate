import { getAdminDashboardData } from "@/application/use-cases/get-admin-dashboard-data";
import { requireApiRole } from "@/features/auth/server/api-guards";
import { setAuthCookies } from "@/features/auth/server/auth-cookies";
import { apiError, apiJson, createApiContext } from "@/lib/api-response";
import { parseMonthParam } from "@/lib/validation";

export async function GET(request: Request) {
  const ctx = createApiContext(request);
  const auth = await requireApiRole(request, "admin", { ctx });
  if (!auth.ok) {
    return auth.response;
  }

  const { searchParams } = new URL(request.url);
  let month: string | undefined;
  try {
    month = parseMonthParam(searchParams.get("month"));
  } catch (error) {
    const response = apiError(ctx, {
      status: 400,
      code: "BAD_REQUEST",
      message: error instanceof Error ? error.message : "Invalid query params"
    });
    if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
    return response;
  }

  const data = await getAdminDashboardData({ month });
  const response = apiJson(ctx, data, { status: 200 });
  if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
  return response;
}
