// ==================================================
// Rate Limiter — in-process sliding window
// Phase 12: Production Hardening
// ==================================================
// Uses a Map-based sliding window per IP+key.
// Suitable for single-instance deploys (Vercel serverless).
// For multi-instance, swap the store for Upstash Redis.
// ==================================================

interface Window {
  count:     number;
  resetAt:   number; // unix ms
}

const store = new Map<string, Window>();

// Cleanup stale entries every 5 minutes to prevent memory leaks
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    store.forEach((win, key) => {
      if (win.resetAt < now) store.delete(key);
    });
  }, 5 * 60_000);
}

export interface RateLimitConfig {
  /** Unique key prefix, e.g. "api:candidates" */
  key:      string;
  /** Client identifier — typically IP address */
  id:       string;
  /** Max requests per window */
  limit:    number;
  /** Window duration in seconds */
  windowSec: number;
}

export interface RateLimitResult {
  allowed:   boolean;
  remaining: number;
  resetAt:   number; // unix ms
  limit:     number;
}

export function checkRateLimit({ key, id, limit, windowSec }: RateLimitConfig): RateLimitResult {
  const storeKey = `${key}:${id}`;
  const now      = Date.now();
  const windowMs = windowSec * 1000;

  let win = store.get(storeKey);

  if (!win || win.resetAt <= now) {
    // Start a fresh window
    win = { count: 1, resetAt: now + windowMs };
    store.set(storeKey, win);
    return { allowed: true, remaining: limit - 1, resetAt: win.resetAt, limit };
  }

  win.count++;
  store.set(storeKey, win);

  const remaining = Math.max(0, limit - win.count);
  return {
    allowed:   win.count <= limit,
    remaining,
    resetAt:   win.resetAt,
    limit,
  };
}

// ─── Pre-defined profiles ────────────────────────────────────────────────────

/** Public auth endpoints (login, register) — 10 req/min */
export const AUTH_LIMIT     = { limit: 10,  windowSec: 60 };

/** Public candidate application — 5 submissions/min per IP */
export const APPLY_LIMIT    = { limit: 5,   windowSec: 60 };

/** AI endpoints (scoring, generation) — 20 req/min */
export const AI_LIMIT       = { limit: 20,  windowSec: 60 };

/** Webhook endpoints (Twilio, Meta) — 120 req/min (high traffic) */
export const WEBHOOK_LIMIT  = { limit: 120, windowSec: 60 };

/** General API — 60 req/min per user */
export const GENERAL_LIMIT  = { limit: 60,  windowSec: 60 };
