import { describe, expect, it } from "vitest";

import { isAllowedOrigin, resolveRequestOrigin } from "@/lib/origin";

describe("origin guards", () => {
  it("resolves origin from request url", () => {
    const request = new Request("https://example.com/api/test");
    expect(resolveRequestOrigin(request)).toBe("https://example.com");
  });

  it("rejects missing origin by default", () => {
    const request = new Request("https://example.com/api/test", { method: "POST" });
    expect(isAllowedOrigin(request)).toBe(false);
  });

  it("allows missing origin when explicitly configured", () => {
    const request = new Request("https://example.com/api/test", { method: "POST" });
    expect(isAllowedOrigin(request, { allowMissingOrigin: true })).toBe(true);
  });

  it("allows exact same-origin requests", () => {
    const request = new Request("https://example.com/api/test", {
      method: "POST",
      headers: { Origin: "https://example.com" }
    });
    expect(isAllowedOrigin(request)).toBe(true);
  });

  it("rejects cross-origin requests", () => {
    const request = new Request("https://example.com/api/test", {
      method: "POST",
      headers: { Origin: "https://evil.example" }
    });
    expect(isAllowedOrigin(request)).toBe(false);
  });
});
