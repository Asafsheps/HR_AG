// ==================================================
// Interview persistence
// ==================================================
// Replaces the in-memory demo store. Sessions now live in
// conversation_contexts, so an interview survives a server restart —
// the previous store lost every one.
//
// All of this runs with the service role and is server-only. The public
// has no write access to these tables at all (migration 018): PostgREST
// is exposed directly, so an anon INSERT grant would mean anyone could
// append to the candidate pool without passing through the rate limiting,
// validation and CV sanitising in the API route.

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { AgentConfig, JobConfig } from "./prompt";
import type { InterviewTurn } from "./session";

/**
 * Service-role client. Never import this into anything that runs in the
 * browser — the key bypasses RLS entirely.
 */
function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) throw new Error("Supabase service role is not configured");
  return createClient<Database>(url, key, { auth: { persistSession: false } });
}

export interface StoredSession {
  contextId:    string;
  candidateId:  string;
  organizationId: string;
  jobId:        string;
  candidateName: string;
  campaignCode: string;
  cvText:       string;
  agent:        AgentConfig;
  job:          JobConfig;
  turns:        InterviewTurn[];
  ended:        boolean;
}

/** Resolve a campaign code to everything the interview needs. */
export async function loadCampaignConfig(code: string) {
  const supabase = adminClient();

  const { data, error } = await supabase
    .from("campaigns")
    .select(`
      id, organization_id, job_id,
      jobs (
        id, title, description, requirements, screening_questions, ai_instructions,
        agent_profiles ( persona_name, tone, objective, guidelines, max_questions )
      )
    `)
    .eq("code", code)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !data?.jobs) return null;

  // `jobs` comes back as an object for a to-one relation, but the generated
  // types describe it loosely, so narrow it here rather than at every use.
  const job = data.jobs as unknown as {
    id: string; title: string; description: string; requirements: string[];
    screening_questions: { question: string; weight?: number }[] | null;
    ai_instructions: string | null;
    agent_profiles: AgentConfig | null;
  };

  // A job with no profile attached falls back to the org default, and then
  // to sane values — an interview should never fail because nobody set a tone.
  let agent = job.agent_profiles;
  if (!agent) {
    const { data: fallback } = await supabase
      .from("agent_profiles")
      .select("persona_name, tone, objective, guidelines, max_questions")
      .eq("organization_id", data.organization_id)
      .eq("is_default", true)
      .maybeSingle();
    agent = (fallback as AgentConfig | null) ?? {
      persona_name: "עמי", tone: "friendly", objective: "", guidelines: "", max_questions: 6,
    };
  }

  return {
    campaignId:     data.id,
    organizationId: data.organization_id,
    jobId:          job.id,
    agent,
    job: {
      title:               job.title,
      description:         job.description,
      requirements:        job.requirements ?? [],
      screening_questions: job.screening_questions ?? [],
      ai_instructions:     job.ai_instructions,
    } satisfies JobConfig,
  };
}

/**
 * Create the candidate and the interview session.
 *
 * The candidate row is created up front rather than at the end of the
 * interview: someone who uploaded a CV and started talking is a real lead
 * even if they abandon halfway, and that is exactly who gets lost when the
 * record is only written on completion.
 */
export type CreateSessionResult =
  | { kind: "created";  token: string; contextId: string; candidateId: string }
  | { kind: "resumed";  token: string; contextId: string; candidateId: string }
  | { kind: "finished" };

export async function createSession(params: {
  sessionToken:   string;
  campaignId:     string;
  organizationId: string;
  jobId:          string;
  fullName:       string;
  phone:          string;
  email:          string;
  cvText:         string;
  cvUrl?:         string | null;
  flags:          { id: string; excerpt: string }[];
}): Promise<CreateSessionResult> {
  const supabase = adminClient();

  // A returning applicant keeps one row per (job, email) — the schema's own
  // uniqueness rule. Re-applying updates the record instead of failing.
  const { data: candidate, error: candErr } = await supabase
    .from("candidates")
    .upsert({
      job_id:          params.jobId,
      organization_id: params.organizationId,
      full_name:       params.fullName,
      email:           params.email.toLowerCase(),
      phone:           params.phone,
      cv_url:          params.cvUrl ?? null,
      status:          "screening",
      source:          "campaign",
    }, { onConflict: "job_id,email" })
    .select("id")
    .single();

  if (candErr || !candidate) {
    throw new Error(`Could not create candidate: ${candErr?.message ?? "unknown"}`);
  }

  // ── Already applied to this job? ───────────────────────────────────
  // One session per (candidate, job) is enforced by a unique index. That
  // constraint is deliberate, and the three cases need different answers:
  //
  //   unfinished  → hand back the same token, so someone who closed the
  //                 tab mid-interview picks up where they left off instead
  //                 of starting over.
  //   finished    → refuse. Re-interviewing after seeing the questions is
  //                 exactly how a candidate would game the score.
  //   none        → create it.
  const { data: existing } = await supabase
    .from("conversation_contexts")
    .select("id, session_token, ended_at")
    .eq("candidate_id", candidate.id)
    .eq("job_id", params.jobId)
    .maybeSingle();

  if (existing) {
    if (existing.ended_at) return { kind: "finished" };
    return {
      kind:        "resumed",
      token:       existing.session_token ?? params.sessionToken,
      contextId:   existing.id,
      candidateId: candidate.id,
    };
  }

  const now = new Date().toISOString();
  const { data: ctx, error: ctxErr } = await supabase
    .from("conversation_contexts")
    .insert({
      candidate_id:    candidate.id,
      organization_id: params.organizationId,
      job_id:          params.jobId,
      campaign_id:     params.campaignId,
      channel:         "web",
      session_token:   params.sessionToken,
      // cv_text is stored so the prompt can be rebuilt on any request
      // without re-parsing the upload.
      cv_text:         params.cvText,
      transcript:      [],
      flags:           params.flags.map(f => ({ ...f, at: now })),
      started_at:      now,
    })
    .select("id")
    .single();

  if (ctxErr || !ctx) {
    throw new Error(`Could not create session: ${ctxErr?.message ?? "unknown"}`);
  }

  return { kind: "created", token: params.sessionToken, contextId: ctx.id, candidateId: candidate.id };
}

