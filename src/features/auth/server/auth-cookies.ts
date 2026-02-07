import { NextResponse } from "next/server";

export const ACCESS_TOKEN_COOKIE_NAME = "rm_access_token";
export const REFRESH_TOKEN_COOKIE_NAME = "rm_refresh_token";

export function readCookieFromHeader(header: string | null, name: string): string | null {
  if (!header) {
    return null;
  }

  // Limit parsing work for pathological headers.
  const value = header.length > 8192 ? header.slice(0, 8192) : header;
  const parts = value.split(";");

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    if (key !== name) continue;
    return decodeURIComponent(trimmed.slice(eqIndex + 1).trim());
  }

  return null;
}

function isSecureCookie(): boolean {
  // Allow local http during development.
  return process.env.NODE_ENV === "production";
}

function baseCookieOptions() {
  return {
    path: "/",
    httpOnly: true,
    sameSite: "lax" as const,
    secure: isSecureCookie()
  };
}

export function clearAuthCookies(response: NextResponse) {
  response.cookies.set(ACCESS_TOKEN_COOKIE_NAME, "", { ...baseCookieOptions(), maxAge: 0 });
  response.cookies.set(REFRESH_TOKEN_COOKIE_NAME, "", { ...baseCookieOptions(), maxAge: 0 });
}

export function setAuthCookies(
  response: NextResponse,
  input: {
    accessToken: string;
    refreshToken: string;
    expiresAt: number | null | undefined; // unix seconds
  }
) {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const accessMaxAge = input.expiresAt ? Math.max(60, input.expiresAt - nowSeconds) : 3600;

  // Keep refresh token longer to avoid frequent logins (Supabase projects commonly use 30 days).
  const refreshMaxAge = 60 * 60 * 24 * 30;

  response.cookies.set(ACCESS_TOKEN_COOKIE_NAME, input.accessToken, {
    ...baseCookieOptions(),
    maxAge: accessMaxAge
  });

  response.cookies.set(REFRESH_TOKEN_COOKIE_NAME, input.refreshToken, {
    ...baseCookieOptions(),
    maxAge: refreshMaxAge
  });
}
