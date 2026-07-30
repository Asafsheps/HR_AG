import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { checkRateLimit, AUTH_LIMIT, APPLY_LIMIT, WEBHOOK_LIMIT } from "@/lib/security/rate-limiter";

// Routes that require authentication
const PROTECTED_PATHS = [
  "/dashboard",
  "/jobs",
  "/candidates",
  "/conversations",
  "/analytics",
  "/agent",
  "/settings",
];

// Public paths — skip all auth checks (apply page + its APIs)
const PUBLIC_PATHS = ["/apply", "/api/apply"];

// Routes only for unauthenticated users (redirect away if logged in)
const AUTH_PATHS = ["/login", "/register"];

function getIp(req: NextRequest): string {
  return (
    req.headers.get("x-real-ip") ??
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    "unknown"
  );
}

function rateLimitResponse(resetAt: number, limit: number): NextResponse {
  const res = NextResponse.json(
    { success: false, error: "יותר מדי בקשות — נסה שוב בעוד מעט" },
    { status: 429 }
  );
  res.headers.set("Retry-After",       String(Math.ceil((resetAt - Date.now()) / 1000)));
  res.headers.set("X-RateLimit-Limit", String(limit));
  res.headers.set("X-RateLimit-Reset", String(resetAt));
  return res;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip           = getIp(request);

  // ── 0a. Public paths — always allow (apply page, etc.) ────────────────────
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // ── 0. Demo mode bypass ────────────────────────────────────────────────────
  const isDemoMode =
    process.env.NEXT_PUBLIC_DEMO_MODE === "true" ||
    request.cookies.has("hr-demo");

  if (isDemoMode) {
    const isAuthRoute = AUTH_PATHS.some((p) => pathname.startsWith(p));
    if (isAuthRoute) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // ── 1. Rate limiting for sensitive paths ───────────────────────────────────

  // Auth endpoints (login / register actions)
  if (pathname.startsWith("/api/auth") || AUTH_PATHS.some((p) => pathname.startsWith(p))) {
    const rl = checkRateLimit({ key: "auth", id: ip, ...AUTH_LIMIT });
    if (!rl.allowed) return rateLimitResponse(rl.resetAt, rl.limit);
  }

  // Public candidate apply endpoint
  if (pathname === "/api/candidates" && request.method === "POST") {
    const rl = checkRateLimit({ key: "apply", id: ip, ...APPLY_LIMIT });
    if (!rl.allowed) return rateLimitResponse(rl.resetAt, rl.limit);
  }

  // Webhook endpoints — high-frequency but still bounded
  if (pathname.startsWith("/api/webhooks/")) {
    const rl = checkRateLimit({ key: "webhook", id: ip, ...WEBHOOK_LIMIT });
    if (!rl.allowed) return rateLimitResponse(rl.resetAt, rl.limit);
  }

  // ── 2. Session refresh (Supabase) ──────────────────────────────────────────
  const response = await updateSession(request);

  // ── 3. Auth guard for protected dashboard paths ────────────────────────────
  const isAuthenticated = response.cookies.has("sb-access-token") ||
    request.cookies.has("sb-access-token") ||
    [...request.cookies.getAll()].some((c) => c.name.includes("-auth-token"));

  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p));
  const isAuthRoute  = AUTH_PATHS.some((p) => pathname.startsWith(p));

  if (isProtected && !isAuthenticated) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  if (isAuthRoute && isAuthenticated) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // ── 4. Add rate-limit headers to all API responses ────────────────────────
  if (pathname.startsWith("/api/")) {
    response.headers.set("X-Content-Type-Options", "nosniff");
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
