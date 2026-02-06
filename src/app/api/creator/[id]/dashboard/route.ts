import { NextResponse } from "next/server";

import { getCreatorDashboardData } from "@/application/use-cases/get-creator-dashboard-data";
import {
  findCreatorIdForUser,
  type ResolvedAuthSession
} from "@/features/auth/server/resolve-auth-session";
import { requireApiSession } from "@/features/auth/server/api-guards";
import { isUuid, parseMonthParam } from "@/lib/validation";

interface RouteContext {
  params: {
    id: string;
  };
}

function safeMessage(error: unknown, fallback: string) {
  if (process.env.NODE_ENV !== "production" && error instanceof Error) {
    return error.message;
  }
  return fallback;
}

function jsonWithRequestId(requestId: string, status: number, body: Record<string, unknown>) {
  const response = NextResponse.json(body, { status });
  response.headers.set("x-request-id", requestId);
  return response;
}

export async function GET(request: Request, context: RouteContext) {
  const auth = await requireApiSession(request);
  if (!auth.ok) {
    return auth.response;
  }

  const authSession: ResolvedAuthSession = auth.session;
  if (authSession.role !== "admin" && authSession.target !== "/dashboard") {
    return jsonWithRequestId(auth.requestId, 403, { message: "Forbidden" });
  }

  const creatorId = context.params.id?.trim();
  if (!creatorId || !isUuid(creatorId)) {
    return jsonWithRequestId(auth.requestId, 400, { message: "Invalid creator id" });
  }

  if (authSession.role !== "admin") {
    let ownCreatorId: string | null = null;
    try {
      ownCreatorId = await findCreatorIdForUser({ userId: authSession.userId, email: authSession.email });
    } catch {
      return jsonWithRequestId(auth.requestId, 500, { message: "Unable to resolve creator mapping" });
    }

    if (!ownCreatorId || ownCreatorId !== creatorId) {
      return jsonWithRequestId(auth.requestId, 403, { message: "Forbidden" });
    }
  }

  const { searchParams } = new URL(request.url);
  let month: string | undefined;
  try {
    month = parseMonthParam(searchParams.get("month"));
  } catch (error) {
    return jsonWithRequestId(auth.requestId, 400, { message: safeMessage(error, "Invalid query params") });
  }

  try {
    const data = await getCreatorDashboardData({ creatorId, month });
    const response = NextResponse.json(data);
    response.headers.set("x-request-id", auth.requestId);
    return response;
  } catch (error) {
    const message = safeMessage(error, "Unable to load dashboard");
    const status = error instanceof Error && error.message.toLowerCase().includes("not found") ? 404 : 500;
    return jsonWithRequestId(auth.requestId, status, { message });
  }
}
