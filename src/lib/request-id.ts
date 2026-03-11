const SAFE_REQUEST_ID_PATTERN = /^[a-zA-Z0-9_\-.:]+$/;

export function getRequestId(request: Request): string {
  const existing = request.headers.get("x-request-id")?.trim();
  if (existing && existing.length <= 128 && SAFE_REQUEST_ID_PATTERN.test(existing)) {
    return existing;
  }

  // Use Web Crypto when available (works in Node 20+ and Edge runtime).
  return globalThis.crypto?.randomUUID?.() ?? `req_${Date.now()}`;
}

