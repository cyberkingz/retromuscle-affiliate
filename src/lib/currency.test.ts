import { describe, expect, it } from "vitest";

import { formatCurrency } from "@/lib/currency";

describe("formatCurrency", () => {
  it("formats a positive integer in EUR (fr-FR) by default", () => {
    const result = formatCurrency(1500);
    // French locale uses non-breaking space before the currency symbol
    expect(result).toContain("1");
    expect(result).toContain("500");
    expect(result).toContain("€");
  });

  it("formats zero", () => {
    const result = formatCurrency(0);
    expect(result).toContain("0");
    expect(result).toContain("€");
  });

  it("formats negative values", () => {
    const result = formatCurrency(-250);
    expect(result).toContain("250");
    expect(result).toContain("€");
  });

  it("formats large numbers with grouping separators", () => {
    const result = formatCurrency(1_000_000);
    // Should contain the digits for one million
    expect(result).toContain("000");
    expect(result).toContain("€");
  });

  it("preserves two decimal places for financial precision", () => {
    const result = formatCurrency(99.99);
    expect(result).toContain("99,99");
    expect(result).toContain("\u20ac");
  });

  it("respects a custom locale (en-US) and currency (USD)", () => {
    const result = formatCurrency(1500, "en-US", "USD");
    expect(result).toContain("$");
    expect(result).toContain("1,500.00");
  });

  it("respects a custom locale (de-DE) and currency (EUR)", () => {
    const result = formatCurrency(2500, "de-DE", "EUR");
    expect(result).toContain("2.500,00");
    expect(result).toContain("€");
  });

  it("handles very small fractional values with two decimals", () => {
    const result = formatCurrency(0.49);
    expect(result).toContain("0,49");
    expect(result).toContain("\u20ac");
  });
});
