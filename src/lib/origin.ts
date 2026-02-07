export function resolveRequestOrigin(request: Request): string | null {
  // Prefer forwarded headers in real deployments (Vercel, proxies).
  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const host = forwardedHost || request.headers.get("host")?.trim();

  if (!host) {
    return null;
  }

  const url = new URL(request.url);
  const proto = forwardedProto || url.protocol.replace(":", "");
  return `${proto}://${host}`;
}

export function isAllowedOrigin(request: Request): boolean {
  const origin = request.headers.get("origin")?.trim();
  // Many non-browser clients omit Origin (cron, tests, server-side fetch). Allow missing.
  if (!origin) {
    return true;
  }

  const expectedOrigin = resolveRequestOrigin(request);
  if (!expectedOrigin) {
    return false;
  }

  return origin === expectedOrigin;
}

