// WARNING: This rate limiter uses in-memory storage. On serverless platforms (Vercel),
// each invocation gets a fresh Map, making rate limiting ineffective.
// For production: replace with Upstash Redis (@upstash/ratelimit) or Vercel KV.
// See: https://upstash.com/docs/redis/sdks/ratelimit-ts/overview

import { NextResponse } from "next/server";

import { apiError, type ApiContext } from "@/lib/api-response";

// ---------------------------------------------------------------------------
// Rate-limit storage interface
// ---------------------------------------------------------------------------

/** Result returned by a storage backend after recording a hit. */
export interface RateLimitHit {
  /** Total requests recorded in the current window (including this one). */
  count: number;
  /** Unix-ms timestamp when the current window resets. */
  resetAt: number;
}

/**
 * Pluggable storage backend for the rate limiter.
 *
 * The default implementation uses an in-memory `Map` attached to `globalThis`.
 * To switch to a durable store (e.g. Upstash Redis), implement this interface
 * and pass the instance to `rateLimit()` via the `storage` option.
 *
 * ```ts
 * // Example: Upstash Redis adapter (pseudo-code)
 * import { Ratelimit } from "@upstash/ratelimit";
 * import { Redis } from "@upstash/redis";
 *
 * class UpstashRateLimitStorage implements RateLimitStorage {
 *   private ratelimit = new Ratelimit({
 *     redis: Redis.fromEnv(),
 *     limiter: Ratelimit.slidingWindow(10, "60 s"),
 *   });
 *
 *   async hit(key: string, windowMs: number): Promise<RateLimitHit> {
 *     const { remaining, reset } = await this.ratelimit.limit(key);
 *     return { count: 10 - remaining, resetAt: reset };
 *   }
 * }
 * ```
 */
export interface RateLimitStorage {
  /**
   * Record a single request hit for the given key.
   *
   * @param key      - Unique bucket identifier (e.g. `"upload:/ip"` or `"upload:/userId"`).
   * @param windowMs - Duration of the rate-limit window in milliseconds.
   * @returns The current hit count and window reset timestamp.
   */
  hit(key: string, windowMs: number): RateLimitHit | Promise<RateLimitHit>;
}

// ---------------------------------------------------------------------------
// In-memory storage (default)
// ---------------------------------------------------------------------------

interface BucketState {
  resetAt: number;
  count: number;
}

class InMemoryRateLimitStorage implements RateLimitStorage {
  private store: Map<string, BucketState>;

  constructor() {
    // Attach to globalThis so the map survives across imports in long-lived
    // runtimes (e.g. `next dev`). On serverless this is still per-invocation.
    const anyGlobal = globalThis as typeof globalThis & {
      __rmRateLimit?: Map<string, BucketState>;
    };
    if (!anyGlobal.__rmRateLimit) {
      anyGlobal.__rmRateLimit = new Map<string, BucketState>();
    }
    this.store = anyGlobal.__rmRateLimit;
  }

  hit(key: string, windowMs: number): RateLimitHit {
    const now = Date.now();
    const existing = this.store.get(key);
    const state: BucketState =
      !existing || existing.resetAt <= now
        ? { resetAt: now + windowMs, count: 0 }
        : existing;

    state.count += 1;
    this.store.set(key, state);

    return { count: state.count, resetAt: state.resetAt };
  }
}

/** Singleton default storage instance. */
const defaultStorage = new InMemoryRateLimitStorage();

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

interface RateLimitOptions {
  request: Request;
  ctx: ApiContext;
  key: string;
  limit: number;
  windowMs: number;
  /** When provided, the rate limit bucket is scoped to this user (appended to key). */
  userId?: string;
  /** Custom storage backend. Defaults to the built-in in-memory store. */
  storage?: RateLimitStorage;
}

function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = request.headers.get("x-real-ip")?.trim();
  return forwarded || realIp || "unknown";
}

export function rateLimit(options: RateLimitOptions): NextResponse | null {
  const ip = getClientIp(options.request);
  const now = Date.now();
  const storage = options.storage ?? defaultStorage;
  const bucketKey = options.userId
    ? `${options.key}:${options.userId}`
    : `${options.key}:${ip}`;

  const result = storage.hit(bucketKey, options.windowMs);

  // Support both sync and async storage — but the current callers are sync.
  // If storage.hit returns a Promise, this will need an async wrapper.
  if (result instanceof Promise) {
    // TODO: Convert rateLimit to async when using an async storage backend.
    throw new Error(
      "rateLimit() does not support async storage yet. " +
        "Wrap the call in an async helper or convert rateLimit to async."
    );
  }

  const { count, resetAt } = result;
  const remaining = Math.max(0, options.limit - count);
  const retryAfterSeconds = Math.max(1, Math.ceil((resetAt - now) / 1000));

  if (count <= options.limit) {
    return null;
  }

  return apiError(options.ctx, {
    status: 429,
    code: "RATE_LIMITED",
    message: "Too many requests",
    headers: {
      "Retry-After": String(retryAfterSeconds),
      "X-RateLimit-Limit": String(options.limit),
      "X-RateLimit-Remaining": String(remaining),
      "X-RateLimit-Reset": String(Math.floor(resetAt / 1000))
    }
  });
}
