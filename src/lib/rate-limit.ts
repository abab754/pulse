import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// If Upstash is not configured, rate limiting is disabled (dev mode).
// In production, set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.
const isConfigured =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = isConfigured
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

/**
 * Ingestion rate limit: 100 requests per 60 seconds per API key.
 * Generous enough for normal use, blocks flooding.
 */
export const ingestionLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(100, "60 s"),
      prefix: "pulse:ingest",
    })
  : null;

/**
 * Explain rate limit: 5 requests per 60 seconds per project.
 * Tight because each call costs money (Claude API).
 */
export const explainLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "60 s"),
      prefix: "pulse:explain",
    })
  : null;
