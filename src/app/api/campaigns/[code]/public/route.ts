// ==================================================
// API — /api/campaigns/[code]/public
// GET — the job behind a campaign code. No auth.
// ==================================================
// This is what the landing page at /j/[code] calls. The code travels in
// the ad link, so attribution happens on click rather than depending on
// the candidate remembering to type who referred them.
//
// Only fields safe for a public page are selected. The funnel counters
// and the organization stay server-side — a competitor should not be able
// to read how many people clicked an ad by opening it.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { apiSuccess, apiError } from "@/lib/utils";
import type { Database } from "@/types/database";

type Params = { params: Promise<{ code: string }> };

// Anonymous visitors have no session, so this uses the anon key directly
// and relies on the campaigns_public_select_active RLS policy.
function publicClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!.trim(),
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!.trim(),
    { auth: { persistSession: false } }
  );
}

function isDemo(req: NextRequest) {
  return process.env.NEXT_PUBLIC_DEMO_MODE?.trim() === "true" || req.cookies.has("hr-demo");
}

export async function GET(req: NextRequest, { params }: Params) {
  const { code } = await params;

  // Codes are uppercase alphanumeric. Reject anything else before it
  // reaches the database.
  if (!/^[A-Z0-9]{3,12}$/.test(code)) {
    return NextResponse.json(apiError("קוד לא תקין"), { status: 400 });
  }

  if (isDemo(req)) {
    const { DEMO_JOBS } = await import("@/lib/demo/mock-data");
    const job = DEMO_JOBS[0];
    return NextResponse.json(apiSuccess({
      code,
      ad_copy: "",
      job: {
        id: job.id,
        title: job.title,
        location: job.location,
        employment_type: job.type,
        description: job.description,
        requirements: job.requirements,
      },
    }));
  }

  const supabase = publicClient();

  const { data, error } = await supabase
    .from("campaigns")
    .select("code, ad_copy, jobs(id, title, location, employment_type, description, requirements)")
    .eq("code", code)
    .eq("is_active", true)
    .maybeSingle();

  if (error) return NextResponse.json(apiError(error.message), { status: 500 });
  if (!data)  return NextResponse.json(apiError("הקמפיין לא נמצא או הסתיים"), { status: 404 });

  // Count the click, but never let a counter failure hide the job from a
  // real candidate — the page mattering more than the metric.
  void supabase.rpc("increment_campaign_metric", { p_code: code, p_metric: "clicks" });

  return NextResponse.json(apiSuccess({
    code:    data.code,
    ad_copy: data.ad_copy,
    job:     data.jobs,
  }));
}
