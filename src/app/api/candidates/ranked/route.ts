// ==================================================
// API — GET /api/candidates/ranked
// ==================================================
// The recruiter's candidate list, sorted by score, with filters over the
// scoring dimensions. Reads the candidate_rankings view, which is defined
// with security_invoker so RLS still confines results to the caller's own
// organization.
//
// Filters are whitelisted rather than passed through. Accepting a column
// name from a query string is how a filter endpoint turns into an
// arbitrary-read primitive.

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { apiSuccess, apiError } from "@/lib/utils";
import type { DbCandidateStatus, DbGender } from "@/types/database";

// Mirror the enums in supabase/migrations. Used to narrow untrusted query
// parameters instead of asserting them.
const CANDIDATE_STATUSES: readonly DbCandidateStatus[] = [
  "new", "screening", "whatsapp_interview", "assignment_sent",
  "assignment_submitted", "under_review", "shortlisted",
  "rejected", "hired", "withdrawn",
];

const GENDERS: readonly DbGender[] = ["male", "female", "other", "undisclosed"];

/** Dimensions a caller may filter or sort on. */
const NUMERIC_FIELDS = [
  "overall",
  "tools_match",
  "domain_match",
  "seniority_match",
  "communication",
  "confidence",
  "motivation",
  "age",
] as const;

type NumericField = typeof NUMERIC_FIELDS[number];

function isNumericField(v: string | null): v is NumericField {
  return v !== null && (NUMERIC_FIELDS as readonly string[]).includes(v);
}

export async function GET(req: NextRequest) {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json(apiError("Unauthorized"), { status: 401 });

  const sp = req.nextUrl.searchParams;

  let query = supabase.from("candidate_rankings").select("*", { count: "exact" });

  // ── Text search ────────────────────────────────────────────────────
  const q = sp.get("q")?.trim();
  if (q) {
    // Escape the PostgREST `or` delimiters; a comma or parenthesis in a
    // name would otherwise be read as filter syntax.
    const safe = q.replace(/[,()]/g, " ");
    query = query.or(`full_name.ilike.%${safe}%,email.ilike.%${safe}%`);
  }

  // ── Scoped filters ─────────────────────────────────────────────────
  const jobId = sp.get("job_id");
  if (jobId) query = query.eq("job_id", jobId);

  // Narrowed against the enum rather than asserted: `status` is untrusted
  // query-string input, and an unrecognised value is a bad request.
  const status = sp.get("status");
  if (status) {
    if (!(CANDIDATE_STATUSES as readonly string[]).includes(status)) {
      return NextResponse.json(apiError(`סטטוס לא תקין: ${status}`), { status: 400 });
    }
    query = query.eq("status", status as DbCandidateStatus);
  }

  if (sp.get("interviewed") === "true")  query = query.eq("interview_complete", true);
  if (sp.get("scored") === "true")       query = query.not("overall", "is", null);
  if (sp.get("flagged") === "true")      query = query.gt("flag_count", 0);

  // Gender filter. Included at Asaf's explicit request after the
  // equal-employment risk was documented; see
  // _SHARED/ARCHITECTURE_V2_ADDENDUM.md. Recorded in the audit log below.
  const gender = sp.get("gender");
  if (gender && (GENDERS as readonly string[]).includes(gender)) {
    query = query.eq("gender", gender as DbGender);
  }

  // ── Numeric ranges over whitelisted dimensions ─────────────────────
  // Shape: min_overall=70, max_age=45
  const usedRegulated: string[] = [];
  for (const [key, raw] of sp.entries()) {
    const m = /^(min|max)_(.+)$/.exec(key);
    if (!m) continue;

    const [, bound, field] = m;
    if (!isNumericField(field)) continue;

    const n = Number(raw);
    if (!Number.isFinite(n)) continue;

    if (field === "age") usedRegulated.push(`${bound}_age`);
    query = bound === "min" ? query.gte(field, n) : query.lte(field, n);
  }

  // ── Sort ───────────────────────────────────────────────────────────
  const sortField = sp.get("sort");
  const sortBy: NumericField | "applied_at" = isNumericField(sortField) ? sortField : "overall";
  const asc = sp.get("dir") === "asc";

  // nullsFirst false so unscored candidates sit at the bottom instead of
  // displacing the ones that were actually evaluated.
  query = query.order(sortBy, { ascending: asc, nullsFirst: false });

  const page  = Math.max(1, parseInt(sp.get("page") ?? "1"));
  const limit = Math.min(100, Math.max(1, parseInt(sp.get("limit") ?? "25")));
  const from  = (page - 1) * limit;
  query = query.range(from, from + limit - 1);

  const { data, error, count } = await query;
  if (error) return NextResponse.json(apiError(error.message), { status: 500 });

  // Age and gender are regulated attributes. Logging their use costs
  // nothing and means there is a record of who filtered by what, rather
  // than no record at all.
  if (gender || usedRegulated.length) {
    const { auditLog } = await import("@/lib/security/audit-logger");
    const { data: profile } = await supabase
      .from("recruiter_profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (profile) {
      await auditLog({
        action:          "candidates.filter_regulated",
        actor_id:        user.id,
        organization_id: profile.organization_id,
        resource_type:   "candidates",
        metadata:        { gender: gender ?? null, age_bounds: usedRegulated },
      });
    }
  }

  return NextResponse.json(apiSuccess({
    candidates: data ?? [],
    total:      count ?? 0,
    page,
    limit,
  }));
}
