// API Route — GET/POST /api/assignments
// GET  ?candidate_id=X — list assignments for a candidate
// POST — create an AI-generated assignment (recruiter auth required)

import { NextRequest, NextResponse } from "next/server";

// ── GET — list assignments for a candidate ────────────────────────────────────
export async function GET(request: NextRequest) {
  const candidateId = request.nextUrl.searchParams.get("candidate_id");

  // Demo mode
  if (process.env.NEXT_PUBLIC_DEMO_MODE === "true" || request.cookies.has("hr-demo")) {
    const { DEMO_ASSIGNMENTS } = await import("@/lib/demo/mock-data");
    const results = candidateId
      ? DEMO_ASSIGNMENTS.filter(a => a.candidate_id === candidateId)
      : DEMO_ASSIGNMENTS;
    return NextResponse.json({ success: true, data: results });
  }

  return NextResponse.json({ success: true, data: [] });
}

// ── POST — create assignment ──────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const { candidate_id, title, description, instructions, deadline_hours = 48 } = body;

  if (!candidate_id) {
    return NextResponse.json({ success: false, error: "candidate_id נדרש" }, { status: 400 });
  }

  // Demo mode — return a mock assignment
  if (process.env.NEXT_PUBLIC_DEMO_MODE === "true" || request.cookies.has("hr-demo")) {
    const { DEMO_CANDIDATES, DEMO_JOBS } = await import("@/lib/demo/mock-data");
    const candidate = DEMO_CANDIDATES.find(c => c.id === candidate_id);
    const job = candidate ? DEMO_JOBS.find(j => j.id === candidate.job.id) : null;

    const assignment = {
      id: `assign-demo-${Date.now()}`,
      candidate_id,
      candidate_name: candidate?.full_name ?? "מועמד",
      job_title: job?.title ?? "",
      title: title || `מטלה טכנית — ${job?.title ?? "תפקיד"}`,
      description: description || "מטלה שנוצרה על ידי הסוכן AI בהתאם לתיאור המשרה ופרופיל המועמד.",
      instructions: instructions || "פרטי המטלה יופיעו כאן. כולל דרישות, מה לשלוח, ואיך להגיש.",
      deadline_hours,
      status: "draft",
      sent_at: null,
      submission: null,
      whatsapp_message: `שלום ${candidate?.full_name ?? ""}! 🎯\n\nעברת את שלב הסינון בהצלחה!\nהשלב הבא הוא מטלה קצרה.\n\n⏰ זמן: ${deadline_hours} שעות\n📎 קישור למטלה: https://your-domain.com/assignment/assign-demo\n\nבהצלחה! 💪`,
      created_at: new Date().toISOString(),
    };
    return NextResponse.json({ success: true, data: assignment }, { status: 201 });
  }

  // Real mode — would call Supabase + AI generator
  return NextResponse.json({ success: false, error: "לא זמין בסביבה זו" }, { status: 501 });
}
