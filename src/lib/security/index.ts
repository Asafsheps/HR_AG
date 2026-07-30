// ==================================================
// Security — public exports
// Phase 12: Production Hardening
// ==================================================

export { checkRateLimit, AUTH_LIMIT, APPLY_LIMIT, AI_LIMIT, WEBHOOK_LIMIT, GENERAL_LIMIT } from "./rate-limiter";
export type { RateLimitConfig, RateLimitResult } from "./rate-limiter";

export { apiGuard } from "./api-guard";

export { withErrorHandler, safeHandler } from "./api-error-handler";

export { auditLog, auditLogAsync } from "./audit-logger";
export type { AuditAction, AuditEvent } from "./audit-logger";

export { validateEnv, assertEnv } from "./env-validator";
export type { EnvValidationResult } from "./env-validator";
