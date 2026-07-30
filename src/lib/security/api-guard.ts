// ==================================================
// API Guard — reusable middleware helper for API routes
// Phase 12: Production Hardening
// ==================================================
// Usage inside a route handler:
//
//   const guard = await apiGuard(request, { rateLimit: AI_LIMIT, requireAuth: true });
//   if (guard.error) return guard.error;
//   const { user, ip } = guard;
//
// ==================================================

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { checkRateLimit, GENERAL_LIMIT, type RateLimitConfig } from "./rate-limiter";
import { apiError } from "@/lib/utils";

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-real-ip") ??
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    "unknown"
  );
}

interface GuardOptions {
  requireAuth?: boolean;
  rateLimit?:   Omit<RateLimitConfig, "key" | "id">;
  rateLimitKey?: string;
}

type GuardSuccess = { error: null; user: { id: string; email: string | undefined } | null; ip: string };
type GuardFailure = { error: NextResponse; user: null; ip: string };
type GuardResult  = GuardSuccess | GuardFailure;

export async function apiGuard(
  request: NextRequest,
  options: GuardOptions = {},
): Promise<GuardResult> {
  const ip = getClientIp(request);
  const { requireAuth = true, rateLimit = GENERAL_LIMIT, rateLimitKey } = options;

  // ── 1. Rate limit ────────────────────────────────────────────────────────
  const rlKey = rateLimitKey ?? request.nextUrl.pathname;
  const rl    = checkRateLimit({ key: rlKey, id: ip, ...rateLimit });

  if (!rl.allowed) {
    const res = NextResponse.json(
      apiError("יותר מדי בקשות — נסה שוב בעוד מעט", "RATE_LIMITED"),
      { status: 429 }
    );
    res.headers.set("Retry-After",       String(Math.ceil((rl.resetAt - Date.now()) / 1000)));
    res.headers.set("X-RateLimit-Limit", String(rl.limit));
    res.headers.set("X-RateLimit-Reset", String(rl.resetAt));
    return { error: res, user: null, ip };
  }

  // ── 2. Auth ──────────────────────────────────────────────────────────────
  if (requireAuth) {
    const supabase = await getSupabaseServerClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return {
        error: NextResponse.json(apiError("לא מחובר"), { status: 401 }),
        user:  null,
        ip,
      };
    }

    return { error: null, user: { id: user.id, email: user.email }, ip };
  }

  return { error: null, user: null, ip };
}
