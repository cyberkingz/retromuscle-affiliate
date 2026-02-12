import { describe, expect, it } from "vitest";

import { monthToLabel, toShortDate } from "@/lib/date";

describe("monthToLabel", () => {
  it("converts YYYY-MM to a French long month + year by default", () => {
    const label = monthToLabel("2026-01");
    // French locale: "janvier 2026"
    expect(label.toLowerCase()).toContain("janvier");
    expect(label).toContain("2026");
  });

  it("converts a mid-year month correctly", () => {
    const label = monthToLabel("2025-07");
    expect(label.toLowerCase()).toContain("juillet");
    expect(label).toContain("2025");
  });

  it("converts December correctly", () => {
    const label = monthToLabel("2024-12");
    expect(label.toLowerCase()).toContain("décembre");
    expect(label).toContain("2024");
  });

  it("respects en-US locale", () => {
    const label = monthToLabel("2026-03", "en-US");
    expect(label.toLowerCase()).toContain("march");
    expect(label).toContain("2026");
  });

  it("handles month 01 (January) without off-by-one error", () => {
    const label = monthToLabel("2026-01", "en-US");
    expect(label.toLowerCase()).toContain("january");
  });

  it("handles month 12 (December) without off-by-one error", () => {
    const label = monthToLabel("2026-12", "en-US");
    expect(label.toLowerCase()).toContain("december");
  });
});

describe("toShortDate", () => {
  it("formats an ISO date string to dd/MM/yy in fr-FR by default", () => {
    const result = toShortDate("2026-02-11T10:00:00Z");
    // French short date: 11/02/26
    expect(result).toMatch(/11\/02\/26/);
  });

  it("formats another date correctly", () => {
    const result = toShortDate("2025-12-25T00:00:00Z");
    expect(result).toMatch(/25\/12\/25/);
  });

  it("respects en-US locale", () => {
    const result = toShortDate("2026-02-11T10:00:00Z", "en-US");
    // en-US short: 02/11/26
    expect(result).toMatch(/02\/11\/26/);
  });
});
