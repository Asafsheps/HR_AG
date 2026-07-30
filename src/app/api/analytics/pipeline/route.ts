// API Route — /api/analytics/pipeline
// GET — candidate counts per pipeline stage + score distribution

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { apiSuccess, apiError } from "@/lib/utils";

const STAGES = [
  "new", "screening", "whatsapp_interview",
  "assignment_sent", "assignment_submitted", "under_review",
  "shortlisted", "rejected", "hired", "withdrawn",
];

const STAGE_LABELS: Record<string, string> = {
  new:                  "חדש",
  screening:            "סינון",
  whatsapp_interview:   "ריאיון WA",
  assignment_sent:      "מטלה נשלחה",
  assignment_submitted: "מטלה הוגשה",
  under_review:         "בבחינה",
  shortlisted:          "מועדף",
  rejected:             "נדחה",
  hired:                "התקבל",
  withdrawn:            "נסוג",
};

export async function GET(req: NextRequest) {
  if (process.env.NEXT_PUBLIC_DEMO_MODE === "true" || req.cookies.has("hr-demo")) {
    const { DEMO_ANALYTICS_PIPELINE } = await import("@/lib/demo/mock-data");
    return NextResponse.json({ success: true, data: DEMO_ANALYTICS_PIPELINE });
  }
  const supabase = await getSupabaseServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json(apiError("לא מחובר"), { status: 401 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  // Get all candidates with status + score + created_at
  const { data: candidates, error } = await db
    .from("candidates")
    .select("status, ai_score, created_at");

  if (error) return NextResponse.json(apiError("שגיאה בטעינת נתונים"), { status: 500 });

  // Pipeline funnel
  const pipeline = STAGES.map((stage) => {
    const count = (candidates ?? []).filter((c: { status: string }) => c.status === stage).length;
    return { stage, label: STAGE_LABELS[stage] ?? stage, count };
  }).filter((s) => s.count > 0);

  // Score distribution buckets: 0-20, 21-40, 41-60, 61-80, 81-100
  const buckets = [
    { range: "0–20",   min: 0,  max: 20,  count: 0 },
    { range: "21–40",  min: 21, max: 40,  count: 0 },
    { range: "41–60",  min: 41, max: 60,  count: 0 },
    { range: "61–80",  min: 61, max: 80,  count: 0 },
    { range: "81–100", min: 81, max: 100, count: 0 },
  ];
  (candidates ?? []).forEach((c: { ai_score: number | null }) => {
    if (c.ai_score == null) return;
    const b = buckets.find((b) => c.ai_score! >= b.min && c.ai_score! <= b.max);
    if (b) b.count++;
  });

  // Applications over last 30 days (daily)
  const now    = new Date();
  const daily: Record<string, number> = {};
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    daily[d.toISOString().slice(0, 10)] = 0;
  }
  (candidates ?? []).forEach((c: { created_at: string }) => {
    const day = c.created_at.slice(0, 10);
    if (day in daily) daily[day]++;
  });
  const timeline = Object.entries(daily).map(([date, count]) => ({ date, count }));

  return NextResponse.json(
    apiSuccess({ pipeline, score_distribution: buckets, timeline })
  );
}
