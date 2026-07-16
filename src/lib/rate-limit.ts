/**
 * In-memory sliding-window rate limiter for public form submissions. Scoped
 * per server instance, which is sufficient as a first abuse barrier for the
 * current single-region deployment; swap the store for Redis/Upstash when the
 * app scales horizontally.
 */
type Bucket = { timestamps: number[] };

const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 10_000;

export type RateLimitOptions = {
  /** Maximum number of events allowed inside the window. */
  limit: number;
  /** Window length in milliseconds. */
  windowMs: number;
};

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

export function checkRateLimit(
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
      retryAfterSeconds: Math.max(1, Math.ceil((oldest + windowMs - now) / 1000)),
    };
  }
  bucket.timestamps.push(now);
  buckets.set(key, bucket);
  return {
    allowed: true,
    remaining: limit - bucket.timestamps.length,
    retryAfterSeconds: 0,
  };
}

/** Test helper – clears all tracked windows. */
export function resetRateLimits() {
  buckets.clear();
}
