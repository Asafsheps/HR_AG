// ==================================================
// API — POST /api/companies/activate
// ==================================================
// Turn an imported client job into a live funnel job: a row in `jobs`
// (which the interviewer reads) plus a campaign with a landing link,
// ready to publish. This is the explicit human-approval step after AI
// extraction — activating also marks the client job as reviewed.

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { apiSuccess, apiError, slugify } from "@/lib/utils";
import { generateCampaignCode, landingUrl } from "@/lib/campaigns/code";

export async function POST(request: NextRequest) {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json(apiError("Unauthorized"), { status: 401 });

  const body = await request.json().catch(() => null) as { client_job_id?: string } | null;
  if (!body?.client_job_id) return NextResponse.json(apiError("client_job_id נדרש"), { status: 400 });

  const { data: cj } = await supabase
    .from("client_jobs")
    .select("*, client_companies ( name )")
    .eq("id", body.client_job_id)
    .maybeSingle();
  if (!cj) return NextResponse.json(apiError("המשרה לא נמצאה"), { status: 404 });

  const companyName = (cj.client_companies as unknown as { name: string } | null)?.name ?? "";

  // The interviewer's briefing is assembled from the extraction: what the
  // employer cares about, what the candidate must accept, Asaf's emphases.
  const aiInstructions = [
    cj.business_priority ? `מה חשוב למעסיק: ${cj.business_priority}` : "",
    cj.candidate_expectations ? `על המועמד לקבל: ${cj.candidate_expectations}` : "",
    cj.screening_notes ?? "",
  ].filter(Boolean).join("\n") || null;

  const { data: job, error: jobErr } = await supabase
    .from("jobs")
    .insert({
      organization_id: cj.organization_id,
      created_by:      user.id,
      title:           cj.title,
      slug:            `${slugify(cj.title)}-${Date.now().toString(36)}`,
      description:     cj.description,
      location:        cj.location,
      employment_type: (cj.employment_type as never) ?? null,
      requirements:    [...cj.core_skills, ...(cj.min_years ? [`ניסיון של ${cj.min_years}+ שנים`] : [])],
      ai_instructions: aiInstructions,
      status:          "active",
    })
    .select("id, title")
    .single();

  if (jobErr || !job) {
    console.error("[activate] job insert failed:", jobErr?.message);
    return NextResponse.json(apiError("שגיאה ביצירת המשרה"), { status: 500 });
  }

  // A campaign is what makes the job publishable — create it in the same
  // action so activation ends with a link in hand.
  const code = generateCampaignCode();
  const { error: campErr } = await supabase
    .from("campaigns")
    .insert({
      organization_id: cj.organization_id,
      job_id:          job.id,
      code,
      channel:         "direct",
      ad_copy:         "",
      landing_url:     landingUrl(code),
      is_active:       true,
    });
  if (campErr) console.error("[activate] campaign insert failed:", campErr.message);

  await supabase
    .from("client_jobs")
    .update({ is_reviewed: true })
    .eq("id", cj.id);

  return NextResponse.json(apiSuccess({
    job_id:      job.id,
    title:       job.title,
    company:     companyName,
    campaign_code: campErr ? null : code,
    landing_url:   campErr ? null : landingUrl(code),
  }), { status: 201 });
}
