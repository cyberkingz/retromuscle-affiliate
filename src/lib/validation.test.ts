import { describe, expect, it } from "vitest";

import {
  extractInstagramProfileHandle,
  extractTiktokProfileHandle,
  isValidInstagramUrl,
  isValidTiktokUrl,
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
    expect(extractTiktokProfileHandle("https://tiktok.com/@retro.muscle/video/123")).toBe("@retro.muscle");
    expect(isValidTiktokUrl("https://www.tiktok.com/@retro_muscle")).toBe(true);
  });

  it("rejects non-profile TikTok URLs", () => {
    expect(extractTiktokProfileHandle("https://www.tiktok.com/")).toBeNull();
    expect(isValidTiktokUrl("https://www.tiktok.com")).toBe(false);
  });

  it("extracts Instagram handles from profile URLs", () => {
    expect(extractInstagramProfileHandle("https://www.instagram.com/RetroMuscle/")).toBe("@retromuscle");
    expect(extractInstagramProfileHandle("https://instagr.am/retro_muscle")).toBe("@retro_muscle");
    expect(isValidInstagramUrl("https://www.instagram.com/retro.muscle")).toBe(true);
  });

  it("rejects non-profile Instagram URLs", () => {
    expect(extractInstagramProfileHandle("https://www.instagram.com/p/abc")).toBeNull();
    expect(isValidInstagramUrl("https://www.instagram.com/p/abc")).toBe(false);
  });
});
