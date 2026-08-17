// ==================================================
// API Route — /api/jobs
// GET  — list jobs for the current org
// POST — create a new job
// ==================================================

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { createJobSchema } from "@/lib/validators/job";
import { slugify, apiSuccess, apiError } from "@/lib/utils";
import type { DbJobStatus } from "@/types/database";
import { agentGuidanceSchema } from "@/lib/validators/agent";
import { generateCampaignCode, landingUrl } from "@/lib/campaigns/code";

// Mirrors the job_status enum in supabase/migrations/..._extensions_and_enums.sql
const JOB_STATUSES: readonly DbJobStatus[] = ["draft", "active", "paused", "closed", "archived"];

// GET /api/jobs
export async function GET(request: NextRequest) {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json(apiError("Unauthorized"), { status: 401 });

  const { searchParams } = new URL(request.url);
  const rawStatus = searchParams.get("status");
  const page   = parseInt(searchParams.get("page") ?? "1");
  const limit  = parseInt(searchParams.get("limit") ?? "20");
  const offset = (page - 1) * limit;

  // `status` is untrusted URL input. Narrow it by checking membership in the
  // enum rather than asserting the type — an unrecognised value is a bad
  // request, not something to hand to the database.
  const status = JOB_STATUSES.find(s => s === rawStatus);
  if (rawStatus && !status) {
    return NextResponse.json(apiError(`Invalid status: ${rawStatus}`), { status: 400 });
  }

  let query = supabase
    .from("jobs")
    .select("*, recruiter_profiles(full_name)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) query = query.eq("status", status);

  const { data, error, count } = await query;
  if (error) return NextResponse.json(apiError(error.message), { status: 500 });

  return NextResponse.json(apiSuccess({ jobs: data, total: count ?? 0, page, limit }));
}

// POST /api/jobs
export async function POST(request: NextRequest) {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json(apiError("Unauthorized"), { status: 401 });

  const body = await request.json();
  const parsed = createJobSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(apiError(parsed.error.errors[0].message), { status: 400 });
  }

  // Get the user's organization
  const { data: profile } = await supabase
    .from("recruiter_profiles")
    .select("organization_id, role")
    .eq("id", user.id)
    .single();

  if (!profile) return NextResponse.json(apiError("Profile not found"), { status: 404 });
  if (!["super_admin", "admin", "recruiter"].includes(profile.role)) {
    return NextResponse.json(apiError("Insufficient permissions"), { status: 403 });
  }

  // Build a unique slug within the org
  const baseSlug = slugify(parsed.data.title);
  const slug = `${baseSlug}-${Date.now().toString(36)}`;

  const { data: job, error } = await supabase
    .from("jobs")
    .insert({
      ...parsed.data,
      organization_id: profile.organization_id,
      created_by:      user.id,
      slug,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json(apiError(error.message), { status: 500 });
  }

  // ── Agent profile ────────────────────────────────────────────────────
  // Guidance is per-job, so each job gets its own profile rather than
  // sharing a global one. Failure here must not lose the job the user just
  // filled in five steps of — it degrades to the org default instead.
  const agent = agentGuidanceSchema.safeParse(body.agent);
  if (agent.success) {
    const { data: agentProfile } = await supabase
      .from("agent_profiles")
      .insert({
        organization_id: profile.organization_id,
        name:            `סוכן — ${parsed.data.title}`,
        persona_name:    agent.data.persona_name,
        tone:            agent.data.tone,
        objective:       agent.data.objective,
        guidelines:      agent.data.guidelines,
        max_questions:   agent.data.max_questions,
      })
      .select("id")
      .single();

    if (agentProfile) {
      await supabase.from("jobs").update({ agent_profile_id: agentProfile.id }).eq("id", job.id);
    }
  }

  // ── Campaign ─────────────────────────────────────────────────────────
  // Only an active job gets one: a draft has nowhere to send candidates,
  // and a live link to an unfinished posting is worse than no link.
  let landing_url: string | null = null;
  if (job.status === "active") {
    // The unique index on `code` is the real guard. Retry a couple of times
    // on the rare collision rather than failing the publish.
    for (let attempt = 0; attempt < 3 && !landing_url; attempt++) {
      const code = generateCampaignCode();
      const url  = landingUrl(code);

      const { error: campaignError } = await supabase
        .from("campaigns")
        .insert({
          organization_id: profile.organization_id,
          job_id:          job.id,
          code,
          channel:         "direct",
          ad_copy:         "",
          landing_url:     url,
        });

      if (!campaignError) landing_url = url;
      else if (campaignError.code !== "23505") break;   // not a unique violation
    }
  }

  return NextResponse.json(apiSuccess({ ...job, landing_url }), { status: 201 });
}
