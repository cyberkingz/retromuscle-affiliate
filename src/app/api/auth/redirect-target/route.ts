import { NextResponse } from "next/server";

import {
  readBearerToken,
  resolveAuthSessionFromAccessToken
} from "@/features/auth/server/resolve-auth-session";

export async function GET(request: Request) {
  const token = readBearerToken(request.headers.get("authorization"));
  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const session = await resolveAuthSessionFromAccessToken(token);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ role: session.role, target: session.target });
  } catch {
    return NextResponse.json({ message: "Unable to resolve auth target" }, { status: 500 });
  }
}
