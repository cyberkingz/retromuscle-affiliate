import { afterEach, describe, expect, it, vi } from "vitest";

import { rateLimit } from "@/lib/rate-limit";
import type { ApiContext } from "@/lib/api-response";

function makeCtx(overrides?: Partial<ApiContext>): ApiContext {
  return {
    requestId: "test-req-id",
    startMs: Date.now(),
    method: "POST",
    path: "/api/test",
    ...overrides
  };
}

function makeRequest(ip?: string): Request {
  const headers: Record<string, string> = {};
  if (ip) {
    headers["x-forwarded-for"] = ip;
  }
  return new Request("https://example.com/api/test", {
    method: "POST",
    headers
  });
}

function clearBucketStore(): void {
  const anyGlobal = globalThis as typeof globalThis & { __rmRateLimit?: Map<string, unknown> };
  anyGlobal.__rmRateLimit?.clear();
}

describe("rateLimit", () => {
  afterEach(() => {
    clearBucketStore();
    vi.restoreAllMocks();
  });

  it("returns null when within the limit", () => {
    const result = rateLimit({
      request: makeRequest("1.2.3.4"),
      ctx: makeCtx(),
      key: "test",
      limit: 5,
      windowMs: 60_000
    });
    expect(result).toBeNull();
  });

  it("returns null for multiple requests within limit", () => {
    for (let i = 0; i < 3; i++) {
      const result = rateLimit({
        request: makeRequest("1.2.3.4"),
        ctx: makeCtx(),
        key: "test-multi",
        limit: 5,
        windowMs: 60_000
      });
      expect(result).toBeNull();
    }
  });

  it("returns 429 response when limit is exceeded", () => {
    const limit = 2;
    // Exhaust the limit
    for (let i = 0; i < limit; i++) {
      rateLimit({
        request: makeRequest("5.6.7.8"),
        ctx: makeCtx(),
        key: "test-exceed",
        limit,
        windowMs: 60_000
      });
    }

    // This should exceed the limit
    const result = rateLimit({
      request: makeRequest("5.6.7.8"),
      ctx: makeCtx(),
      key: "test-exceed",
      limit,
      windowMs: 60_000
    });

    expect(result).not.toBeNull();
    expect(result!.status).toBe(429);
  });

  it("includes Retry-After and rate limit headers on 429", () => {
    const limit = 1;
    rateLimit({
      request: makeRequest("9.0.1.2"),
      ctx: makeCtx(),
      key: "test-headers",
      limit,
      windowMs: 60_000
    });

    const result = rateLimit({
      request: makeRequest("9.0.1.2"),
      ctx: makeCtx(),
      key: "test-headers",
      limit,
      windowMs: 60_000
    });

    expect(result).not.toBeNull();
    expect(result!.headers.get("Retry-After")).toBeTruthy();
    expect(result!.headers.get("X-RateLimit-Limit")).toBe("1");
    expect(result!.headers.get("X-RateLimit-Remaining")).toBe("0");
    expect(result!.headers.get("X-RateLimit-Reset")).toBeTruthy();
  });

  it("scopes buckets by userId when provided", () => {
    const limit = 1;

    // User A uses their slot
    rateLimit({
      request: makeRequest("1.1.1.1"),
      ctx: makeCtx(),
      key: "test-user",
      limit,
      windowMs: 60_000,
      userId: "user-a"
    });

    // User B should have a separate bucket
    const resultB = rateLimit({
      request: makeRequest("1.1.1.1"),
      ctx: makeCtx(),
      key: "test-user",
      limit,
      windowMs: 60_000,
      userId: "user-b"
    });

    expect(resultB).toBeNull();
  });

  it("resets the bucket after the window expires", () => {
    const limit = 1;
    const windowMs = 100;

    // Use the real Date.now for the first call
    rateLimit({
      request: makeRequest("2.2.2.2"),
      ctx: makeCtx(),
      key: "test-reset",
      limit,
      windowMs
    });

    // Simulate time passing beyond the window
    const originalNow = Date.now;
    vi.spyOn(Date, "now").mockReturnValue(originalNow() + windowMs + 50);

    const result = rateLimit({
      request: makeRequest("2.2.2.2"),
      ctx: makeCtx(),
      key: "test-reset",
      limit,
      windowMs
    });

    expect(result).toBeNull();
  });

  it("uses x-real-ip when x-forwarded-for is absent", () => {
    const request = new Request("https://example.com/api/test", {
      method: "POST",
      headers: { "x-real-ip": "3.3.3.3" }
    });

    const result = rateLimit({
      request,
      ctx: makeCtx(),
      key: "test-realip",
      limit: 1,
      windowMs: 60_000
    });

    expect(result).toBeNull();

    // Same IP should now be rate limited
    const result2 = rateLimit({
      request,
      ctx: makeCtx(),
      key: "test-realip",
      limit: 1,
      windowMs: 60_000
    });

    expect(result2).not.toBeNull();
    expect(result2!.status).toBe(429);
  });

  it("uses 'unknown' as IP when no IP headers are present", () => {
    const request = new Request("https://example.com/api/test", { method: "POST" });

    const result = rateLimit({
      request,
      ctx: makeCtx(),
      key: "test-unknown",
      limit: 1,
      windowMs: 60_000
    });

    expect(result).toBeNull();
  });
});
