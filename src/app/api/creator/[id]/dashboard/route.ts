import { getCreatorDashboardData } from "@/application/use-cases/get-creator-dashboard-data";
import {
  findCreatorIdForUser,
  type ResolvedAuthSession
} from "@/features/auth/server/resolve-auth-session";
import { requireApiSession } from "@/features/auth/server/api-guards";
import { setAuthCookies } from "@/features/auth/server/auth-cookies";
import { apiError, apiJson, createApiContext } from "@/lib/api-response";
import { isUuid, parseMonthParam } from "@/lib/validation";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: Request, context: RouteContext) {
  const ctx = createApiContext(request);
  const auth = await requireApiSession(request, { ctx });
  if (!auth.ok) {
    return auth.response;
  }

  const authSession: ResolvedAuthSession = auth.session;
  if (authSession.role !== "admin" && authSession.target !== "/dashboard") {
    const response = apiError(ctx, { status: 403, code: "FORBIDDEN", message: "Forbidden" });
    if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
    return response;
  }

  const creatorId = (await context.params).id?.trim();
  if (!creatorId || !isUuid(creatorId)) {
    const response = apiError(ctx, { status: 400, code: "BAD_REQUEST", message: "Invalid creator id" });
    if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
    return response;
  }

  if (authSession.role !== "admin") {
    let ownCreatorId: string | null = null;
    try {
      ownCreatorId = await findCreatorIdForUser({ userId: authSession.userId, email: authSession.email });
    } catch {
      const response = apiError(ctx, { status: 500, code: "INTERNAL", message: "Unable to resolve creator mapping" });
      if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
      return response;
    }

    if (!ownCreatorId || ownCreatorId !== creatorId) {
      const response = apiError(ctx, { status: 403, code: "FORBIDDEN", message: "Forbidden" });
      if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
      return response;
    }
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

  try {
    const data = await getCreatorDashboardData({ creatorId, month });
    const response = apiJson(ctx, data, { status: 200 });
    if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
    return response;
  } catch (error) {
    const status = error instanceof Error && error.message.toLowerCase().includes("not found") ? 404 : 500;
    const response = apiError(ctx, {
      status,
      code: status === 404 ? "NOT_FOUND" : "INTERNAL",
      message: status === 404 ? "Not found" : "Unable to load dashboard"
    });
    if (auth.setAuthCookies) setAuthCookies(response, auth.setAuthCookies);
    return response;
  }
}
