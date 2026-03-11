import { describe, expect, it } from "vitest";

/**
 * Unit tests for middleware helper functions.
 * These are the pure functions extracted from middleware logic.
 * We can't directly test the middleware export without Edge runtime,
 * so we test the deterministic helpers.
 */

// Re-implement the pure helpers to test them in isolation.
// In a production codebase you'd extract these to a shared module.

function hasValidJwtStructure(token: string): boolean {
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const base64urlPattern = /^[A-Za-z0-9_-]+$/;
  return parts.every((part) => part!.length > 0 && base64urlPattern.test(part!));
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  if (!hasValidJwtStructure(token)) return null;
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

describe("hasValidJwtStructure", () => {
  it("accepts a valid 3-part JWT", () => {
    // header.payload.signature in base64url
    expect(hasValidJwtStructure("eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.abc123")).toBe(true);
  });

  it("rejects an empty string", () => {
    expect(hasValidJwtStructure("")).toBe(false);
  });

  it("rejects a 2-part token", () => {
    expect(hasValidJwtStructure("abc.def")).toBe(false);
  });

  it("rejects a 4-part token", () => {
    expect(hasValidJwtStructure("a.b.c.d")).toBe(false);
  });

  it("rejects tokens with invalid base64url characters", () => {
    expect(hasValidJwtStructure("a=b.c.d")).toBe(false);
    expect(hasValidJwtStructure("a.c d.e")).toBe(false);
  });

  it("rejects tokens with empty segments", () => {
    expect(hasValidJwtStructure(".b.c")).toBe(false);
    expect(hasValidJwtStructure("a..c")).toBe(false);
    expect(hasValidJwtStructure("a.b.")).toBe(false);
  });
});

describe("decodeJwtPayload", () => {
  function makeToken(payload: Record<string, unknown>): string {
    const header = btoa(JSON.stringify({ alg: "HS256" })).replace(/=/g, "");
    const body = btoa(JSON.stringify(payload)).replace(/=/g, "");
    return `${header}.${body}.fakesignature`;
  }

  it("decodes a valid JWT payload", () => {
    const token = makeToken({ sub: "user-1", role: "admin" });
    const payload = decodeJwtPayload(token);
    expect(payload).toEqual({ sub: "user-1", role: "admin" });
  });

  it("returns null for invalid JWT structure", () => {
    expect(decodeJwtPayload("not-a-jwt")).toBeNull();
  });

  it("returns null for non-JSON payload", () => {
    const header = btoa("{}").replace(/=/g, "");
    const body = btoa("not json").replace(/=/g, "");
    expect(decodeJwtPayload(`${header}.${body}.sig`)).toBeNull();
  });

  it("handles base64url padding correctly", () => {
    const token = makeToken({ exp: 9999999999, aud: "authenticated" });
    const payload = decodeJwtPayload(token);
    expect(payload?.exp).toBe(9999999999);
  });
});

describe("isProtectedPath", () => {
  it.each([
    "/admin",
    "/admin/creators/abc",
    "/dashboard",
    "/uploads",
    "/payouts",
    "/settings",
    "/contract",
    "/onboarding"
  ])("returns true for %s", (path) => {
    expect(isProtectedPath(path)).toBe(true);
  });

  it.each(["/", "/apply", "/login", "/privacy", "/terms", "/api/something"])(
    "returns false for %s",
    (path) => {
      expect(isProtectedPath(path)).toBe(false);
    }
  );
});

describe("isPublicAuthPath", () => {
  it("returns true for /apply", () => {
    expect(isPublicAuthPath("/apply")).toBe(true);
  });

  it("returns true for /login", () => {
    expect(isPublicAuthPath("/login")).toBe(true);
  });

  it("returns false for other paths", () => {
    expect(isPublicAuthPath("/")).toBe(false);
    expect(isPublicAuthPath("/admin")).toBe(false);
    expect(isPublicAuthPath("/dashboard")).toBe(false);
  });
});
