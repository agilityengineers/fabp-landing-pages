/**
 * Lightweight per-IP rate limiter using an in-memory token bucket.
 *
 * Scope caveat: this is process-local. On Replit autoscale (multiple Node
 * instances), each instance keeps its own counters, so the effective limit is
 * `limit * instanceCount`. That is still effective at slowing single-IP bursts
 * and stopping accidental loops; it is NOT a substitute for an upstream WAF /
 * CDN rate limit if you ever face determined abuse. If you need a global
 * limit, replace this with a DB- or Redis-backed implementation.
 */

import type { NextRequest } from "next/server";

interface Bucket {
  tokens: number;
  lastRefillMs: number;
}

const BUCKETS = new Map<string, Bucket>();
const MAX_BUCKETS = 10_000; // cheap LRU-ish cap to prevent unbounded memory

function clientKey(req: NextRequest, bucketName: string): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded
    ? forwarded.split(",")[0]?.trim()
    : req.headers.get("x-real-ip") ?? "unknown";
  return `${bucketName}:${ip}`;
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfterSec: number;
}

/**
 * Try to consume one token from the named bucket for this request's IP.
 *
 * @param bucketName  Logical name (e.g. "applications", "playbook-leads").
 * @param limit       Steady-state allowance per `intervalMs` (also the burst).
 * @param intervalMs  Refill window in milliseconds.
 */
export function rateLimit(
  req: NextRequest,
  bucketName: string,
  limit: number,
  intervalMs: number,
): RateLimitResult {
  const key = clientKey(req, bucketName);
  const now = Date.now();
  let bucket = BUCKETS.get(key);
  if (!bucket) {
    bucket = { tokens: limit, lastRefillMs: now };
    if (BUCKETS.size >= MAX_BUCKETS) {
      // Drop one arbitrary entry — simple flood guard.
      const firstKey = BUCKETS.keys().next().value;
      if (firstKey) BUCKETS.delete(firstKey);
    }
    BUCKETS.set(key, bucket);
  } else {
    const elapsed = now - bucket.lastRefillMs;
    if (elapsed > 0) {
      const refill = (elapsed / intervalMs) * limit;
      bucket.tokens = Math.min(limit, bucket.tokens + refill);
      bucket.lastRefillMs = now;
    }
  }

  if (bucket.tokens < 1) {
    const needed = 1 - bucket.tokens;
    const retryAfterSec = Math.max(1, Math.ceil((needed / limit) * (intervalMs / 1000)));
    return { ok: false, remaining: 0, retryAfterSec };
  }

  bucket.tokens -= 1;
  return { ok: true, remaining: Math.floor(bucket.tokens), retryAfterSec: 0 };
}

export function rateLimitResponse(result: RateLimitResult) {
  return new Response(
    JSON.stringify({
      error: "Too many requests. Please slow down and try again shortly.",
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(result.retryAfterSec),
      },
    },
  );
}
