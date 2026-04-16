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
 * On serverless platforms (Vercel) this resets on each cold start.
 *
 * For durable rate limiting, set `UPSTASH_REDIS_REST_URL` and
 * `UPSTASH_REDIS_REST_TOKEN` env vars — the limiter will automatically
 * use Upstash Redis when available.
 */
export interface RateLimitStorage {
  hit(key: string, windowMs: number, limit: number): RateLimitHit | Promise<RateLimitHit>;
}

// ---------------------------------------------------------------------------
// In-memory storage (fallback for dev / when no Redis configured)
// ---------------------------------------------------------------------------

interface BucketState {
  resetAt: number;
  count: number;
}

class InMemoryRateLimitStorage implements RateLimitStorage {
  private store: Map<string, BucketState>;

  constructor() {
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
      !existing || existing.resetAt <= now ? { resetAt: now + windowMs, count: 0 } : existing;

    state.count += 1;
    this.store.set(key, state);

    return { count: state.count, resetAt: state.resetAt };
  }
}

// ---------------------------------------------------------------------------
// Upstash Redis storage (production-ready, serverless-safe)
// ---------------------------------------------------------------------------

class UpstashRateLimitStorage implements RateLimitStorage {
  private url: string;
  private token: string;

  constructor(url: string, token: string) {
    this.url = url;
    this.token = token;
  }

  async hit(key: string, windowMs: number, limit: number): Promise<RateLimitHit> {
    const now = Date.now();
    const windowKey = `rl:${key}:${Math.floor(now / windowMs)}`;
    const resetAt = (Math.floor(now / windowMs) + 1) * windowMs;

    try {
      // Use INCR + EXPIRE in a pipeline for atomic counter with TTL
      const response = await fetch(`${this.url}/pipeline`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify([
          ["INCR", windowKey],
          ["PEXPIRE", windowKey, String(windowMs)]
        ])
      });

      if (!response.ok) {
        // Fallback: allow request if Redis is unreachable (fail-open)
        return { count: 0, resetAt };
      }

      const results = (await response.json()) as Array<{ result: number }>;
      const count = results[0]?.result ?? 0;

      return { count, resetAt };
    } catch {
      // Fail-open: if Redis is down, don't block legitimate requests
      return { count: 0, resetAt };
    }
  }
}

// ---------------------------------------------------------------------------
// Storage selection (auto-detect Upstash or fallback to in-memory)
// ---------------------------------------------------------------------------

function resolveStorage(): RateLimitStorage {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (url && token) {
    return new UpstashRateLimitStorage(url, token);
  }

  return new InMemoryRateLimitStorage();
}

const defaultStorage = resolveStorage();

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
  /** Custom storage backend. Defaults to auto-detected store. */
  storage?: RateLimitStorage;
}

function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = request.headers.get("x-real-ip")?.trim();
  return forwarded || realIp || "unknown";
}

/**
 * Rate limit a request. Returns a 429 NextResponse if limit is exceeded, or null if allowed.
 * Now supports async storage backends (Upstash Redis).
 */
export async function rateLimit(options: RateLimitOptions): Promise<NextResponse | null> {
  const ip = getClientIp(options.request);
  const now = Date.now();
  const storage = options.storage ?? defaultStorage;
  const bucketKey = options.userId ? `${options.key}:${options.userId}` : `${options.key}:${ip}`;

  const result = await storage.hit(bucketKey, options.windowMs, options.limit);
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
