// ==================================================
// API Route — /api/ai/score
// POST — score a candidate (CV parse + AI scoring)
// ==================================================
// Auth required (recruiter/admin).
// Accepts: { candidate_id: string }
// Triggers full scoring pipeline and returns ScoreResult.
// ==================================================

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { scoreCandidate } from "@/lib/ai/agents/scorer";
import { apiSuccess, apiError } from "@/lib/utils";
import { apiGuard } from "@/lib/security/api-guard";
// AI_LIMIT removed — not exported from api-guard (rate limiting handled in middleware)
import { auditLogAsync } from "@/lib/security/audit-logger";
import { z } from "zod";

const schema = z.object({
  candidate_id: z.string().uuid("candidate_id must be a UUID"),
});

export async function POST(request: NextRequest) {
  const guard = await apiGuard(request, { rateLimitKey: "ai:score" });
  if (guard.error) return guard.error;

  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json(apiError("Unauthorized"), { status: 401 });

  const body   = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(apiError(parsed.error.errors[0].message), { status: 400 });
  }

  const { candidate_id } = parsed.data;

  // Verify candidate belongs to recruiter's org
  const { data: profile } = await supabase
    .from("recruiter_profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: candidate } = await supabase
    .from("candidates")
    .select("id, organization_id, full_name")
    .eq("id", candidate_id)
    .single() as { data: any };

  if (!candidate) {
    return NextResponse.json(apiError("מועמד לא נמצא"), { status: 404 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (profile && (profile as any).organization_id !== candidate.organization_id) {
    return NextResponse.json(apiError("Forbidden"), { status: 403 });
  }

  try {
    const result = await scoreCandidate(candidate_id);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orgId = (profile as any)?.organization_id ?? candidate.organization_id;
    auditLogAsync({ action: "ai.score_triggered", actor_id: user.id, resource_type: "candidate", resource_id: candidate_id, organization_id: orgId, metadata: { score: result.score } });
    return NextResponse.json(apiSuccess(result));
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "שגיאה בחישוב הניקוד";
    console.error("[/api/ai/score]", err);
    return NextResponse.json(apiError(message), { status: 500 });
  }
}
