// API Route — POST /api/assignments/[id]/submit
// Candidate submits their assignment (public, no auth).
// Accepts multipart/form-data: submission_text, optional file upload.

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { apiSuccess, apiError } from "@/lib/utils";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase: any = await getSupabaseAdminClient();

  // ── Load assignment ──────────────────────────────────────────────────────────
  const { data: assignment } = await supabase
    .from("assignments")
    .select("id, status, candidate_id, organization_id, sent_at")
    .eq("id", id)
    .single();

  if (!assignment) return NextResponse.json(apiError("מטלה לא נמצאה"), { status: 404 });

  if (assignment.status === "submitted" || assignment.status === "evaluated") {
    return NextResponse.json(apiError("מטלה זו כבר הוגשה"), { status: 409 });
  }

  // ── Parse form data ──────────────────────────────────────────────────────────
  const formData       = await request.formData();
  const submissionText = (formData.get("submission_text") as string) ?? "";
  const submissionUrl  = (formData.get("submission_url")  as string) ?? "";
  const file           = formData.get("file") as File | null;

  if (!submissionText.trim() && !submissionUrl.trim() && !file) {
    return NextResponse.json(apiError("נא לספק תגובה, קישור, או קובץ"), { status: 400 });
  }

  // ── Handle file upload ───────────────────────────────────────────────────────
  let fileUrl: string | null = null;

  if (file && file.size > 0) {
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(apiError("הקובץ גדול מדי. מקסימום 50MB"), { status: 400 });
    }
    const ext      = file.name.split(".").pop() ?? "bin";
    const fileName = `${assignment.candidate_id}/${id}_${Date.now()}.${ext}`;
    const buffer   = Buffer.from(await file.arrayBuffer());

    const { error: uploadErr } = await supabase.storage
      .from("assignment-submissions")
      .upload(fileName, buffer, { contentType: file.type, upsert: false });

    if (!uploadErr) {
      // Store the bucket PATH, not a "public" URL — the bucket is private,
      // so a public URL 404s for everyone. The recruiter downloads through
      // /api/assignments/[id]/file, which signs a short-lived URL.
      fileUrl = fileName;
    }
  }

  // ── Anti-cheat metadata ──────────────────────────────────────────────────────
  const ip        = request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? "unknown";
  const userAgent = request.headers.get("user-agent") ?? "unknown";
  const sentAt    = assignment.sent_at ? new Date(assignment.sent_at).getTime() : null;
  const now       = Date.now();
  const timeTakenMinutes = sentAt ? Math.round((now - sentAt) / 60000) : 0;

  const submissionMetadata = {
    ip,
    user_agent:           userAgent.slice(0, 200),
    time_taken_minutes:   timeTakenMinutes,
    flagged_fast_submission: timeTakenMinutes > 0 && timeTakenMinutes < 15,
  };

  // ── Persist submission ───────────────────────────────────────────────────────
  const { error: updateErr } = await supabase
    .from("assignments")
    .update({
      status:              "submitted",
      submission_text:     submissionText.trim() || null,
      submission_url:      (fileUrl ?? submissionUrl.trim()) || null,
      submitted_at:        new Date().toISOString(),
      submission_metadata: submissionMetadata,
    })
    .eq("id", id);

  if (updateErr) {
    return NextResponse.json(apiError("שגיאה בשמירת ההגשה"), { status: 500 });
  }

  // Update candidate status
  void supabase
    .from("candidates")
    .update({ status: "assignment_submitted" })
    .eq("id", assignment.candidate_id);

  // Evaluate in the same request, mirroring how interviews are scored on
  // completion: the recruiter opens the profile and sees a verdict, not a
  // row stuck on "ממתינה להערכה". Non-fatal — the submission is saved
  // either way, and evaluateAssignment swallows its own errors.
  const { evaluateAssignment } = await import("@/lib/assignments/evaluator");
  await evaluateAssignment(id).catch(e => console.error("[submit] evaluation failed:", e));

  return NextResponse.json(apiSuccess({ submitted: true }));
}
