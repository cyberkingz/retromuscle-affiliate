import { NextResponse, type NextRequest } from "next/server";

import {
  ACCESS_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_NAME,
  clearAuthCookies,
  setAuthCookies
} from "@/features/auth/server/auth-cookies";

// ---------------------------------------------------------------------------
// CSP nonce helpers
// ---------------------------------------------------------------------------

const isProd = process.env.NODE_ENV === "production";

/**
 * Build a Content-Security-Policy header value with the given nonce.
 *
 * - `script-src` uses `'nonce-<value>'` instead of `'unsafe-inline'`.
 *   In development we additionally allow `'unsafe-eval'` for Next.js HMR.
 * - `style-src` keeps `'unsafe-inline'` because Tailwind CSS and the
 *   Next.js runtime inject inline styles that cannot carry a nonce.
 */
function buildCsp(nonce: string): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' ${isProd ? "" : "'unsafe-eval'"} https:`,
    "style-src 'self' 'unsafe-inline' https:",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https:",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https:",
    "frame-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "upgrade-insecure-requests"
  ]
    .filter(Boolean)
    .join("; ");
}

// ---------------------------------------------------------------------------
// Auth helpers (unchanged)
// ---------------------------------------------------------------------------

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

function redirectTo(request: NextRequest, pathname: string, query?: Record<string, string>) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      url.searchParams.set(key, value);
    }
  }
  return NextResponse.redirect(url);
}

/**
 * Expected JWT audience claim for Supabase tokens.
 * Supabase always sets `aud` to "authenticated" for logged-in users.
 */
const EXPECTED_JWT_AUDIENCE = "authenticated";

/**
 * Validates that a token has valid JWT structure: exactly 3 dot-separated parts,
 * each being non-empty valid base64url.
 */
function hasValidJwtStructure(token: string): boolean {
  const parts = token.split(".");
  if (parts.length !== 3) {
    return false;
  }

  const base64urlPattern = /^[A-Za-z0-9_-]+$/;
  return parts.every((part) => part!.length > 0 && base64urlPattern.test(part!));
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  if (!hasValidJwtStructure(token)) {
    return null;
  }

  const parts = token.split(".");
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

/**
 * Lightweight JWT validation for Edge middleware. This does NOT verify the
 * cryptographic signature (Edge runtime lacks Node crypto APIs). It checks:
 *
 * 1. Structural validity -- 3 base64url-encoded segments
 * 2. `exp` claim -- token must not be expired (also catches missing `exp`)
 * 3. `aud` claim -- must equal "authenticated" (Supabase default)
 *
 * Server-side guards (protectPage, requireApiRole) still perform full
 * Supabase verification. These checks prevent forged/expired tokens from
 * reaching the loading shell -- a UX improvement, not a security boundary.
 */
function isTokenValid(accessToken: string): boolean {
  const payload = decodeJwtPayload(accessToken);
  if (!payload) {
    return false;
  }

  // Check exp: must be a number and in the future
  const exp = typeof payload.exp === "number" ? payload.exp : null;
  if (!exp) {
    return false;
  }
  const nowSeconds = Math.floor(Date.now() / 1000);
  if (exp <= nowSeconds) {
    return false;
  }

  // Check aud: must match expected audience
  if (payload.aud !== EXPECTED_JWT_AUDIENCE) {
    return false;
  }

  return true;
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

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

export async function middleware(request: NextRequest) {
  // Generate a fresh nonce for every request.
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");

  // ------------------------------------------------------------------
  // Auth guard — only active when Supabase env vars are configured.
  // ------------------------------------------------------------------
  if (isSupabaseGuardEnabled()) {
    const { pathname } = request.nextUrl;
    const protectedPath = isProtectedPath(pathname);
    const publicAuthPath = isPublicAuthPath(pathname);
    const accessToken = readCookie(request, ACCESS_TOKEN_COOKIE_NAME);
    const refreshToken = readCookie(request, REFRESH_TOKEN_COOKIE_NAME);

    // Try to refresh when the access token is missing, invalid, or close to expiration.
    let refreshed: {
      accessToken: string;
      refreshToken: string;
      expiresAt: number | null | undefined;
    } | null = null;

    const accessTokenNeedsRefresh =
      !accessToken || !isTokenValid(accessToken) || isExpiringSoon(accessToken);

    if (accessTokenNeedsRefresh && refreshToken) {
      try {
        const { refreshSupabaseSession } = await import("@/features/auth/server/auth-refresh");
        refreshed = await refreshSupabaseSession(refreshToken);
      } catch {
        refreshed = null;
      }
    }

    const effectiveAccessToken = refreshed?.accessToken ?? accessToken;
    // Use lightweight JWT validation: structure, exp, and aud checks.
    const hasSession = Boolean(effectiveAccessToken) && isTokenValid(effectiveAccessToken!);

    if (!hasSession && protectedPath) {
      return redirectTo(request, "/login", { reason: "expired" });
    }

    if (hasSession && publicAuthPath) {
      const response = redirectTo(request, "/onboarding");
      if (refreshed) {
        setAuthCookies(response, refreshed);
      }
      return response;
    }

    // For non-redirect responses, proceed with CSP.
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-nonce", nonce);
    const response = NextResponse.next({ request: { headers: requestHeaders } });
    response.headers.set("Content-Security-Policy", buildCsp(nonce));

    if (hasSession) {
      if (refreshed) {
        setAuthCookies(response, refreshed);
      }

      // If refresh failed and we had no valid access token, clear cookies to avoid loops.
      if (accessTokenNeedsRefresh && refreshToken && !refreshed) {
        if (protectedPath) {
          const redirect = redirectTo(request, "/login", { reason: "expired" });
          clearAuthCookies(redirect);
          return redirect;
        }
        clearAuthCookies(response);
      }
    }

    return response;
  }

  // ------------------------------------------------------------------
  // No Supabase guard — just apply CSP nonce and continue.
  // ------------------------------------------------------------------
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", buildCsp(nonce));
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     * - Static assets in /public (images, etc.)
     */
    "/((?!_next/static|_next/image|favicon\\.ico|sitemap\\.xml|robots\\.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"
  ]
};
