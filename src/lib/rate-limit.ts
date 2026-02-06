import { NextResponse } from "next/server";

interface RateLimitOptions {
  request: Request;
  key: string;
  limit: number;
  windowMs: number;
}

interface BucketState {
  resetAt: number;
  count: number;
}

function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = request.headers.get("x-real-ip")?.trim();
  return forwarded || realIp || "unknown";
}

function getBucketStore(): Map<string, BucketState> {
  const anyGlobal = globalThis as typeof globalThis & { __rmRateLimit?: Map<string, BucketState> };
  if (!anyGlobal.__rmRateLimit) {
    anyGlobal.__rmRateLimit = new Map<string, BucketState>();
  }
  return anyGlobal.__rmRateLimit;
}

export function rateLimit(options: RateLimitOptions): NextResponse | null {
  const ip = getClientIp(options.request);
  const now = Date.now();
  const store = getBucketStore();
  const bucketKey = `${options.key}:${ip}`;

  const existing = store.get(bucketKey);
  const state: BucketState =
    !existing || existing.resetAt <= now
      ? { resetAt: now + options.windowMs, count: 0 }
      : existing;

  state.count += 1;
  store.set(bucketKey, state);

  const remaining = Math.max(0, options.limit - state.count);
  const retryAfterSeconds = Math.max(1, Math.ceil((state.resetAt - now) / 1000));

  if (state.count <= options.limit) {
    return null;
  }

  return NextResponse.json(
    { message: "Too many requests" },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfterSeconds),
        "X-RateLimit-Limit": String(options.limit),
        "X-RateLimit-Remaining": String(remaining),
        "X-RateLimit-Reset": String(Math.floor(state.resetAt / 1000))
      }
    }
  );
}

