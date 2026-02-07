import { NextResponse } from "next/server";

import { getRequestId } from "@/lib/request-id";

export type ApiErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "PAYLOAD_TOO_LARGE"
  | "RATE_LIMITED"
  | "INVALID_ORIGIN"
  | "SUPABASE_MISCONFIG"
  | "INTERNAL";

export interface ApiErrorBody {
  ok: false;
  code: ApiErrorCode;
  message: string;
  requestId: string;
}

export interface ApiContext {
  requestId: string;
  startMs: number;
  method: string;
  path: string;
}

export function createApiContext(request: Request): ApiContext {
  const requestId = getRequestId(request);
  const url = new URL(request.url);
  return {
    requestId,
    startMs: Date.now(),
    method: request.method,
    path: url.pathname
  };
}

function logApi(ctx: ApiContext, status: number, extra?: Record<string, unknown>) {
  // Structured logs: easy to grep and feed into log tooling.
  const durationMs = Date.now() - ctx.startMs;
  const level = status >= 500 ? "error" : status >= 400 ? "warn" : "info";
  const payload = {
    level,
    requestId: ctx.requestId,
    method: ctx.method,
    path: ctx.path,
    status,
    durationMs,
    ...(extra ?? {})
  };
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(payload));
}

export function withRequestId(response: NextResponse, requestId: string): NextResponse {
  response.headers.set("x-request-id", requestId);
  return response;
}

export function finalizeResponse(
  ctx: ApiContext,
  response: NextResponse,
  extra?: Record<string, unknown>
): NextResponse {
  response.headers.set("x-request-id", ctx.requestId);
  logApi(ctx, response.status, extra);
  return response;
}

export function apiJson<T>(
  ctx: ApiContext,
  body: T,
  options?: { status?: number; headers?: Record<string, string> }
): NextResponse {
  const status = options?.status ?? 200;
  const response = NextResponse.json(body, {
    status,
    headers: options?.headers
  });
  response.headers.set("x-request-id", ctx.requestId);
  logApi(ctx, status);
  return response;
}

export function apiError(
  ctx: ApiContext,
  input: {
    status: number;
    code: ApiErrorCode;
    message: string;
    headers?: Record<string, string>;
  }
): NextResponse {
  const response = NextResponse.json(
    {
      ok: false,
      code: input.code,
      message: input.message,
      requestId: ctx.requestId
    } satisfies ApiErrorBody,
    {
      status: input.status,
      headers: input.headers
    }
  );
  response.headers.set("x-request-id", ctx.requestId);
  logApi(ctx, input.status, { code: input.code });
  return response;
}
