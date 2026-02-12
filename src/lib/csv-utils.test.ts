import { describe, expect, it } from "vitest";

import { csvEscape, maskEmail, maskIban } from "@/lib/csv-utils";

describe("csvEscape", () => {
  it("returns empty string for null", () => {
    expect(csvEscape(null)).toBe("");
  });

  it("returns empty string for undefined", () => {
    expect(csvEscape(undefined)).toBe("");
  });

  it("converts numbers to string", () => {
    expect(csvEscape(42)).toBe("42");
  });

  it("passes through plain text unchanged", () => {
    expect(csvEscape("hello")).toBe("hello");
  });

  it("wraps text containing commas in double quotes", () => {
    expect(csvEscape("hello, world")).toBe('"hello, world"');
  });

  it("wraps text containing double quotes and escapes them", () => {
    expect(csvEscape('say "hi"')).toBe('"say ""hi"""');
  });

  it("wraps text containing newlines", () => {
    expect(csvEscape("line1\nline2")).toBe('"line1\nline2"');
  });

  it("wraps text containing carriage returns", () => {
    expect(csvEscape("line1\rline2")).toBe('"line1\rline2"');
  });

  it("prefixes formula-injection characters with a single quote (=)", () => {
    expect(csvEscape("=SUM(A1)")).toBe("'=SUM(A1)");
  });

  it("prefixes formula-injection characters with a single quote (+)", () => {
    expect(csvEscape("+cmd")).toBe("'+cmd");
  });

  it("prefixes formula-injection characters with a single quote (-)", () => {
    expect(csvEscape("-cmd")).toBe("'-cmd");
  });

  it("prefixes formula-injection characters with a single quote (@)", () => {
    expect(csvEscape("@mention")).toBe("'@mention");
  });

  it("prefixes formula-injection characters with a single quote (tab)", () => {
    const result = csvEscape("\tcmd");
    expect(result).toBe("'\tcmd");
  });

  it("handles combined formula injection and special CSV characters", () => {
    // The = is prefixed with ', then the comma triggers quoting
    const result = csvEscape("=SUM,A1");
    expect(result).toBe("\"'=SUM,A1\"");
  });
});

describe("maskIban", () => {
  it("returns empty string for null", () => {
    expect(maskIban(null)).toBe("");
  });

  it("returns empty string for undefined", () => {
    expect(maskIban(undefined)).toBe("");
  });

  it("returns empty string for empty string", () => {
    expect(maskIban("")).toBe("");
  });

  it("masks a standard IBAN (showing first 4 and last 4)", () => {
    expect(maskIban("FR7630006000011234567890189")).toBe("FR76****...****0189");
  });

  it("handles IBAN with spaces", () => {
    expect(maskIban("FR76 3000 6000 0112 3456 7890 189")).toBe("FR76****...****0189");
  });

  it("returns **** for very short IBAN (8 chars or fewer)", () => {
    expect(maskIban("FR761234")).toBe("****");
  });

  it("returns **** for IBAN with exactly 8 characters", () => {
    expect(maskIban("12345678")).toBe("****");
  });

  it("masks a 9-character IBAN correctly", () => {
    expect(maskIban("123456789")).toBe("1234****...****6789");
  });
});

describe("maskEmail", () => {
  it("returns empty string for null", () => {
    expect(maskEmail(null)).toBe("");
  });

  it("returns empty string for undefined", () => {
    expect(maskEmail(undefined)).toBe("");
  });

  it("returns empty string for empty string", () => {
    expect(maskEmail("")).toBe("");
  });

  it("masks a standard email (first 3 chars + domain)", () => {
    expect(maskEmail("john.doe@example.com")).toBe("joh***@example.com");
  });

  it("masks a short local part (< 3 chars)", () => {
    expect(maskEmail("ab@example.com")).toBe("ab***@example.com");
  });

  it("masks an email with exactly 3 local chars", () => {
    expect(maskEmail("abc@example.com")).toBe("abc***@example.com");
  });

  it("returns *** for email without @ sign", () => {
    expect(maskEmail("no-at-sign")).toBe("***");
  });

  it("returns *** for email starting with @", () => {
    expect(maskEmail("@domain.com")).toBe("***");
  });
});
