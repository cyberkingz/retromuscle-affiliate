import { NextResponse, type NextRequest } from "next/server";

import {
  ACCESS_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_NAME,
  clearAuthCookies,
  setAuthCookies
} from "@/features/auth/server/auth-cookies";

function isSupabaseGuardEnabled() {
  return (
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) &&
    Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)
  );
}

function readCookie(request: NextRequest, name: string): string | null {
  const value = request.cookies.get(name)?.value?.trim();
  if (!value || value.length > 4096) {
    return null;
  }
  return value;
}

function isProtectedPath(pathname: string): boolean {
  return (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/uploads") ||
    pathname.startsWith("/payouts") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/contract") ||
    pathname.startsWith("/onboarding")
  );
}

function isPublicAuthPath(pathname: string): boolean {
  return pathname === "/apply" || pathname === "/login";
}

function redirectTo(request: NextRequest, pathname: string) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  return NextResponse.redirect(url);
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split(".");
  if (parts.length < 2) {
    return null;
  }

  const base64 = parts[1]!.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");

  try {
    const json = atob(padded);
    const payload = JSON.parse(json) as unknown;
    return payload && typeof payload === "object" ? (payload as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function isExpiringSoon(accessToken: string): boolean {
  const payload = decodeJwtPayload(accessToken);
  const exp = typeof payload?.exp === "number" ? payload.exp : null;
  if (!exp) {
    return false;
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  return exp - nowSeconds <= 90;
}

export async function middleware(request: NextRequest) {
  if (!isSupabaseGuardEnabled()) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;
  const protectedPath = isProtectedPath(pathname);
  const publicAuthPath = isPublicAuthPath(pathname);
  const accessToken = readCookie(request, ACCESS_TOKEN_COOKIE_NAME);
  const refreshToken = readCookie(request, REFRESH_TOKEN_COOKIE_NAME);

  // Try to refresh when the access token is missing or close to expiration.
  let refreshed: { accessToken: string; refreshToken: string; expiresAt: number | null | undefined } | null = null;

  if ((!accessToken || isExpiringSoon(accessToken)) && refreshToken) {
    try {
      const { refreshSupabaseSession } = await import("@/features/auth/server/auth-refresh");
      refreshed = await refreshSupabaseSession(refreshToken);
    } catch {
      refreshed = null;
    }
  }

  const effectiveAccessToken = refreshed?.accessToken ?? accessToken;
  const hasSession = Boolean(effectiveAccessToken);

  if (!hasSession) {
    if (protectedPath) {
      return redirectTo(request, "/login");
    }

    return NextResponse.next();
  }

  if (publicAuthPath) {
    const response = redirectTo(request, "/onboarding");
    if (refreshed) {
      setAuthCookies(response, refreshed);
    }
    return response;
  }

  const response = NextResponse.next();

  if (refreshed) {
    setAuthCookies(response, refreshed);
  }

  // If refresh failed and we had no valid access token, clear cookies to avoid loops.
  if ((!accessToken || isExpiringSoon(accessToken)) && refreshToken && !refreshed) {
    if (protectedPath) {
      const redirect = redirectTo(request, "/login");
      clearAuthCookies(redirect);
      return redirect;
    }
    clearAuthCookies(response);
  }

  return response;
}

export const config = {
  matcher: [
    "/apply",
    "/login",
    "/onboarding/:path*",
    "/contract/:path*",
    "/dashboard/:path*",
    "/uploads/:path*",
    "/payouts/:path*",
    "/settings/:path*",
    "/admin/:path*"
  ]
};
