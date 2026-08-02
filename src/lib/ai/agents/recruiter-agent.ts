// ==================================================
// WhatsApp AI Recruiter Agent
// ==================================================
// Entry point: processInboundMessage()
//
// Flow:
//   1. Find candidate by phone number
//   2. Guard: is_ai_active must be true
//   3. Load job + screening questions + rejection rules
//   4. Load / create conversation context
//   5. Dedup: skip if provider message ID already seen
//   6. Persist inbound message
//   7. Build AI prompt with current state
//   8. Call AI → parse JSON response
//   9. Handle action: continue | complete | reject
//  10. Persist outbound message + update context
//  11. Return reply text (caller sends via WhatsApp provider)
// ==================================================

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { callAI } from "@/lib/ai/providers";
import { fillPrompt } from "@/lib/ai/prompts/v1";
import { notifyAIInterviewComplete } from "@/lib/notifications/telegram";
import { scoreCandidate } from "./scorer";
import {
  loadContext,
  saveContext,
  appendMessage,
  loadTranscript,
} from "./context";

// ── Types ─────────────────────────────────────────────────────────────────────
type ScreeningQuestion = {
  question: string;
  type:     "numeric" | "yes_no" | "open";
  weight:   number;
};

type RejectionRule = {
  field:    string;
  operator: string;
  value:    number | string;
  reason:   string;
};

type AgentResult =
  | { sent: true;  reply: string }
  | { sent: false; reason: "ai_inactive" | "not_found" | "already_complete" | "dedup" | "error"; detail?: string };

