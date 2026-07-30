// ==================================================
// Assignment Generator Agent
// ==================================================
// Generates a personalised home assignment for a candidate
// based on the job requirements and their interview profile.
// Creates and persists the assignment row in DB.
// ==================================================

import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { callAI } from "@/lib/ai/providers";
import { fillPrompt } from "@/lib/ai/prompts/v1";

export type GeneratedAssignment = {
  id:                  string;
  title:               string;
  description:         string;
  instructions:        string;
  evaluation_criteria: string[];
  deadline_hours:      number;
};

export async function generateAssignment(params: {
  candidateId:    string;
  deadlineHours?: number;
}): Promise<GeneratedAssignment> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase: any = await getSupabaseAdminClient();

  const { deadlineHours = 72 } = params;

  // ── Load candidate + job ─────────────────────────────────────────────────────
  const { data: candidate } = await supabase
    .from("candidates")
    .select("id, full_name, organization_id, job_id, ai_summary, ai_score")
    .eq("id", params.candidateId)
    .single();

  if (!candidate) throw new Error(`Candidate ${params.candidateId} not found`);

  const { data: job } = await supabase
    .from("jobs")
    .select("id, title, description, requirements")
    .eq("id", candidate.job_id)
    .single();

  if (!job) throw new Error("Job not found for candidate");

  const { data: org } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", candidate.organization_id)
    .single();

  // ── Determine seniority from AI score ────────────────────────────────────────
  const score    = candidate.ai_score ?? 60;
  const seniority = score >= 75 ? "senior" : score >= 50 ? "mid-level" : "junior";

  // ── Build and call AI ────────────────────────────────────────────────────────
  const prompt = fillPrompt("ASSIGNMENT_GENERATOR", {
    job_title:            job.title,
    company_name:         org?.name ?? "החברה",
    job_description:      Array.isArray(job.requirements) ? job.requirements.join(", ") : String(job.requirements ?? ""),
    candidate_strengths:  candidate.ai_summary ?? "לא זמין",
    seniority,
    time_hours:           String(Math.round(deadlineHours / 3)),
  });

  const aiResponse = await callAI(
    [{ role: "user", content: "Generate the assignment now." }],
    { systemPrompt: prompt, maxTokens: 1500 }
  );

  // ── Parse AI response ────────────────────────────────────────────────────────
  let parsed: { title: string; description: string; instructions: string; evaluation_criteria: string[] };
  try {
    const raw = aiResponse.content.trim().replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    parsed    = JSON.parse(raw);
  } catch {
    throw new Error("AI returned invalid JSON for assignment");
  }

  // ── Persist assignment ───────────────────────────────────────────────────────
  const { data: assignment, error } = await supabase
    .from("assignments")
    .insert({
      job_id:              job.id,
      candidate_id:        candidate.id,
      organization_id:     candidate.organization_id,
      title:               parsed.title,
      description:         parsed.description,
      instructions:        parsed.instructions,
      evaluation_criteria: parsed.evaluation_criteria ?? [],
      deadline_hours:      deadlineHours,
      status:              "pending",
    })
    .select("id, title, description, instructions, evaluation_criteria, deadline_hours")
    .single();

  if (error || !assignment) {
    throw new Error(`Failed to save assignment: ${error?.message}`);
  }

  // ── Update candidate status ──────────────────────────────────────────────────
  await supabase
    .from("candidates")
    .update({ status: "assignment_sent" })
    .eq("id", candidate.id);

  // ── Log token usage ──────────────────────────────────────────────────────────
  void supabase.from("ai_usage_logs").insert({
    organization_id: candidate.organization_id,
    feature:         "assignment_generator",
    prompt_version:  "v1",
    provider:        aiResponse.provider,
    model:           aiResponse.model,
    input_tokens:    aiResponse.usage.input_tokens,
    output_tokens:   aiResponse.usage.output_tokens,
    candidate_id:    candidate.id,
    job_id:          job.id,
  });

  return {
    id:                  assignment.id,
    title:               assignment.title,
    description:         assignment.description,
    instructions:        assignment.instructions,
    evaluation_criteria: assignment.evaluation_criteria as string[],
    deadline_hours:      assignment.deadline_hours,
  };
}
