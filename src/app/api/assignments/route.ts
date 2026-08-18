// ==================================================
// API — /api/assignments
// ==================================================
// GET  ?candidate_id=X — the candidate's assignment, if any
// POST — two modes, matching how the profile modal works:
//   { candidate_id, deadline_hours }            → AI-draft the content,
//                                                 nothing persisted
//   { candidate_id, title, description, ... }   → create + mark sent,
//                                                 return a ready-to-send
//                                                 email payload
//
// Delivery is by email for now — the candidate's address is captured on
// the landing form. The route returns {to, subject, body} and the UI opens
// the recruiter's own mail client prefilled; WhatsApp delivery is a later
// phase, by Asaf's explicit decision.

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { apiSuccess, apiError } from "@/lib/utils";
import { callAI } from "@/lib/ai/providers";

function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL?.trim() ?? "";
}

/* eslint-disable @typescript-eslint/no-explicit-any */

// Map a DB row to the shape the profile page already renders.
function toUi(row: any) {
  const submitted = row.submission_url || row.submission_text;
  const ev = row.ai_evaluation ?? null;
  return {
    id:             row.id,
    candidate_id:   row.candidate_id,
    title:          row.title,
    description:    row.description,
    instructions:   row.instructions,
    deadline_hours: row.deadline_hours,
    status:         row.status,
    sent_at:        row.sent_at,
    created_at:     row.created_at,
    link:           `${appUrl()}/assignment/${row.id}`,
    whatsapp_message: null,
    submission: submitted ? {
      type:               row.submission_url ? "url" : "text",
      content:            row.submission_url ?? row.submission_text,
      submitted_at:       row.submitted_at,
      evaluation_score:   ev?.score ?? null,
      evaluation_summary: ev?.summary ?? null,
      strengths:          ev?.strengths ?? [],
      weaknesses:         ev?.weaknesses ?? [],
      recommendation:     ev?.recommendation ?? null,
    } : null,
  };
}

function buildEmail(candidateName: string, jobTitle: string, deadlineHours: number, link: string) {
  return {
    subject: `המשך תהליך למשרת ${jobTitle} — מטלה קצרה`,
    body: [
      `שלום ${candidateName},`,
      ``,
      `תודה על השיחה! עברת בהצלחה את השלב הראשון בתהליך למשרת ${jobTitle}.`,
      `השלב הבא הוא מטלה קצרה שתעזור לנו להכיר את היכולות שלך בפועל.`,
      ``,
      `הקישור למטלה: ${link}`,
      `זמן הגשה: עד ${deadlineHours} שעות מקבלת מייל זה.`,
      ``,
      `בהצלחה!`,
      `HR AG`,
    ].join("\n"),
  };
}

export async function GET(request: NextRequest) {
  const candidateId = request.nextUrl.searchParams.get("candidate_id");

  if (process.env.NEXT_PUBLIC_DEMO_MODE?.trim() === "true" || request.cookies.has("hr-demo")) {
    const { DEMO_ASSIGNMENTS } = await import("@/lib/demo/mock-data");
    const results = candidateId
      ? DEMO_ASSIGNMENTS.filter(a => a.candidate_id === candidateId)
      : DEMO_ASSIGNMENTS;
    return NextResponse.json({ success: true, data: results });
  }

  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json(apiError("Unauthorized"), { status: 401 });

  const db = supabase as any;
  let query = db.from("assignments").select("*").order("created_at", { ascending: false });
  if (candidateId) query = query.eq("candidate_id", candidateId);

  const { data, error } = await query;
  if (error) return NextResponse.json(apiError("שגיאה בטעינת מטלות"), { status: 500 });

  return NextResponse.json(apiSuccess((data ?? []).map(toUi)));
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const { candidate_id, title, description, instructions, deadline_hours = 48 } = body;

  if (!candidate_id) {
    return NextResponse.json(apiError("candidate_id נדרש"), { status: 400 });
  }

  if (process.env.NEXT_PUBLIC_DEMO_MODE?.trim() === "true" || request.cookies.has("hr-demo")) {
    return NextResponse.json(apiError("מצב דמו — מטלות אינן נשמרות"), { status: 501 });
  }

  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json(apiError("Unauthorized"), { status: 401 });

  const db = supabase as any;

  // RLS confines this to the caller's org — a foreign candidate_id 404s.
  const { data: candidate } = await db
    .from("candidates")
    .select(`
      id, organization_id, full_name, email,
      job:jobs ( id, title, description, requirements, ai_instructions )
    `)
    .eq("id", candidate_id)
    .maybeSingle();

  if (!candidate?.job) return NextResponse.json(apiError("המועמד לא נמצא"), { status: 404 });

  // ── Generate mode: draft the content, persist nothing ────────────────
  // The recruiter reviews and edits before anything is committed — an
  // unreviewed AI text should never be what a candidate receives.
  if (!title && !description && !instructions) {
    try {
      const res = await callAI(
        [{
          role: "user",
          content: `כתוב מטלת בית קצרה למועמד/ת לתפקיד "${candidate.job.title}".

תיאור התפקיד:
${candidate.job.description}

דרישות: ${(candidate.job.requirements ?? []).join(", ") || "לא צוינו"}
${candidate.job.ai_instructions ? `דגשים מהמגייס: ${candidate.job.ai_instructions}` : ""}

המטלה צריכה להיות מעשית, ניתנת לביצוע ב-2-4 שעות עבודה, ובודקת את מיומנויות הליבה של התפקיד.

החזר JSON בלבד:
{"title": "כותרת קצרה", "description": "פסקה שמסבירה מה בודקים ולמה", "instructions": "הוראות מפורטות צעד-צעד, כולל מה בדיוק להגיש"}`,
        }],
        // 6000: reasoning models spend thinking tokens inside this budget;
        // 2500 came back truncated mid-JSON in production.
        { maxTokens: 6000, temperature: 0.5 }
      );

      const c = res.content.trim();
      const parsed = JSON.parse(c.slice(c.indexOf("{"), c.lastIndexOf("}") + 1));
      return NextResponse.json(apiSuccess({
        title:          parsed.title ?? `מטלה — ${candidate.job.title}`,
        description:    parsed.description ?? "",
        instructions:   parsed.instructions ?? "",
        deadline_hours,
      }), { status: 200 });
    } catch (e) {
      console.error("[assignments] generation failed:", e);
      return NextResponse.json(apiError("יצירת המטלה נכשלה — נסה שוב או כתוב ידנית"), { status: 502 });
    }
  }

  // ── Create + send mode ───────────────────────────────────────────────
  // One assignment per candidate (DB unique). Re-sending replaces the
  // content but keeps the id, so an already-shared link keeps working.
  const { data: row, error } = await db
    .from("assignments")
    .upsert({
      candidate_id,
      organization_id: candidate.organization_id,
      job_id:          candidate.job.id,
      title:           String(title ?? "").trim() || `מטלה — ${candidate.job.title}`,
      description:     String(description ?? "").trim(),
      instructions:    String(instructions ?? "").trim(),
      deadline_hours,
      status:          "sent",
      sent_at:         new Date().toISOString(),
    }, { onConflict: "candidate_id" })
    .select("*")
    .single();

  if (error || !row) {
    console.error("[assignments] create failed:", error?.message);
    return NextResponse.json(apiError("שגיאה בשמירת המטלה"), { status: 500 });
  }

  const ui = toUi(row);
  return NextResponse.json(apiSuccess({
    ...ui,
    email: {
      to: candidate.email,
      ...buildEmail(candidate.full_name, candidate.job.title, row.deadline_hours, ui.link),
    },
  }), { status: 201 });
}
