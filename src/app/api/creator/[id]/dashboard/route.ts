import { NextResponse } from "next/server";

import { getCreatorDashboardData } from "@/application/use-cases/get-creator-dashboard-data";
import {
  findCreatorIdForUser,
  readBearerToken,
  resolveAuthSessionFromAccessToken
} from "@/features/auth/server/resolve-auth-session";
import { isSafeEntityId, parseMonthParam } from "@/lib/validation";

interface RouteContext {
  params: {
    id: string;
  };
}

export async function GET(request: Request, context: RouteContext) {
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
  if (authSession.role !== "admin" && authSession.target !== "/dashboard") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const creatorId = context.params.id?.trim();
  if (!creatorId || !isSafeEntityId(creatorId)) {
    return NextResponse.json({ message: "Invalid creator id" }, { status: 400 });
  }

  if (authSession.role !== "admin") {
    let ownCreatorId: string | null = null;
    try {
      ownCreatorId = await findCreatorIdForUser({ userId: authSession.userId, email: authSession.email });
    } catch {
      return NextResponse.json({ message: "Unable to resolve creator mapping" }, { status: 500 });
    }

    if (!ownCreatorId || ownCreatorId !== creatorId) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
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

  try {
    const data = await getCreatorDashboardData({ creatorId, month });
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message.includes("not found") ? 404 : 500;
    return NextResponse.json(
      {
        message
      },
      { status }
    );
  }
}
