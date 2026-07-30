// ==================================================
// Audit Logger
// Phase 12: Production Hardening
// ==================================================
// Writes to the `audit_logs` table (append-only, no RLS bypass needed
// since service role is used for all server-side writes).
//
// Usage:
//   await auditLog({ action: "candidate.status_changed", ... });
// ==================================================

import { getSupabaseAdminClient } from "@/lib/supabase/server";

export type AuditAction =
  | "candidate.status_changed"
  | "candidate.note_added"
  | "candidate.note_deleted"
  | "job.created"
  | "job.updated"
  | "job.archived"
  | "assignment.created"
  | "assignment.evaluated"
  | "ai.score_triggered"
  | "auth.login"
  | "auth.register"
  | "auth.logout";

export interface AuditEvent {
  action:        AuditAction;
  actor_id?:     string | null;
  resource_type: string;
  resource_id?:  string | null;
  metadata?:     Record<string, unknown>;
  organization_id: string;
}

export async function auditLog(event: AuditEvent): Promise<void> {
  try {
    const admin = await getSupabaseAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin as any).from("audit_logs").insert({
      organization_id: event.organization_id,
      actor_id:        event.actor_id ?? null,
      action:          event.action,
      resource_type:   event.resource_type,
      resource_id:     event.resource_id ?? null,
      metadata:        event.metadata ?? {},
    });
  } catch (err) {
    // Audit log failures must never break the primary operation
    console.error("[AUDIT] Failed to write audit log:", err);
  }
}

// Fire-and-forget variant (no await needed)
export function auditLogAsync(event: AuditEvent): void {
  void auditLog(event);
}
