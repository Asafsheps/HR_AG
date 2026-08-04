// ==================================================
// API — /api/agent/config
// GET — the agent profile for a job (or the org default)
// PUT — save it
// ==================================================
// Previously a stub that returned 501: the UI existed but there was
// nothing to persist to. Migration 014 added agent_profiles, so this
// now reads and writes for real.
//
// Query param `jobId` selects the profile attached to that job. Without
// it, or when the job has none, the organization's default is used —
// which is why exactly one row per org may carry is_default.

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { apiSuccess, apiError } from "@/lib/utils";
import { agentProfileSchema } from "@/lib/validators/agent";

function isDemo(req: NextRequest) {
  return process.env.NEXT_PUBLIC_DEMO_MODE?.trim() === "true" || req.cookies.has("hr-demo");
}

export async function GET(req: NextRequest) {
  if (isDemo(req)) {
    const { DEMO_AGENT_CONFIG } = await import("@/lib/demo/mock-data");
    return NextResponse.json(apiSuccess(DEMO_AGENT_CONFIG));
  }

  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json(apiError("Unauthorized"), { status: 401 });

  const jobId = req.nextUrl.searchParams.get("jobId");

  // A job-specific profile wins; otherwise fall back to the org default.
  if (jobId) {
    const { data: job } = await supabase
      .from("jobs")
      .select("agent_profile_id")
      .eq("id", jobId)
      .single();

    if (job?.agent_profile_id) {
      const { data, error } = await supabase
        .from("agent_profiles")
        .select("*")
        .eq("id", job.agent_profile_id)
        .single();

      if (error) return NextResponse.json(apiError(error.message), { status: 500 });
      return NextResponse.json(apiSuccess(data));
    }
  }

  const { data, error } = await supabase
    .from("agent_profiles")
    .select("*")
    .eq("is_default", true)
    .maybeSingle();

  if (error) return NextResponse.json(apiError(error.message), { status: 500 });

  // No profile configured yet is a normal first-run state, not an error.
  return NextResponse.json(apiSuccess(data ?? null));
}

export async function PUT(req: NextRequest) {
  if (isDemo(req)) {
    // Demo mode has no database. Echo the payload back so the UI behaves
    // normally, but say plainly that nothing was persisted.
    const body = await req.json().catch(() => ({}));
    return NextResponse.json(apiSuccess({ ...body, _demo: true, _persisted: false }));
  }

  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json(apiError("Unauthorized"), { status: 401 });

  const { data: profile } = await supabase
    .from("recruiter_profiles")
    .select("organization_id, role")
    .eq("id", user.id)
    .single();

  if (!profile) return NextResponse.json(apiError("Profile not found"), { status: 403 });
  if (!["super_admin", "admin", "recruiter"].includes(profile.role)) {
    return NextResponse.json(apiError("Forbidden"), { status: 403 });
  }

  const parsed = agentProfileSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      apiError(parsed.error.issues.map(i => `${i.path.join(".")}: ${i.message}`).join("; ")),
      { status: 400 }
    );
  }

  const { id, jobId, ...fields } = parsed.data;

  // organization_id is set from the session on insert only — never taken
  // from the request body, and never rewritten on update. Otherwise a
  // caller could move a profile into another organization.
  const { data, error } = id
    ? await supabase.from("agent_profiles").update(fields).eq("id", id).select().single()
    : await supabase
        .from("agent_profiles")
        .insert({ ...fields, organization_id: profile.organization_id })
        .select()
        .single();

  if (error) return NextResponse.json(apiError(error.message), { status: 500 });

  // Attach to the job only after the profile itself saved successfully.
  if (jobId && data) {
    const { error: linkError } = await supabase
      .from("jobs")
      .update({ agent_profile_id: data.id })
      .eq("id", jobId);

    if (linkError) {
      return NextResponse.json(
        apiError(`Profile saved but not linked to the job: ${linkError.message}`),
        { status: 500 }
      );
    }
  }

  return NextResponse.json(apiSuccess(data));
}
