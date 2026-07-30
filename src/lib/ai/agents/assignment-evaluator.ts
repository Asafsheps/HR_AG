// ==================================================
// Assignment Evaluator Agent
// ==================================================
// Evaluates a candidate's submitted home assignment.
// Includes anti-cheat detection (speed, generic content).
// Persists ai_evaluation on the assignment row.
// ==================================================

import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { callAI } from "@/lib/ai/providers";
import { fillPrompt } from "@/lib/ai/prompts/v1";

export type EvaluationResult = {
  score:            number;
  summary:          string;
  strengths:        string[];
  weaknesses:       string[];
  criteria_scores:  Record<string, number>;
  anti_cheat_flags: string[];
  recommendation:   "proceed" | "borderline" | "reject";
  rejection_reason?: string;
};

export async function evaluateAssignment(assignmentId: string): Promise<EvaluationResult> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase: any = await getSupabaseAdminClient();

  // ── Load assignment ──────────────────────────────────────────────────────────
  const { data: assignment } = await supabase
    .from("assignments")
    .select(`
      id, title, instructions, evaluation_criteria,
      submission_text, submission_url, submission_metadata,
      sent_at, submitted_at,
      candidate_id, organization_id, job_id
    `)
    .eq("id", assignmentId)
    .single();

  if (!assignment) throw new Error(`Assignment ${assignmentId} not found`);
  if (!assignment.submission_text && !assignment.submission_url) {
    throw new Error("No submission found for this assignment");
  }

  // ── Load candidate summary ───────────────────────────────────────────────────
  const { data: candidate } = await supabase
    .from("candidates")
    .select("full_name, ai_summary, organization_id")
    .eq("id", assignment.candidate_id)
    .single();

  const { data: job } = await supabase
    .from("jobs")
    .select("title")
    .eq("id", assignment.job_id)
    .single();

  const { data: org } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", assignment.organization_id)
    .single();

  // ── Calculate time taken ─────────────────────────────────────────────────────
  const sentAt      = assignment.sent_at      ? new Date(assignment.sent_at)      : null;
  const submittedAt = assignment.submitted_at ? new Date(assignment.submitted_at) : null;
  const timeTakenMinutes = sentAt && submittedAt
    ? Math.round((submittedAt.getTime() - sentAt.getTime()) / 60000)
    : 0;

  // Expected time: deadline_hours not available here, estimate 3h
  const expectedMinutes = 180;

  // ── Build submission content ─────────────────────────────────────────────────
  const submissionContent = [
    assignment.submission_text ? `תגובת מועמד:\n${assignment.submission_text}` : "",
    assignment.submission_url  ? `קישור: ${assignment.submission_url}`           : "",
  ].filter(Boolean).join("\n\n");

  const criteria = Array.isArray(assignment.evaluation_criteria)
    ? assignment.evaluation_criteria.join("\n")
    : String(assignment.evaluation_criteria ?? "");

  // ── Build prompt ─────────────────────────────────────────────────────────────
  const prompt = fillPrompt("ASSIGNMENT_EVALUATOR", {
    job_title:           job?.title         ?? "לא ידוע",
    company_name:        org?.name          ?? "החברה",
    assignment_title:    assignment.title,
    assignment_instructions: assignment.instructions,
    evaluation_criteria: criteria,
    candidate_summary:   candidate?.ai_summary ?? "לא זמין",
    submission_content:  submissionContent,
    time_taken_minutes:  String(timeTakenMinutes),
    expected_minutes:    String(expectedMinutes),
  });

  // ── Call AI ──────────────────────────────────────────────────────────────────
  const aiResponse = await callAI(
    [{ role: "user", content: "Evaluate the submission now." }],
    { systemPrompt: prompt, maxTokens: 1200 }
  );

  // ── Parse AI response ────────────────────────────────────────────────────────
  let result: EvaluationResult;
  try {
    const raw    = aiResponse.content.trim().replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    const parsed = JSON.parse(raw);
    result = {
      score:            Math.max(0, Math.min(100, Number(parsed.score) || 0)),
      summary:          String(parsed.summary ?? ""),
      strengths:        Array.isArray(parsed.strengths)        ? parsed.strengths        : [],
      weaknesses:       Array.isArray(parsed.weaknesses)       ? parsed.weaknesses       : [],
      criteria_scores:  typeof parsed.criteria_scores === "object" ? parsed.criteria_scores : {},
      anti_cheat_flags: Array.isArray(parsed.anti_cheat_flags) ? parsed.anti_cheat_flags : [],
      recommendation:   (["proceed", "borderline", "reject"].includes(parsed.recommendation)
        ? parsed.recommendation : "borderline") as EvaluationResult["recommendation"],
      rejection_reason: parsed.rejection_reason ?? undefined,
    };

    // Hard anti-cheat: add flag for very fast submissions
    if (timeTakenMinutes > 0 && timeTakenMinutes < expectedMinutes * 0.3) {
      if (!result.anti_cheat_flags.includes("הוגש מהר מדי")) {
        result.anti_cheat_flags.push(`הוגש תוך ${timeTakenMinutes} דקות (צפוי: ${expectedMinutes} דקות)`);
      }
    }
  } catch {
    result = {
      score:            50,
      summary:          "לא ניתן להעריך אוטומטית",
      strengths:        [],
      weaknesses:       [],
      criteria_scores:  {},
      anti_cheat_flags: [],
      recommendation:   "borderline",
    };
  }

  // ── Persist evaluation ───────────────────────────────────────────────────────
  await supabase
    .from("assignments")
    .update({
      ai_evaluation: result,
      status:        "evaluated",
    })
    .eq("id", assignmentId);

  // Update candidate status
  await supabase
    .from("candidates")
    .update({
      status: result.recommendation === "reject" ? "rejected" : "shortlisted",
    })
    .eq("id", assignment.candidate_id);

  // ── Log token usage ──────────────────────────────────────────────────────────
  void supabase.from("ai_usage_logs").insert({
    organization_id: assignment.organization_id,
    feature:         "assignment_evaluator",
    prompt_version:  "v1",
    provider:        aiResponse.provider,
    model:           aiResponse.model,
    input_tokens:    aiResponse.usage.input_tokens,
    output_tokens:   aiResponse.usage.output_tokens,
    candidate_id:    assignment.candidate_id,
    job_id:          assignment.job_id,
  });

  return result;
}
