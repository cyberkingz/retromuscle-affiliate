export function resolveRequestOrigin(request: Request): string | null {
  try {
    return new URL(request.url).origin;
  } catch {
    return null;
  }
}

export function isAllowedOrigin(
  request: Request,
  options?: {
    allowMissingOrigin?: boolean;
  }
): boolean {
  const origin = request.headers.get("origin")?.trim();
  if (!origin) {
    return options?.allowMissingOrigin === true;
  }

  const expectedOrigin = resolveRequestOrigin(request);
  if (expectedOrigin && origin === expectedOrigin) {
    return true;
  }

  // Allow the canonical site URL too (useful for proxies and multi-domain setups).
  const configuredSiteOrigin = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configuredSiteOrigin) {
    try {
      return origin === new URL(configuredSiteOrigin).origin;
    } catch {
      return false;
    }
  }

  return false;
}
