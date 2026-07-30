// API Route — /api/analytics/overview
// GET — org-level KPI summary for the analytics dashboard

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { apiSuccess, apiError } from "@/lib/utils";

export async function GET(req: NextRequest) {
  // Demo mode
  if (process.env.NEXT_PUBLIC_DEMO_MODE === "true" || req.cookies.has("hr-demo")) {
    const { DEMO_ANALYTICS_OVERVIEW } = await import("@/lib/demo/mock-data");
    return NextResponse.json({ success: true, data: DEMO_ANALYTICS_OVERVIEW });
  }

  const supabase = await getSupabaseServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json(apiError("לא מחובר"), { status: 401 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  // Run queries in parallel
  const [
    { count: totalCandidates },
    { count: activeCandidates },
    { count: totalJobs },
    { count: activeJobs },
    { count: hired },
    { count: rejected },
    { data: scoreData },
    { count: whatsappInterviews },
    { count: assignmentsSent },
    { count: shortlisted },
  ] = await Promise.all([
    db.from("candidates").select("id", { count: "exact", head: true }),
    db.from("candidates").select("id", { count: "exact", head: true })
      .not("status", "in", '("rejected","hired","withdrawn")'),
    db.from("jobs").select("id", { count: "exact", head: true }),
    db.from("jobs").select("id", { count: "exact", head: true }).eq("status", "active"),
    db.from("candidates").select("id", { count: "exact", head: true }).eq("status", "hired"),
    db.from("candidates").select("id", { count: "exact", head: true }).eq("status", "rejected"),
    db.from("candidates").select("ai_score").not("ai_score", "is", null),
    db.from("candidates").select("id", { count: "exact", head: true })
      .not("status", "in", '("new","screening")'),
    db.from("assignments").select("id", { count: "exact", head: true }),
    db.from("candidates").select("id", { count: "exact", head: true }).eq("status", "shortlisted"),
  ]);

  // Average AI score
  const scores = (scoreData ?? []).map((r: { ai_score: number }) => r.ai_score).filter(Boolean);
  const avgScore = scores.length > 0
    ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length)
    : null;

  // Conversion rate: hired / total
  const conversionRate = (totalCandidates ?? 0) > 0
    ? Math.round(((hired ?? 0) / (totalCandidates ?? 1)) * 100)
    : 0;

  return NextResponse.json(
    apiSuccess({
      candidates: {
        total:    totalCandidates ?? 0,
        active:   activeCandidates ?? 0,
        hired:    hired ?? 0,
        rejected: rejected ?? 0,
        shortlisted: shortlisted ?? 0,
      },
      jobs: {
        total:  totalJobs ?? 0,
        active: activeJobs ?? 0,
      },
      ai: {
        avg_score:          avgScore,
        scored_count:       scores.length,
        whatsapp_interviews: whatsappInterviews ?? 0,
        assignments_sent:   assignmentsSent ?? 0,
      },
      conversion_rate: conversionRate,
    })
  );
}
