// API Route — /api/jobs/[id]
// GET, PATCH, DELETE

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { createJobSchema } from "@/lib/validators/job";
import { apiSuccess, apiError } from "@/lib/utils";

type Params = { params: Promise<{ id: string }> };

function isDemo(req: NextRequest) {
  return process.env.NEXT_PUBLIC_DEMO_MODE?.trim() === "true" || req.cookies.has("hr-demo");
}

export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params;

  // Without this branch the edit page could not load at all in demo mode —
  // it got a 401 and showed "Unauthorized" instead of the job.
  if (isDemo(req)) {
    const { DEMO_JOBS } = await import("@/lib/demo/mock-data");
    const job = DEMO_JOBS.find(j => j.id === id || j.slug === id);
    if (!job) return NextResponse.json(apiError("משרה לא נמצאה"), { status: 404 });

    // The demo fixtures predate the agent guidance step, so supply a
    // representative profile rather than leaving the step blank.
    return NextResponse.json(apiSuccess({
      ...job,
      culture_fit_expectations: null,
      rejection_rules: [],
      ai_instructions: null,
      agent_profiles: {
        persona_name:  "עמי",
        tone:          "friendly",
        objective:     "לוודא שהמועמד באמת עבד עם הכלים שרשם, ולא רק שמע עליהם.",
        guidelines:    "אל תדון בשכר. אם המועמד שואל, אמור שזה ייסגר בשלב הבא.",
        max_questions: 8,
      },
    }));
  }

  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json(apiError("Unauthorized"), { status: 401 });

  const { data, error } = await supabase
    .from("jobs")
    .select("*, recruiter_profiles(full_name, avatar_url)")
    .eq("id", id)
    .single();

  if (error || !data) return NextResponse.json(apiError("Not found"), { status: 404 });
  return NextResponse.json(apiSuccess(data));
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;

  if (isDemo(request)) {
    const body = await request.json().catch(() => ({}));
    // Echo the payload so the wizard behaves normally, but say plainly
    // that nothing was written — demo mode has no database.
    return NextResponse.json(apiSuccess({ ...body, id, _demo: true, _persisted: false }));
  }

  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json(apiError("Unauthorized"), { status: 401 });

  const body = await request.json();
  const parsed = createJobSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(apiError(parsed.error.errors[0].message), { status: 400 });
  }

  const { data, error } = await supabase
    .from("jobs")
    .update(parsed.data)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json(apiError(error.message), { status: 500 });
  return NextResponse.json(apiSuccess(data));
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json(apiError("Unauthorized"), { status: 401 });

  // Soft delete — set status to archived
  const { error } = await supabase
    .from("jobs")
    .update({ status: "archived" })
    .eq("id", id);

  if (error) return NextResponse.json(apiError(error.message), { status: 500 });
  return NextResponse.json(apiSuccess({ archived: true }));
}
