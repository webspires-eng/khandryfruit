import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

import { logger } from "@/lib/logging/logger";

type Bucket = { timestamps: number[] };

const buckets = new Map<string, Bucket>();
const distributedLimiters = new Map<string, Ratelimit>();
const MAX_BUCKETS = 10_000;

export type RateLimitOptions = {
  limit: number;
  windowMs: number;
};

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
  providerAvailable: boolean;
};

function inMemoryRateLimit(
  key: string,
  { limit, windowMs }: RateLimitOptions,
  now = Date.now(),
): RateLimitResult {
  if (buckets.size > MAX_BUCKETS) buckets.clear();
  const bucket = buckets.get(key) ?? { timestamps: [] };
  bucket.timestamps = bucket.timestamps.filter((ts) => now - ts < windowMs);
  if (bucket.timestamps.length >= limit) {
    buckets.set(key, bucket);
    const oldest = Math.min(...bucket.timestamps);
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(
        1,
        Math.ceil((oldest + windowMs - now) / 1000),
      ),
      providerAvailable: true,
    };
  }
  bucket.timestamps.push(now);
  buckets.set(key, bucket);
  return {
    allowed: true,
    remaining: limit - bucket.timestamps.length,
    retryAfterSeconds: 0,
    providerAvailable: true,
  };
}

function distributedLimiter(options: RateLimitOptions) {
  const cacheKey = `${options.limit}:${options.windowMs}`;
  const existing = distributedLimiters.get(cacheKey);
  if (existing) return existing;
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });
  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(
      options.limit,
      `${Math.max(1, Math.ceil(options.windowMs / 1000))} s`,
    ),
    prefix: "kdf:ratelimit",
    analytics: false,
  });
  distributedLimiters.set(cacheKey, limiter);
  return limiter;
}

/**
 * Uses a distributed Redis window in production. Provider failure is fail-closed
 * so a Redis outage cannot silently disable abuse controls. Local tests and
 * development use the deterministic process-local implementation.
 */
export async function checkRateLimit(
  key: string,
  options: RateLimitOptions,
  now = Date.now(),
): Promise<RateLimitResult> {
  if (process.env.NODE_ENV !== "production")
    return inMemoryRateLimit(key, options, now);

  if (
    !process.env.UPSTASH_REDIS_REST_URL ||
    !process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    logger.error("rate_limit_provider_unavailable", {
      reason: "not_configured",
    });
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil(options.windowMs / 1000)),
      providerAvailable: false,
    };
  }

  try {
    const result = await distributedLimiter(options).limit(key);
    return {
      allowed: result.success,
      remaining: result.remaining,
      retryAfterSeconds: result.success
        ? 0
        : Math.max(1, Math.ceil((result.reset - Date.now()) / 1000)),
      providerAvailable: true,
    };
  } catch {
    logger.error("rate_limit_provider_unavailable", {
      reason: "request_failed",
    });
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil(options.windowMs / 1000)),
      providerAvailable: false,
    };
  }
}

export function resetRateLimits() {
  buckets.clear();
  distributedLimiters.clear();
}
