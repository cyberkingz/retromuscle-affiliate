import { describe, expect, it } from "vitest";

import {
  extractInstagramProfileHandle,
  extractTiktokProfileHandle,
  isValidEmail,
  isValidHttpUrl,
  isValidInstagramUrl,
  isValidPublicHttpUrl,
  isValidTiktokUrl,
  isSafeEntityId,
  isUuid,
  normalizeHttpUrl,
  parseMonthParam
} from "@/lib/validation";

describe("parseMonthParam", () => {
  it("returns undefined for empty values", () => {
    expect(parseMonthParam(undefined)).toBeUndefined();
    expect(parseMonthParam(null)).toBeUndefined();
    expect(parseMonthParam("")).toBeUndefined();
    expect(parseMonthParam("   ")).toBeUndefined();
  });

  it("accepts a strict YYYY-MM month", () => {
    expect(parseMonthParam("2026-02")).toBe("2026-02");
    expect(parseMonthParam(" 2024-12 ")).toBe("2024-12");
  });

  it("rejects invalid months", () => {
    expect(() => parseMonthParam("2026-00")).toThrow(/YYYY-MM/i);
    expect(() => parseMonthParam("2026-13")).toThrow(/YYYY-MM/i);
    expect(() => parseMonthParam("26-02")).toThrow(/YYYY-MM/i);
    expect(() => parseMonthParam("2026/02")).toThrow(/YYYY-MM/i);
  });
});

describe("social profile extraction", () => {
  it("extracts TikTok handles from profile URLs", () => {
    expect(extractTiktokProfileHandle("https://www.tiktok.com/@RetroMuscle")).toBe("@retromuscle");
    expect(extractTiktokProfileHandle("https://tiktok.com/@retro.muscle/video/123")).toBe(
      "@retro.muscle"
    );
    expect(isValidTiktokUrl("https://www.tiktok.com/@retro_muscle")).toBe(true);
  });

  it("rejects non-profile TikTok URLs", () => {
    expect(extractTiktokProfileHandle("https://www.tiktok.com/")).toBeNull();
    expect(isValidTiktokUrl("https://www.tiktok.com")).toBe(false);
  });

  it("extracts Instagram handles from profile URLs", () => {
    expect(extractInstagramProfileHandle("https://www.instagram.com/RetroMuscle/")).toBe(
      "@retromuscle"
    );
    expect(extractInstagramProfileHandle("https://instagr.am/retro_muscle")).toBe("@retro_muscle");
    expect(isValidInstagramUrl("https://www.instagram.com/retro.muscle")).toBe(true);
  });

  it("rejects non-profile Instagram URLs", () => {
    expect(extractInstagramProfileHandle("https://www.instagram.com/p/abc")).toBeNull();
    expect(isValidInstagramUrl("https://www.instagram.com/p/abc")).toBe(false);
  });

  it("rejects reserved Instagram paths", () => {
    expect(extractInstagramProfileHandle("https://instagram.com/explore")).toBeNull();
    expect(extractInstagramProfileHandle("https://instagram.com/accounts")).toBeNull();
    expect(extractInstagramProfileHandle("https://instagram.com/reel/abc")).toBeNull();
    expect(extractInstagramProfileHandle("https://instagram.com/stories/user")).toBeNull();
  });
});

describe("isValidEmail", () => {
  it("accepts valid emails", () => {
    expect(isValidEmail("user@example.com")).toBe(true);
    expect(isValidEmail("user+tag@example.co.uk")).toBe(true);
    expect(isValidEmail("  user@example.com  ")).toBe(true);
  });

  it("rejects invalid emails", () => {
    expect(isValidEmail("")).toBe(false);
    expect(isValidEmail("no-at-sign")).toBe(false);
    expect(isValidEmail("@missing-local.com")).toBe(false);
    expect(isValidEmail("user@")).toBe(false);
  });
});

describe("isSafeEntityId", () => {
  it("accepts alphanumeric IDs with underscores and hyphens", () => {
    expect(isSafeEntityId("abc")).toBe(true);
    expect(isSafeEntityId("user_123")).toBe(true);
    expect(isSafeEntityId("creator-handle")).toBe(true);
  });

  it("rejects too short or too long", () => {
    expect(isSafeEntityId("ab")).toBe(false);
    expect(isSafeEntityId("a".repeat(81))).toBe(false);
  });

  it("rejects special characters", () => {
    expect(isSafeEntityId("has spaces")).toBe(false);
    expect(isSafeEntityId("has/slash")).toBe(false);
    expect(isSafeEntityId("drop;table")).toBe(false);
  });
});

describe("isUuid", () => {
  it("accepts valid v1-v5 UUIDs", () => {
    expect(isUuid("123e4567-e89b-12d3-a456-426614174000")).toBe(true);
    expect(isUuid("  550e8400-e29b-41d4-a716-446655440000  ")).toBe(true);
  });

  it("rejects invalid formats", () => {
    expect(isUuid("")).toBe(false);
    expect(isUuid("not-a-uuid")).toBe(false);
    expect(isUuid("123e4567-e89b-62d3-a456-426614174000")).toBe(false);
  });
});

describe("normalizeHttpUrl", () => {
  it("keeps http/https as-is", () => {
    expect(normalizeHttpUrl("https://example.com")).toBe("https://example.com");
    expect(normalizeHttpUrl("http://example.com")).toBe("http://example.com");
  });

  it("prepends https to bare domains", () => {
    expect(normalizeHttpUrl("example.com")).toBe("https://example.com");
    expect(normalizeHttpUrl("www.example.com")).toBe("https://www.example.com");
  });

  it("keeps @handles", () => {
    expect(normalizeHttpUrl("@username")).toBe("@username");
  });

  it("returns empty for empty input", () => {
    expect(normalizeHttpUrl("")).toBe("");
    expect(normalizeHttpUrl("   ")).toBe("");
  });
});

describe("isValidHttpUrl", () => {
  it("accepts http and https", () => {
    expect(isValidHttpUrl("https://example.com")).toBe(true);
    expect(isValidHttpUrl("http://example.com/path")).toBe(true);
  });

  it("rejects non-http protocols", () => {
    expect(isValidHttpUrl("ftp://example.com")).toBe(false);
    expect(isValidHttpUrl("javascript:alert(1)")).toBe(false);
  });
});

describe("isValidPublicHttpUrl", () => {
  it("accepts URLs with TLD", () => {
    expect(isValidPublicHttpUrl("https://example.com")).toBe(true);
  });

  it("accepts localhost", () => {
    expect(isValidPublicHttpUrl("http://localhost:3000")).toBe(true);
  });

  it("rejects single-word hostnames", () => {
    expect(isValidPublicHttpUrl("https://tiktok")).toBe(false);
  });
});
