import { NextResponse } from "next/server";

import { getAdminDashboardData } from "@/application/use-cases/get-admin-dashboard-data";
import { readBearerToken, resolveAuthSessionFromAccessToken } from "@/features/auth/server/resolve-auth-session";
import { parseMonthParam } from "@/lib/validation";

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
  let month: string | undefined;
  try {
    month = parseMonthParam(searchParams.get("month"));
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Invalid query params" },
      { status: 400 }
    );
  }

  const data = await getAdminDashboardData({ month });
  return NextResponse.json(data);
}
