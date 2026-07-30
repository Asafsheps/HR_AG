// ==================================================
// AI Scoring Agent
// ==================================================
// Scores a candidate after their WhatsApp interview is complete.
//
// Pipeline:
//   1. Load candidate + job from DB
//   2. Parse CV (if cv_url exists and not yet parsed)
//   3. Load interview transcript
//   4. Call AI with CANDIDATE_SCORER prompt
//   5. Persist: ai_score, ai_summary, cv_parsed_data on candidate
//   6. Log token usage
//   7. Return ScoreResult
// ==================================================

import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { callAI } from "@/lib/ai/providers";
import { fillPrompt } from "@/lib/ai/prompts/v1";
import { parseCV } from "./cv-parser";
import { loadTranscript } from "./context";

export type ScoreResult = {
  score:             number;
  summary:           string;
  strengths:         string[];
  weaknesses:        string[];
  inconsistencies:   string[];
  recommendation:    "proceed" | "borderline" | "reject";
  rejection_reason?: string;
};

// ── Main entry point ──────────────────────────────────────────────────────────
export async function scoreCandidate(candidateId: string): Promise<ScoreResult> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase: any = await getSupabaseAdminClient();

  // ── 1. Load candidate ────────────────────────────────────────────────────────
  const { data: candidate } = await supabase
    .from("candidates")
    .select("id, full_name, organization_id, job_id, cv_url, cv_parsed_data, email")
    .eq("id", candidateId)
    .single();

  if (!candidate) throw new Error(`Candidate ${candidateId} not found`);

  // ── 2. Load job ──────────────────────────────────────────────────────────────
  const { data: job } = await supabase
    .from("jobs")
    .select("title, description, requirements, screening_questions, rejection_rules")
    .eq("id", candidate.job_id)
    .single();

  if (!job) throw new Error(`Job for candidate ${candidateId} not found`);

  // ── 3. Parse CV (if not already done) ───────────────────────────────────────
  let cvParsedData = candidate.cv_parsed_data;

  if (!cvParsedData && candidate.cv_url) {
    try {
      cvParsedData = await parseCV(candidate.cv_url);
      // Persist parsed CV data
      await supabase
        .from("candidates")
        .update({ cv_parsed_data: cvParsedData })
        .eq("id", candidateId);
    } catch (err) {
      console.warn("[Scorer] CV parse failed:", err);
      cvParsedData = null;
    }
  }

  // ── 4. Load interview transcript ─────────────────────────────────────────────
  const transcript = await loadTranscript(supabase, candidateId, 40);
  const transcriptText = transcript.length > 0
    ? transcript.map(m => `${m.role === "user" ? "מועמד" : "מגייס AI"}: ${m.content}`).join("\n")
    : "אין תמלול ראיון — הוגשה מועמדות ישירה";

  // ── 5. Build prompt ──────────────────────────────────────────────────────────
  const screeningQs = (job.screening_questions as Array<{ question: string; weight: number }> ?? [])
    .map((q, i) => `${i + 1}. ${q.question} (משקל: ${q.weight})`)
    .join("\n");

  const rejectionRules = (job.rejection_rules as Array<{ field: string; operator: string; value: unknown; reason: string }> ?? [])
    .map(r => `- ${r.field} ${r.operator} ${r.value}: ${r.reason}`)
    .join("\n") || "אין";

  const prompt = fillPrompt("CANDIDATE_SCORER", {
    job_title:            job.title,
    requirements:         Array.isArray(job.requirements) ? job.requirements.join("\n") : String(job.requirements ?? ""),
    cv_data:              cvParsedData ? JSON.stringify(cvParsedData, null, 2) : "לא הועלו קורות חיים",
    interview_transcript: transcriptText,
    screening_questions:  screeningQs || "אין שאלות סינון",
    rejection_rules:      rejectionRules,
  });

  // ── 6. Call AI ───────────────────────────────────────────────────────────────
  const aiResponse = await callAI(
    [{ role: "user", content: "Score this candidate now." }],
    { systemPrompt: prompt, maxTokens: 1200 }
  );

  // ── 7. Parse response ────────────────────────────────────────────────────────
  let result: ScoreResult;
  try {
    const raw    = aiResponse.content.trim().replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    const parsed = JSON.parse(raw);

    result = {
      score:           Math.max(0, Math.min(100, Number(parsed.score) || 0)),
      summary:         String(parsed.summary ?? ""),
      strengths:       Array.isArray(parsed.strengths)       ? parsed.strengths       : [],
      weaknesses:      Array.isArray(parsed.weaknesses)      ? parsed.weaknesses      : [],
      inconsistencies: Array.isArray(parsed.inconsistencies) ? parsed.inconsistencies : [],
      recommendation:  (["proceed", "borderline", "reject"].includes(parsed.recommendation)
        ? parsed.recommendation : "borderline") as ScoreResult["recommendation"],
      rejection_reason: parsed.rejection_reason ?? undefined,
    };
  } catch {
    result = {
      score:           50,
      summary:         "לא ניתן לחשב ניקוד אוטומטי",
      strengths:       [],
      weaknesses:      [],
      inconsistencies: [],
      recommendation:  "borderline",
    };
  }

  // ── 8. Persist score on candidate ────────────────────────────────────────────
  await supabase
    .from("candidates")
    .update({
      ai_score:   result.score,
      ai_summary: result.summary,
      status:     result.recommendation === "reject" ? "rejected" : "under_review",
    })
    .eq("id", candidateId);

  // ── 9. Log token usage ───────────────────────────────────────────────────────
  void supabase.from("ai_usage_logs").insert({
    organization_id: candidate.organization_id,
    feature:         "candidate_scorer",
    prompt_version:  "v1",
    provider:        aiResponse.provider,
    model:           aiResponse.model,
    input_tokens:    aiResponse.usage.input_tokens,
    output_tokens:   aiResponse.usage.output_tokens,
  });

  return result;
}
