import { NextResponse } from "next/server";

import { getAdminDashboardData } from "@/application/use-cases/get-admin-dashboard-data";
import { requireApiRole } from "@/features/auth/server/api-guards";
import { parseMonthParam } from "@/lib/validation";

export async function GET(request: Request) {
  const auth = await requireApiRole(request, "admin");
  if (!auth.ok) {
    return auth.response;
  }

  const { searchParams } = new URL(request.url);
  let month: string | undefined;
  try {
    month = parseMonthParam(searchParams.get("month"));
  } catch (error) {
    const response = NextResponse.json(
      { message: error instanceof Error ? error.message : "Invalid query params" },
      { status: 400 }
    );
    response.headers.set("x-request-id", auth.requestId);
    return response;
  }

  const data = await getAdminDashboardData({ month });
  const response = NextResponse.json(data);
  response.headers.set("x-request-id", auth.requestId);
  return response;
}
