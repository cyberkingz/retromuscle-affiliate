import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ResolvedAuthSession } from "@/features/auth/server/resolve-auth-session";
import { createApiContext } from "@/lib/api-response";

// Mock server-only modules before importing api-guards
vi.mock("@/features/auth/server/resolve-auth-session", () => ({
  resolveAuthSessionFromAccessToken: vi.fn(),
  ACCESS_TOKEN_COOKIE_NAME: "rm_access_token"
}));

vi.mock("@/features/auth/server/auth-refresh", () => ({
  refreshSupabaseSession: vi.fn()
}));

// auth-cookies is NOT mocked — we use its real cookie helpers for assertion
import { requireApiRole, requireApiSession } from "@/features/auth/server/api-guards";
import { resolveAuthSessionFromAccessToken } from "@/features/auth/server/resolve-auth-session";
import { refreshSupabaseSession } from "@/features/auth/server/auth-refresh";
import {
  ACCESS_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_NAME
} from "@/features/auth/server/auth-cookies";

function makeRequest(cookies: Record<string, string> = {}): Request {
  const cookieHeader = Object.entries(cookies)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join("; ");

  return new Request("https://example.com/api/test", {
    method: "GET",
    headers: cookieHeader ? { cookie: cookieHeader } : {}
  });
}

function makeSession(overrides: Partial<ResolvedAuthSession> = {}): ResolvedAuthSession {
  return {
    role: "affiliate",
    target: "/dashboard",
    userId: "user-abc",
    email: "test@example.com",
    ...overrides
  };
}

function makeCtx(request: Request) {
  return createApiContext(request);
}

describe("requireApiSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when neither access nor refresh token is present", async () => {
    const request = makeRequest();
    const ctx = makeCtx(request);
    const result = await requireApiSession(request, { ctx });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(401);
    }
  });

  it("returns session when access token is valid", async () => {
    const session = makeSession();
    vi.mocked(resolveAuthSessionFromAccessToken).mockResolvedValue(session);

    const request = makeRequest({ [ACCESS_TOKEN_COOKIE_NAME]: "valid.jwt.token" });
    const ctx = makeCtx(request);
    const result = await requireApiSession(request, { ctx });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.session).toBe(session);
      expect(result.setAuthCookies).toBeUndefined();
    }
  });

  it("returns 500 when resolveAuthSession throws", async () => {
    vi.mocked(resolveAuthSessionFromAccessToken).mockRejectedValue(new Error("DB failure"));

    const request = makeRequest({ [ACCESS_TOKEN_COOKIE_NAME]: "jwt" });
    const ctx = makeCtx(request);
    const result = await requireApiSession(request, { ctx });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(500);
    }
  });

  it("returns 401 when access token is invalid and no refresh token", async () => {
    vi.mocked(resolveAuthSessionFromAccessToken).mockResolvedValue(null);

    const request = makeRequest({ [ACCESS_TOKEN_COOKIE_NAME]: "expired.jwt" });
    const ctx = makeCtx(request);
    const result = await requireApiSession(request, { ctx });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(401);
    }
  });

  it("refreshes session when access token is null but refresh token exists", async () => {
    const refreshedSession = makeSession({ email: "refreshed@example.com" });

    vi.mocked(resolveAuthSessionFromAccessToken)
      .mockResolvedValueOnce(null) // initial access token (none)
      .mockResolvedValueOnce(refreshedSession); // after refresh

    vi.mocked(refreshSupabaseSession).mockResolvedValue({
      accessToken: "new.access.token",
      refreshToken: "new.refresh.token",
      expiresAt: Math.floor(Date.now() / 1000) + 3600
    });

    const request = makeRequest({ [REFRESH_TOKEN_COOKIE_NAME]: "old.refresh" });
    const ctx = makeCtx(request);
    const result = await requireApiSession(request, { ctx });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.session).toBe(refreshedSession);
      expect(result.setAuthCookies).toBeDefined();
      expect(result.setAuthCookies?.accessToken).toBe("new.access.token");
    }
  });

  it("returns 401 when refresh fails", async () => {
    vi.mocked(resolveAuthSessionFromAccessToken).mockResolvedValue(null);
    vi.mocked(refreshSupabaseSession).mockResolvedValue(null);

    const request = makeRequest({
      [ACCESS_TOKEN_COOKIE_NAME]: "expired",
      [REFRESH_TOKEN_COOKIE_NAME]: "bad.refresh"
    });
    const ctx = makeCtx(request);
    const result = await requireApiSession(request, { ctx });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(401);
    }
  });

  it("returns 401 when refresh succeeds but token resolves to null", async () => {
    vi.mocked(resolveAuthSessionFromAccessToken)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null); // post-refresh resolve also fails

    vi.mocked(refreshSupabaseSession).mockResolvedValue({
      accessToken: "new.access",
      refreshToken: "new.refresh",
      expiresAt: null
    });

    const request = makeRequest({
      [ACCESS_TOKEN_COOKIE_NAME]: "expired",
      [REFRESH_TOKEN_COOKIE_NAME]: "valid.refresh"
    });
    const ctx = makeCtx(request);
    const result = await requireApiSession(request, { ctx });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(401);
    }
  });
});

describe("requireApiRole", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 403 when session role does not match required role", async () => {
    const session = makeSession({ role: "affiliate" });
    vi.mocked(resolveAuthSessionFromAccessToken).mockResolvedValue(session);

    const request = makeRequest({ [ACCESS_TOKEN_COOKIE_NAME]: "affiliate.token" });
    const ctx = makeCtx(request);
    const result = await requireApiRole(request, "admin", { ctx });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(403);
    }
  });

  it("returns ok when session role matches required role", async () => {
    const session = makeSession({ role: "admin" });
    vi.mocked(resolveAuthSessionFromAccessToken).mockResolvedValue(session);

    const request = makeRequest({ [ACCESS_TOKEN_COOKIE_NAME]: "admin.token" });
    const ctx = makeCtx(request);
    const result = await requireApiRole(request, "admin", { ctx });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.session.role).toBe("admin");
    }
  });

  it("accepts an array of allowed roles", async () => {
    const session = makeSession({ role: "affiliate" });
    vi.mocked(resolveAuthSessionFromAccessToken).mockResolvedValue(session);

    const request = makeRequest({ [ACCESS_TOKEN_COOKIE_NAME]: "tok" });
    const ctx = makeCtx(request);
    const result = await requireApiRole(request, ["admin", "affiliate"], { ctx });

    expect(result.ok).toBe(true);
  });

  it("propagates 401 from underlying session guard", async () => {
    const request = makeRequest(); // no cookies
    const ctx = makeCtx(request);
    const result = await requireApiRole(request, "admin", { ctx });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(401);
    }
  });
});