/** Load a session by its token. Returns null for unknown or expired tokens. */
export async function loadSession(token: string): Promise<StoredSession | null> {
  const supabase = adminClient();

  const { data, error } = await supabase
    .from("conversation_contexts")
    .select(`
      id, candidate_id, organization_id, job_id, cv_text, transcript, ended_at,
      candidates ( full_name ),
      campaigns ( code ),
      jobs (
        title, description, requirements, screening_questions, ai_instructions,
        agent_profiles ( persona_name, tone, objective, guidelines, max_questions )
      )
    `)
    .eq("session_token", token)
    .maybeSingle();

  if (error || !data) return null;

  const job = data.jobs as unknown as {
    title: string; description: string; requirements: string[];
    screening_questions: { question: string; weight?: number }[] | null;
    ai_instructions: string | null;
    agent_profiles: AgentConfig | null;
  } | null;

  const candidate = data.candidates as unknown as { full_name: string } | null;
  const campaign  = data.campaigns  as unknown as { code: string } | null;

  if (!job) return null;

  return {
    contextId:      data.id,
    candidateId:    data.candidate_id ?? "",
    organizationId: data.organization_id,
    jobId:          data.job_id ?? "",
    candidateName:  candidate?.full_name ?? "",
    campaignCode:   campaign?.code ?? "",
    cvText:         data.cv_text ?? "",
    agent: job.agent_profiles ?? {
      persona_name: "עמי", tone: "friendly", objective: "", guidelines: "", max_questions: 6,
    },
    job: {
      title:               job.title,
      description:         job.description,
      requirements:        job.requirements ?? [],
      screening_questions: job.screening_questions ?? [],
      ai_instructions:     job.ai_instructions,
    },
    turns: (data.transcript as unknown as InterviewTurn[]) ?? [],
    ended: Boolean(data.ended_at),
  };
}

/**
 * Append a turn.
 *
 * Written in two places on purpose: `transcript` is the working copy the
 * prompt is rebuilt from, and `messages` is the durable per-candidate
 * history the recruiter UI already reads. Keeping both means the existing
 * conversation screens work for web interviews with no changes.
 */
export async function appendTurn(params: {
  contextId:      string;
  candidateId:    string;
  organizationId: string;
  turns:          InterviewTurn[];
  turn:           InterviewTurn;
}): Promise<void> {
  const supabase = adminClient();

  await supabase
    .from("conversation_contexts")
    .update({ transcript: [...params.turns, params.turn] as never })
    .eq("id", params.contextId);

  if (params.candidateId) {
    await supabase.from("messages").insert({
      candidate_id:    params.candidateId,
      organization_id: params.organizationId,
      direction:       params.turn.role === "user" ? "inbound" : "outbound",
      sender:          params.turn.role === "user" ? "candidate" : "ai",
      // Strip the wrapping tags: they are a prompt-safety detail, not
      // something a recruiter should see in the transcript.
      content:         params.turn.content.replace(/<\/?candidate_message>/g, "").trim(),
      channel:         "web",
      sent_at:         params.turn.at,
    });
  }
}

/** Bump a campaign's conversion counter. */
export async function bumpConversions(code: string): Promise<void> {
  const supabase = adminClient();
  await supabase.rpc("increment_campaign_metric", { p_code: code, p_metric: "conversations" });
}

/** Bump a campaign's qualified counter once an interview completes. */
export async function bumpQualified(code: string): Promise<void> {
  const supabase = adminClient();
  await supabase.rpc("increment_campaign_metric", { p_code: code, p_metric: "qualified" });
}

export async function endSession(contextId: string): Promise<void> {
  const supabase = adminClient();
  await supabase
    .from("conversation_contexts")
    .update({ ended_at: new Date().toISOString(), is_complete: true })
    .eq("id", contextId);
}

/** Record injection signals for human review. Never auto-rejects anyone. */
export async function addFlags(
  contextId: string,
  existing: unknown[],
  signals: { id: string; excerpt: string }[],
): Promise<void> {
  if (signals.length === 0) return;
  const supabase = adminClient();
  const at = new Date().toISOString();
  await supabase
    .from("conversation_contexts")
    .update({ flags: [...existing, ...signals.map(s => ({ ...s, at }))] as never })
    .eq("id", contextId);
}
