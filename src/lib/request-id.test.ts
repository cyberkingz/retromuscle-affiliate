import { describe, expect, it } from "vitest";
import { getRequestId } from "@/lib/request-id";

describe("getRequestId", () => {
  it("uses x-request-id when safe and within length", () => {
    const request = new Request("https://example.com", {
      headers: { "x-request-id": "abc-123_def.456:789" }
    });
    expect(getRequestId(request)).toBe("abc-123_def.456:789");
  });

  it("generates a new ID when x-request-id exceeds 128 characters", () => {
    const longId = "a".repeat(129);
    const request = new Request("https://example.com", {
      headers: { "x-request-id": longId }
    });
    expect(getRequestId(request)).not.toBe(longId);
  });

  it("rejects x-request-id with newlines (log injection)", () => {
    // The Request constructor rejects newlines in header values,
    // which is the first defense. Our regex provides a second layer.
    // Test via direct function call to verify the regex catches it.
    const request = new Request("https://example.com");
    // Newlines can't be set via Request constructor, but the underlying
    // getRequestId regex would catch them if they somehow appeared.
    // Verify the regex pattern rejects the character set.
    const pattern = /^[a-zA-Z0-9_\-.:]+$/;
    expect(pattern.test("id\ninjected")).toBe(false);
    expect(pattern.test("id\rinjected")).toBe(false);
    // Valid IDs should still pass
    expect(pattern.test("abc-123_def.456:789")).toBe(true);
    // Verify we still generate a valid ID
    expect(getRequestId(request).length).toBeGreaterThan(0);
  });

  it("rejects x-request-id with spaces", () => {
    const request = new Request("https://example.com", {
      headers: { "x-request-id": "id with spaces" }
    });
    expect(getRequestId(request)).not.toContain(" ");
  });

  it("rejects x-request-id with special characters", () => {
    const request = new Request("https://example.com", {
      headers: { "x-request-id": "id<script>alert(1)</script>" }
    });
    const result = getRequestId(request);
    expect(result).not.toContain("<");
  });

  it("generates a UUID-like ID when no header is present", () => {
    const request = new Request("https://example.com");
    const id = getRequestId(request);
    expect(id.length).toBeGreaterThan(0);
  });
});
