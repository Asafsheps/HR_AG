// API Route — /api/analytics/jobs
// GET — per-job candidate stats

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { apiSuccess, apiError } from "@/lib/utils";

export async function GET(req: NextRequest) {
  if (process.env.NEXT_PUBLIC_DEMO_MODE === "true" || req.cookies.has("hr-demo")) {
    const { DEMO_JOBS } = await import("@/lib/demo/mock-data");
    return NextResponse.json({ success: true, data: DEMO_JOBS });
  }
  const supabase = await getSupabaseServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json(apiError("לא מחובר"), { status: 401 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data: jobs, error } = await db
    .from("jobs")
    .select(`
      id, title, status, department, created_at,
      candidates ( id, status, ai_score )
    `)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) return NextResponse.json(apiError("שגיאה בטעינת משרות"), { status: 500 });

  const result = (jobs ?? []).map((job: {
    id: string; title: string; status: string;
    department: string | null; created_at: string;
    candidates: { id: string; status: string; ai_score: number | null }[];
  }) => {
    const cands   = job.candidates ?? [];
    const scored  = cands.filter((c) => c.ai_score != null);
    const avgScore = scored.length > 0
      ? Math.round(scored.reduce((s, c) => s + (c.ai_score ?? 0), 0) / scored.length)
      : null;

    return {
      id:          job.id,
      title:       job.title,
      status:      job.status,
      department:  job.department,
      created_at:  job.created_at,
      total:       cands.length,
      shortlisted: cands.filter((c) => c.status === "shortlisted").length,
      hired:       cands.filter((c) => c.status === "hired").length,
      rejected:    cands.filter((c) => c.status === "rejected").length,
      avg_score:   avgScore,
    };
  });

  return NextResponse.json(apiSuccess(result));
}
