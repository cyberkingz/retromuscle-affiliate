import { NextResponse } from "next/server";

import { getRequestId } from "@/lib/request-id";
import {
  readBearerToken,
  resolveAuthSessionFromAccessToken,
  type AuthRole,
  type ResolvedAuthSession
} from "@/features/auth/server/resolve-auth-session";

export type ApiGuardResult =
  | { ok: true; requestId: string; session: ResolvedAuthSession }
  | { ok: false; requestId: string; response: NextResponse };

function respond(requestId: string, status: number, body: Record<string, unknown>) {
  const response = NextResponse.json(body, { status });
  response.headers.set("x-request-id", requestId);
  return response;
}

export async function requireApiSession(
  request: Request,
  options?: { requestId?: string }
): Promise<ApiGuardResult> {
  const requestId = options?.requestId ?? getRequestId(request);
  const token = readBearerToken(request.headers.get("authorization"));

  if (!token) {
    return { ok: false, requestId, response: respond(requestId, 401, { message: "Unauthorized" }) };
  }

  let session: ResolvedAuthSession | null = null;
  try {
    session = await resolveAuthSessionFromAccessToken(token);
  } catch {
    return { ok: false, requestId, response: respond(requestId, 500, { message: "Unable to resolve auth session" }) };
  }

  if (!session) {
    return { ok: false, requestId, response: respond(requestId, 401, { message: "Unauthorized" }) };
  }

  return { ok: true, requestId, session };
}

export async function requireApiRole(
  request: Request,
  roles: AuthRole | AuthRole[],
  options?: { requestId?: string }
): Promise<ApiGuardResult> {
  const auth = await requireApiSession(request, options);
  if (!auth.ok) {
    return auth;
  }

  const allowed = Array.isArray(roles) ? roles : [roles];
  if (!allowed.includes(auth.session.role)) {
    return { ok: false, requestId: auth.requestId, response: respond(auth.requestId, 403, { message: "Forbidden" }) };
  }

  return auth;
}
