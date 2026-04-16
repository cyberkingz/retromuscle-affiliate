import { describe, expect, it } from "vitest";

import { readJsonBodyWithLimit } from "@/lib/request-body";

function jsonRequest(body: string, headers: Record<string, string> = {}): Request {
  return new Request("https://example.com/api/test", {
    method: "POST",
    body,
    headers: { "content-type": "application/json", ...headers }
  });
}

describe("readJsonBodyWithLimit", () => {
  it("returns parsed JSON from a valid body", async () => {
    const payload = { name: "test", count: 42 };
    const request = jsonRequest(JSON.stringify(payload));

    const result = await readJsonBodyWithLimit(request, { maxBytes: 1024 });
    expect(result).toEqual(payload);
  });

  it("throws PAYLOAD_TOO_LARGE when content-length exceeds maxBytes", async () => {
    const body = JSON.stringify({ data: "x".repeat(200) });
    const request = jsonRequest(body, { "content-length": "500" });

    await expect(readJsonBodyWithLimit(request, { maxBytes: 100 })).rejects.toThrow(
      "PAYLOAD_TOO_LARGE"
    );
  });

  it("throws PAYLOAD_TOO_LARGE when actual body size exceeds maxBytes (no content-length header)", async () => {
    const largeBody = JSON.stringify({ data: "x".repeat(500) });
    // Create request without explicit content-length so the header check is bypassed
    // and the byte-length check catches it
    const request = new Request("https://example.com/api/test", {
      method: "POST",
      body: largeBody
    });

    await expect(readJsonBodyWithLimit(request, { maxBytes: 10 })).rejects.toThrow(
      "PAYLOAD_TOO_LARGE"
    );
  });

  it("throws INVALID_JSON for non-JSON body", async () => {
    const request = jsonRequest("this is not json");

    await expect(readJsonBodyWithLimit(request, { maxBytes: 1024 })).rejects.toThrow(
      "INVALID_JSON"
    );
  });

  it("works with empty object {}", async () => {
    const request = jsonRequest("{}");

    const result = await readJsonBodyWithLimit(request, { maxBytes: 1024 });
    expect(result).toEqual({});
  });

  it("handles unicode content correctly (multi-byte chars)", async () => {
    // A single emoji can be 4 bytes in UTF-8
    const payload = { emoji: "\u{1F4AA}\u{1F3CB}" }; // muscle + weight lifter
    const body = JSON.stringify(payload);
    // The body should be well under 1024 bytes
    const request = jsonRequest(body);

    const result = await readJsonBodyWithLimit(request, { maxBytes: 1024 });
    expect(result).toEqual(payload);
  });

  it("rejects unicode body that exceeds maxBytes in byte length", async () => {
    // Each emoji is 4 bytes in UTF-8, so 10 emojis = 40 bytes just for the emoji data
    const emojis = "\u{1F4AA}".repeat(20);
    const body = JSON.stringify({ data: emojis });
    // The JSON string will be well over 10 bytes in UTF-8
    const request = new Request("https://example.com/api/test", {
      method: "POST",
      body
    });

    await expect(readJsonBodyWithLimit(request, { maxBytes: 10 })).rejects.toThrow(
      "PAYLOAD_TOO_LARGE"
    );
  });

  it("works with nested JSON structures", async () => {
    const payload = { a: { b: { c: [1, 2, 3] } } };
    const request = jsonRequest(JSON.stringify(payload));

    const result = await readJsonBodyWithLimit(request, { maxBytes: 1024 });
    expect(result).toEqual(payload);
  });

  it("works with JSON arrays as the root value", async () => {
    const payload = [1, 2, 3];
    const request = jsonRequest(JSON.stringify(payload));

    const result = await readJsonBodyWithLimit(request, { maxBytes: 1024 });
    expect(result).toEqual([1, 2, 3]);
  });

  it("allows body exactly at the byte limit", async () => {
    // Build a body that is exactly N bytes
    const body = "{}"; // 2 bytes in UTF-8
    const request = jsonRequest(body);

    const result = await readJsonBodyWithLimit(request, { maxBytes: 2 });
    expect(result).toEqual({});
  });

  it("rejects body that is 1 byte over the limit", async () => {
    const body = "{ }"; // 3 bytes in UTF-8
    const request = new Request("https://example.com/api/test", {
      method: "POST",
      body
    });

    await expect(readJsonBodyWithLimit(request, { maxBytes: 2 })).rejects.toThrow(
      "PAYLOAD_TOO_LARGE"
    );
  });

  it("skips content-length check when header is not a finite number", async () => {
    // Non-finite content-length should be ignored, falling through to byte-length check
    const body = JSON.stringify({ ok: true });
    const request = jsonRequest(body, { "content-length": "not-a-number" });

    const result = await readJsonBodyWithLimit(request, { maxBytes: 1024 });
    expect(result).toEqual({ ok: true });
  });
});
