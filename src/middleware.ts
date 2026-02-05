import { NextResponse, type NextRequest } from "next/server";

const ACCESS_TOKEN_COOKIE = "rm_access_token";

type RedirectTarget = "/admin" | "/dashboard" | "/onboarding";

function isSupabaseGuardEnabled() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) && Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY);
}

function readAccessToken(request: NextRequest): string | null {
  const value = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value?.trim();
  if (!value || value.length > 4096) {
    return null;
  }
  return value;
}

function isProtectedPath(pathname: string): boolean {
  return pathname.startsWith("/admin") || pathname.startsWith("/dashboard") || pathname.startsWith("/onboarding");
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

function clearAccessTokenCookie(response: NextResponse) {
  response.cookies.set(ACCESS_TOKEN_COOKIE, "", {
    path: "/",
    maxAge: 0,
    sameSite: "lax"
  });
}

function isRedirectTarget(value: unknown): value is RedirectTarget {
  return value === "/admin" || value === "/dashboard" || value === "/onboarding";
}

async function resolveRedirectTarget(request: NextRequest, accessToken: string): Promise<RedirectTarget | null> {
  const response = await fetch(new URL("/api/auth/redirect-target", request.url), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`
    },
    cache: "no-store"
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as { target?: unknown };
  return isRedirectTarget(data.target) ? data.target : null;
}

export async function middleware(request: NextRequest) {
  if (!isSupabaseGuardEnabled()) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;
  const protectedPath = isProtectedPath(pathname);
  const publicAuthPath = isPublicAuthPath(pathname);
  const accessToken = readAccessToken(request);

  if (!accessToken) {
    if (protectedPath) {
      return redirectTo(request, "/login");
    }

    return NextResponse.next();
  }

  let target: RedirectTarget | null = null;
  try {
    target = await resolveRedirectTarget(request, accessToken);
  } catch {
    target = null;
  }

  if (!target) {
    if (protectedPath) {
      const response = redirectTo(request, "/login");
      clearAccessTokenCookie(response);
      return response;
    }

    const response = NextResponse.next();
    clearAccessTokenCookie(response);
    return response;
  }

  if (publicAuthPath) {
    return redirectTo(request, target);
  }

  if (pathname.startsWith("/admin") && target !== "/admin") {
    return redirectTo(request, target);
  }

  if (pathname.startsWith("/dashboard") && target !== "/dashboard") {
    return redirectTo(request, target);
  }

  if (pathname.startsWith("/onboarding") && target !== "/onboarding") {
    return redirectTo(request, target);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/apply", "/login", "/onboarding/:path*", "/dashboard/:path*", "/admin/:path*"]
};
