import { NextResponse } from "next/server";

import { apiError, type ApiContext } from "@/lib/api-response";
import {
  resolveAuthSessionFromAccessToken,
  type AuthRole,
  type ResolvedAuthSession
} from "@/features/auth/server/resolve-auth-session";
import {
  ACCESS_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_NAME,
  clearAuthCookies,
  readCookieFromHeader,
  setAuthCookies
} from "@/features/auth/server/auth-cookies";
import { refreshSupabaseSession } from "@/features/auth/server/auth-refresh";

export type ApiGuardResult =
  | {
      ok: true;
      requestId: string;
      session: ResolvedAuthSession;
      setAuthCookies?: { accessToken: string; refreshToken: string; expiresAt: number | null | undefined };
    }
  | { ok: false; requestId: string; response: NextResponse };

function unauthorized(ctx: ApiContext): NextResponse {
  return apiError(ctx, { status: 401, code: "UNAUTHORIZED", message: "Unauthorized" });
}

function forbidden(ctx: ApiContext): NextResponse {
  return apiError(ctx, { status: 403, code: "FORBIDDEN", message: "Forbidden" });
}

function internal(ctx: ApiContext): NextResponse {
  return apiError(ctx, { status: 500, code: "INTERNAL", message: "Internal server error" });
}

export async function requireApiSession(
  request: Request,
  options: { ctx: ApiContext }
): Promise<ApiGuardResult> {
  const requestId = options.ctx.requestId;
  const cookieHeader = request.headers.get("cookie");
  const accessToken = readCookieFromHeader(cookieHeader, ACCESS_TOKEN_COOKIE_NAME);
  const refreshToken = readCookieFromHeader(cookieHeader, REFRESH_TOKEN_COOKIE_NAME);

  if (!accessToken && !refreshToken) {
    const response = unauthorized(options.ctx);
    clearAuthCookies(response);
    return { ok: false, requestId, response };
  }

  let session: ResolvedAuthSession | null = null;
  try {
    session = await resolveAuthSessionFromAccessToken(accessToken);
  } catch {
    return {
      ok: false,
      requestId,
      response: internal(options.ctx)
    };
  }

  if (session) {
    return { ok: true, requestId, session };
  }

  if (!refreshToken) {
    const response = unauthorized(options.ctx);
    clearAuthCookies(response);
    return { ok: false, requestId, response };
  }

  const refreshed = await refreshSupabaseSession(refreshToken);
  if (!refreshed) {
    const response = unauthorized(options.ctx);
    clearAuthCookies(response);
    return { ok: false, requestId, response };
  }

  let refreshedSession: ResolvedAuthSession | null = null;
  try {
    refreshedSession = await resolveAuthSessionFromAccessToken(refreshed.accessToken);
  } catch {
    const response = internal(options.ctx);
    clearAuthCookies(response);
    return { ok: false, requestId, response };
  }

  if (!refreshedSession) {
    const response = unauthorized(options.ctx);
    clearAuthCookies(response);
    return { ok: false, requestId, response };
  }

  return { ok: true, requestId, session: refreshedSession, setAuthCookies: refreshed };
}

export async function requireApiRole(
  request: Request,
  roles: AuthRole | AuthRole[],
  options: { ctx: ApiContext }
): Promise<ApiGuardResult> {
  const auth = await requireApiSession(request, options);
  if (!auth.ok) {
    return auth;
  }

  const allowed = Array.isArray(roles) ? roles : [roles];
  if (!allowed.includes(auth.session.role)) {
    const response = forbidden(options.ctx);
    if (auth.setAuthCookies) {
      setAuthCookies(response, auth.setAuthCookies);
    }
    return { ok: false, requestId: auth.requestId, response };
  }

  return auth;
}