// ── Main entry point ──────────────────────────────────────────────────────────
export async function processInboundMessage(params: {
  phoneNumber: string;   // E.164 format: +972501234567
  messageBody: string;
  providerId?: string;   // Twilio SID or Meta message ID (for dedup)
  mediaUrl?:   string;
}): Promise<AgentResult> {
  const supabase = await getSupabaseAdminClient();

  // ── 1. Find candidate by WhatsApp number ────────────────────────────────────
  const { data: candidate } = await supabase
    .from("candidates")
    .select(`
      id, full_name, organization_id, job_id,
      is_ai_active, status, whatsapp_number
    `)
    .eq("whatsapp_number", params.phoneNumber)
    .eq("is_ai_active", true)
    .order("applied_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cand = candidate as any;
  if (!cand) {
    // Try matching by phone field as fallback
    const { data: byPhone } = await supabase
      .from("candidates")
      .select("id, full_name, organization_id, job_id, is_ai_active, status, whatsapp_number, phone")
      .eq("phone", params.phoneNumber)
      .eq("is_ai_active", true)
      .order("applied_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!byPhone) return { sent: false, reason: "not_found" };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return runAgent(supabase, byPhone as any, params);
  }

  if (!cand.is_ai_active) return { sent: false, reason: "ai_inactive" };
  return runAgent(supabase, cand, params);
}

// ── Core agent logic ──────────────────────────────────────────────────────────
async function runAgent(
  supabase: SupabaseClient<Database>,
  candidate: {
    id: string; full_name: string; organization_id: string;
    job_id: string; is_ai_active: boolean; status: string;
  },
  params: { phoneNumber: string; messageBody: string; providerId?: string; mediaUrl?: string }
): Promise<AgentResult> {
  // ── 2. Dedup by provider message ID ─────────────────────────────────────────
  if (params.providerId) {
    const { data: existing } = await supabase
      .from("whatsapp_messages")
      .select("id")
      .eq("whatsapp_message_id", params.providerId)
      .maybeSingle();
    if (existing) return { sent: false, reason: "dedup" };
  }

  // ── 3. Load job ──────────────────────────────────────────────────────────────
  const { data: job } = await supabase
    .from("jobs")
    .select("title, description, screening_questions, rejection_rules")
    .eq("id", candidate.job_id)
    .single();

  if (!job) return { sent: false, reason: "error", detail: "job not found" };

  const questions:      ScreeningQuestion[] = (job.screening_questions as unknown as ScreeningQuestion[]) ?? [];
  const rejectionRules: RejectionRule[]     = (job.rejection_rules     as unknown as RejectionRule[])     ?? [];

  // ── 4. Load organisation name ────────────────────────────────────────────────
  const { data: org } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", candidate.organization_id)
    .single();

  // ── 5. Load / create conversation context ───────────────────────────────────
  const ctx = await loadContext(supabase, candidate.id, candidate.organization_id);

  if (ctx.is_complete) return { sent: false, reason: "already_complete" };

  // ── 6. Persist inbound message ───────────────────────────────────────────────
  await appendMessage(supabase, {
    candidateId:    candidate.id,
    organizationId: candidate.organization_id,
    direction:      "inbound",
    sender:         "candidate",
    content:        params.messageBody,
    mediaUrl:       params.mediaUrl,
    providerId:     params.providerId,
  });

  // ── 7. Build transcript for AI context ──────────────────────────────────────
  const transcript = await loadTranscript(supabase, candidate.id, 16);

  const currentIndex = ctx.current_question_index;
  const nextQuestion = questions[currentIndex]?.question ?? "—";
  const totalQ       = questions.length;

  // ── 8. Build system prompt ───────────────────────────────────────────────────
  const systemPrompt = fillPrompt("WHATSAPP_RECRUITER", {
    company_name:      org?.name ?? "החברה",
    candidate_name:    candidate.full_name,
    job_title:         job.title,
    job_description:   job.description ?? "",
    screening_questions: questions.map((q, i) => `${i + 1}. ${q.question} [${q.type}]`).join("\n"),
    rejection_rules:     rejectionRules.map(r => `- ${r.field} ${r.operator} ${r.value}: ${r.reason}`).join("\n") || "אין",
    questions_asked:     String(currentIndex),
    total_questions:     String(totalQ),
    current_index:       String(currentIndex),
    next_question:       nextQuestion,
    is_complete:         String(ctx.is_complete),
  });

  // First message — add greeting instruction
  const messagesForAI = transcript.length <= 1
    ? [{ role: "user" as const, content: `המועמד כתב: "${params.messageBody}"\n\nהתחל בברכה קצרה והצג את עצמך, ואז שאל את השאלה הראשונה.` }]
    : transcript;

  // ── 9. Call AI ───────────────────────────────────────────────────────────────
  let aiResponse: { message: string; action: string; rejection_reason?: string };

  try {
    const result = await callAI(messagesForAI, {
      systemPrompt,
      maxTokens: 500,
    });

    // Strip markdown code fences if AI wrapped JSON in them
    const raw = result.content.trim().replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    aiResponse = JSON.parse(raw);
  } catch {
    // Fallback: treat raw content as the message
    aiResponse = {
      message: "תודה על פנייתך. אשמח לשמוע יותר על הניסיון שלך.",
      action:  "continue",
    };
  }

  const { message: replyText, action } = aiResponse;

  // ── 10. Persist outbound message ─────────────────────────────────────────────
  await appendMessage(supabase, {
    candidateId:    candidate.id,
    organizationId: candidate.organization_id,
    direction:      "outbound",
    sender:         "ai",
    content:        replyText,
  });

  // ── 11. Update context based on action ──────────────────────────────────────
  const newIndex = action === "continue" ? Math.min(currentIndex + 1, totalQ) : currentIndex;
  const isDone   = action === "complete" || action === "reject" || newIndex >= totalQ;

  await saveContext(supabase, candidate.id, {
    current_question_index: newIndex,
    is_complete:            isDone,
    metadata: {
      ...ctx.metadata,
      rejection_triggered: action === "reject",
      rejection_reason:    aiResponse.rejection_reason,
      wrap_up_sent:        isDone,
    },
  });

  // Update candidate status
  if (isDone) {
    await supabase
      .from("candidates")
      .update({ status: action === "reject" ? "rejected" : "under_review" })
      .eq("id", candidate.id);

    // Auto-score in background — fire and forget
    scoreCandidate(candidate.id)
      .then(score => notifyAIInterviewComplete(
        candidate.full_name,
        job.title,
        score.score,
        score.recommendation
      ))
      .catch(err => console.error("[AutoScore]", err));
  }

  // Log AI usage (fire-and-forget)
  void supabase.from("ai_usage_logs").insert({
    organization_id: candidate.organization_id,
    feature:         "whatsapp_recruiter",
    prompt_version:  "v1",
    provider:        "anthropic",
    model:           "claude-sonnet-4-6",
    input_tokens:    0,
    output_tokens:   0,
  });

  return { sent: true, reply: replyText };
}
