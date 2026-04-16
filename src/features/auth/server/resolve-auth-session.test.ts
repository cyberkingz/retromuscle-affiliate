/**
 * Tests for the pure, side-effect-free helpers in resolve-auth-session.
 *
 * resolveAuthSessionFromAccessToken itself requires a live Supabase client
 * so it is integration-tested separately.  sanitizeAccessToken is a pure
 * function that can be verified here without any mocking.
 */
import { describe, expect, it, vi } from "vitest";

// The module imports from server-client (requires env vars) — stub it.
vi.mock("@/infrastructure/supabase/server-client", () => ({
  createSupabaseServerClient: vi.fn(),
  isSupabaseConfigured: vi.fn().mockReturnValue(false)
}));

import { sanitizeAccessToken } from "@/features/auth/server/resolve-auth-session";

describe("sanitizeAccessToken", () => {
  it("returns null for null", () => {
    expect(sanitizeAccessToken(null)).toBeNull();
  });

  it("returns null for undefined", () => {
    expect(sanitizeAccessToken(undefined)).toBeNull();
  });

  it("returns null for an empty string", () => {
    expect(sanitizeAccessToken("")).toBeNull();
  });

  it("returns null for a whitespace-only string", () => {
    expect(sanitizeAccessToken("   ")).toBeNull();
  });

  it("returns the token for a valid JWT-like string", () => {
    const token = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.abc123";
    expect(sanitizeAccessToken(token)).toBe(token);
  });

  it("trims surrounding whitespace from a valid token", () => {
    const token = "  valid.token.here  ";
    expect(sanitizeAccessToken(token)).toBe("valid.token.here");
  });

  it("returns null for a token that exceeds MAX_ACCESS_TOKEN_LENGTH (4096 chars)", () => {
    const tooLong = "a".repeat(4097);
    expect(sanitizeAccessToken(tooLong)).toBeNull();
  });

  it("accepts a token of exactly 4096 characters", () => {
    const exact = "a".repeat(4096);
    expect(sanitizeAccessToken(exact)).toBe(exact);
  });

  it("accepts a token of exactly 4095 characters", () => {
    const almostMax = "b".repeat(4095);
    expect(sanitizeAccessToken(almostMax)).toBe(almostMax);
  });

  it("returns null when token is all whitespace after trim even if long", () => {
    // spaces that would trim to empty — length < 4096 but empty after trim
    expect(sanitizeAccessToken("    ")).toBeNull();
  });
});
