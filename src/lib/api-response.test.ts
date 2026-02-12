import { describe, expect, it } from "vitest";

import {
  apiError,
  apiJson,
  createApiContext,
  finalizeResponse,
  withRequestId,
  type ApiContext
} from "@/lib/api-response";
import { NextResponse } from "next/server";

function makeCtx(overrides?: Partial<ApiContext>): ApiContext {
  return {
    requestId: "test-request-id",
    startMs: Date.now(),
    method: "GET",
    path: "/api/test",
    ...overrides
  };
}

describe("createApiContext", () => {
  it("extracts method and path from a Request", () => {
    const request = new Request("https://example.com/api/foo?bar=1", { method: "POST" });
    const ctx = createApiContext(request);
    expect(ctx.method).toBe("POST");
    expect(ctx.path).toBe("/api/foo");
    expect(ctx.requestId).toBeTruthy();
    expect(ctx.startMs).toBeGreaterThan(0);
  });

  it("uses x-request-id header when present", () => {
    const request = new Request("https://example.com/api/bar", {
      headers: { "x-request-id": "custom-id-123" }
    });
    const ctx = createApiContext(request);
    expect(ctx.requestId).toBe("custom-id-123");
  });

  it("generates a request ID when none is provided", () => {
    const request = new Request("https://example.com/api/baz");
    const ctx = createApiContext(request);
    expect(ctx.requestId).toBeTruthy();
    expect(ctx.requestId.length).toBeGreaterThan(0);
  });
});

describe("withRequestId", () => {
  it("sets x-request-id header on the response", () => {
    const response = new NextResponse("ok", { status: 200 });
    const result = withRequestId(response, "req-abc");
    expect(result.headers.get("x-request-id")).toBe("req-abc");
  });
});

describe("finalizeResponse", () => {
  it("sets x-request-id header and returns the response", () => {
    const ctx = makeCtx({ requestId: "finalize-id" });
    const response = new NextResponse("ok", { status: 200 });
    const result = finalizeResponse(ctx, response);
    expect(result.headers.get("x-request-id")).toBe("finalize-id");
    expect(result.status).toBe(200);
  });

  it("preserves the original status code", () => {
    const ctx = makeCtx();
    const response = new NextResponse(null, { status: 204 });
    const result = finalizeResponse(ctx, response);
    expect(result.status).toBe(204);
  });
});

describe("apiJson", () => {
  it("returns a JSON response with the given body", async () => {
    const ctx = makeCtx({ requestId: "json-req" });
    const response = apiJson(ctx, { ok: true, data: "test" });
    expect(response.status).toBe(200);
    expect(response.headers.get("x-request-id")).toBe("json-req");

    const body = await response.json();
    expect(body).toEqual({ ok: true, data: "test" });
  });

  it("supports custom status code", async () => {
    const ctx = makeCtx();
    const response = apiJson(ctx, { created: true }, { status: 201 });
    expect(response.status).toBe(201);
  });

  it("supports custom headers", () => {
    const ctx = makeCtx();
    const response = apiJson(ctx, {}, { headers: { "X-Custom": "value" } });
    expect(response.headers.get("X-Custom")).toBe("value");
  });
});

describe("apiError", () => {
  it("returns a JSON error response with the correct shape", async () => {
    const ctx = makeCtx({ requestId: "err-req-1" });
    const response = apiError(ctx, {
      status: 400,
      code: "BAD_REQUEST",
      message: "Missing field"
    });

    expect(response.status).toBe(400);
    expect(response.headers.get("x-request-id")).toBe("err-req-1");

    const body = await response.json();
    expect(body).toEqual({
      ok: false,
      code: "BAD_REQUEST",
      message: "Missing field",
      requestId: "err-req-1"
    });
  });

  it("returns 404 NOT_FOUND", async () => {
    const ctx = makeCtx({ requestId: "err-req-2" });
    const response = apiError(ctx, {
      status: 404,
      code: "NOT_FOUND",
      message: "Resource not found"
    });

    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.code).toBe("NOT_FOUND");
  });

  it("returns 500 INTERNAL", async () => {
    const ctx = makeCtx({ requestId: "err-req-3" });
    const response = apiError(ctx, {
      status: 500,
      code: "INTERNAL",
      message: "Something went wrong"
    });

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.code).toBe("INTERNAL");
  });

  it("includes custom headers on error responses", () => {
    const ctx = makeCtx();
    const response = apiError(ctx, {
      status: 429,
      code: "RATE_LIMITED",
      message: "Too fast",
      headers: { "Retry-After": "60" }
    });

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("60");
  });
});
