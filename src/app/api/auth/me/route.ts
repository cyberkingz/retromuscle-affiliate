import { refreshSupabaseSession } from "@/features/auth/server/auth-refresh";
import {
  ACCESS_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_NAME,
  clearAuthCookies,
  readCookieFromHeader,
  setAuthCookies
} from "@/features/auth/server/auth-cookies";
import { resolveAuthSessionFromAccessToken } from "@/features/auth/server/resolve-auth-session";
import { apiJson, createApiContext } from "@/lib/api-response";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(request: Request) {
  const ctx = createApiContext(request);
  const limited = await rateLimit({ ctx, request, key: "auth:me", limit: 60, windowMs: 60_000 });
  if (limited) return limited;

  const cookieHeader = request.headers.get("cookie");
  const accessToken = readCookieFromHeader(cookieHeader, ACCESS_TOKEN_COOKIE_NAME);
  const refreshToken = readCookieFromHeader(cookieHeader, REFRESH_TOKEN_COOKIE_NAME);

  let session = await resolveAuthSessionFromAccessToken(accessToken);
  let refreshed: {
    accessToken: string;
    refreshToken: string;
    expiresAt: number | null | undefined;
  } | null = null;

  if (!session && refreshToken) {
    refreshed = await refreshSupabaseSession(refreshToken);
    if (refreshed) {
      session = await resolveAuthSessionFromAccessToken(refreshed.accessToken);
    }
  }

  const response = apiJson(
    ctx,
    session
      ? {
          user: { id: session.userId, email: session.email ?? null },
          role: session.role,
          target: session.target
        }
      : { user: null, role: null, target: null },
    { status: 200 }
  );

  if (refreshed) {
    setAuthCookies(response, refreshed);
  } else if (!session && (accessToken || refreshToken)) {
    // Avoid keeping stale cookies around.
    clearAuthCookies(response);
  }

  return response;
}
