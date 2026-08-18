// API Route — /api/candidates/[id]
// GET  — full candidate detail (recruiter, org-scoped)
// PATCH — update status / recruiter_notes_text / pipeline

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { apiSuccess, apiError } from "@/lib/utils";
import { z } from "zod";

const patchSchema = z.object({
  status: z.enum([
    "new", "screening", "whatsapp_interview",
    "assignment_sent", "assignment_submitted", "under_review",
    "shortlisted", "rejected", "hired", "withdrawn",
  ]).optional(),
}).strict();

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (process.env.NEXT_PUBLIC_DEMO_MODE === "true" || req.cookies.has("hr-demo")) {
    const { DEMO_CANDIDATES, DEMO_MESSAGES, DEMO_NOTES } = await import("@/lib/demo/mock-data");
    const { id } = await params;
    const candidate = DEMO_CANDIDATES.find(c => c.id === id) ?? DEMO_CANDIDATES[0];
    const messages  = id === "demo-1" ? DEMO_MESSAGES : [];
    const notes     = id === "demo-1" ? DEMO_NOTES    : [];
    return NextResponse.json({ success: true, data: { ...candidate, messages: messages, candidate_notes: notes } });
  }

  const supabase = await getSupabaseServerClient();
  const { id } = await params;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json(apiError("לא מחובר"), { status: 401 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data: candidate, error } = await db
    .from("candidates")
    .select(`
      id, full_name, email, phone, whatsapp_number,
      linkedin_url, portfolio_url, cover_letter,
      cv_url, cv_parsed_data,
      status, ai_score, ai_summary,
      whatsapp_consent, screening_answers,
      source, created_at:applied_at, updated_at,
      job:jobs (
        id, title, department, location
      )
    `)
    .eq("id", id)
    .single();

  if (error || !candidate) {
    return NextResponse.json(apiError("מועמד לא נמצא"), { status: 404 });
  }

  // Fetch WhatsApp messages
  const { data: messages } = await db
    .from("messages")
    .select("id, direction, sender, body, created_at")
    .eq("candidate_id", id)
    .order("created_at", { ascending: true })
    .limit(200);

  // Fetch notes
  const { data: notes } = await db
    .from("candidate_notes")
    .select(`
      id, content, created_at, updated_at,
      recruiter:recruiter_profiles (
        full_name, avatar_url
      )
    `)
    .eq("candidate_id", id)
    .order("created_at", { ascending: false });

  return NextResponse.json(
    apiSuccess({
      candidate,
      messages: messages ?? [],
      notes:    notes ?? [],
    })
  );
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await getSupabaseServerClient();
  const { id } = await params;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json(apiError("לא מחובר"), { status: 401 });

  const body = await request.json().catch(() => ({}));
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(apiError(parsed.error.errors[0].message), { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data, error } = await db
    .from("candidates")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("id, status, updated_at")
    .single();

  if (error) return NextResponse.json(apiError("עדכון נכשל"), { status: 500 });

  return NextResponse.json(apiSuccess(data));
}
