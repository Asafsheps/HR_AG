// API Route — POST /api/assignments/[id]/evaluate
// Recruiter triggers AI evaluation of a submitted assignment (auth required).

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { evaluateAssignment } from "@/lib/ai/agents/assignment-evaluator";
import { apiSuccess, apiError } from "@/lib/utils";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json(apiError("Unauthorized"), { status: 401 });

  // Verify assignment is submitted
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: assignment } = await supabase
    .from("assignments")
    .select("id, status")
    .eq("id", id)
    .single() as { data: any };

  if (!assignment) return NextResponse.json(apiError("מטלה לא נמצאה"), { status: 404 });
  if (assignment.status !== "submitted") {
    return NextResponse.json(apiError("המטלה טרם הוגשה על ידי המועמד"), { status: 400 });
  }

  try {
    const result = await evaluateAssignment(id);
    return NextResponse.json(apiSuccess(result));
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "שגיאה בהערכת המטלה";
    return NextResponse.json(apiError(message), { status: 500 });
  }
}
