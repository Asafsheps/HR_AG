// ==================================================
// Next.js Instrumentation Hook
// Runs once on server startup (both Node and Edge runtimes)
// Phase 12: Production Hardening
// ==================================================

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Validate environment variables on startup
    const { assertEnv } = await import("@/lib/security/env-validator");
    assertEnv();
  }
}
