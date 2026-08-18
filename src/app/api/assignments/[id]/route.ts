// API Route — GET /api/assignments/[id]
// Public read for candidate-facing page (no auth) + PATCH for recruiter (auth)

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { apiSuccess, apiError } from "@/lib/utils";

type Params = { params: Promise<{ id: string }> };

// Public GET — candidate uses this to load their assignment. The random
// uuid in the emailed link is the credential, same model as the interview
// token. Served with the service role but hand-picking ONLY the fields a
// candidate should see — never the AI evaluation or recruiter data.
export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params;

  // Demo mode
  if (process.env.NEXT_PUBLIC_DEMO_MODE === "true" || req.cookies.has("hr-demo")) {
    const { DEMO_ASSIGNMENTS } = await import("@/lib/demo/mock-data");
    const assignment = DEMO_ASSIGNMENTS.find(a => a.id === id);
    if (!assignment) return NextResponse.json(apiError("מטלה לא נמצאה"), { status: 404 });
    return NextResponse.json(apiSuccess(assignment));
  }

  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json(apiError("מטלה לא נמצאה"), { status: 404 });
  }

  const admin = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!.trim(),
    process.env.SUPABASE_SERVICE_ROLE_KEY!.trim(),
    { auth: { persistSession: false } }
  );

  const { data } = await admin
    .from("assignments")
    .select("id, title, description, instructions, deadline_hours, status, sent_at, submitted_at, candidates ( full_name )")
    .eq("id", id)
    .maybeSingle();

  if (!data) return NextResponse.json(apiError("מטלה לא נמצאה"), { status: 404 });

  return NextResponse.json(apiSuccess({
    id:              data.id,
    title:           data.title,
    description:     data.description,
    instructions:    data.instructions,
    deadline_hours:  data.deadline_hours,
    status:          data.status,
    sent_at:         data.sent_at,
    submitted:       Boolean(data.submitted_at),
    candidate_name:  (data.candidates as unknown as { full_name: string } | null)?.full_name ?? "",
  }));
}

// PATCH — recruiter sends / updates assignment
export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;

  // Demo mode
  if (process.env.NEXT_PUBLIC_DEMO_MODE === "true" || request.cookies.has("hr-demo")) {
    const body = await request.json().catch(() => ({}));
    return NextResponse.json(apiSuccess({ id, ...body, updated_at: new Date().toISOString() }));
  }

  return NextResponse.json(apiError("Unauthorized"), { status: 401 });
}
