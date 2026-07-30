// API Route — /api/health
// GET — health check for uptime monitors, load balancers, Vercel checks
// Always returns 200 OK with system status

import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { validateEnv } from "@/lib/security/env-validator";

export const dynamic = "force-dynamic";

export async function GET() {
  const startMs  = Date.now();
  const env      = validateEnv();

  // Lightweight DB check — just verify Supabase connection
  let dbStatus: "ok" | "error" = "ok";
  let dbLatencyMs = 0;

  try {
    const supabase = await getSupabaseServerClient();
    const t0       = Date.now();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from("organizations").select("id").limit(1);
    dbLatencyMs = Date.now() - t0;
  } catch {
    dbStatus = "error";
  }

  const totalMs = Date.now() - startMs;
  const status  = dbStatus === "ok" ? 200 : 503;

  return NextResponse.json(
    {
      status:   dbStatus === "ok" ? "healthy" : "degraded",
      version:  process.env.npm_package_version ?? "unknown",
      env:      env.valid ? "ok" : "missing_vars",
      db:       { status: dbStatus, latency_ms: dbLatencyMs },
      latency_ms: totalMs,
      ts:       new Date().toISOString(),
    },
    { status }
  );
}
