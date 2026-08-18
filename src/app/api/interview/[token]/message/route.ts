// ==================================================
// API — POST /api/interview/[token]/message
// GET  — transcript so far
// ==================================================
// One turn of the interview. Public, so the token is the only credential —
// it is 24 random bytes, which is why it can be.
//
// Everything the candidate sends is wrapped as data before it reaches the
// model. The interviewer cannot score and has no database access of its
// own; both are enforced by what this route does and does not do, not by
// asking the model nicely.

import { NextRequest, NextResponse } from "next/server";
import { apiSuccess, apiError } from "@/lib/utils";
import { checkRateLimit } from "@/lib/security/rate-limiter";
import { sanitizeMessage } from "@/lib/security/prompt-safety";
import { callAI } from "@/lib/ai/providers";
import { aiRoleOptionsFor } from "@/lib/ai/settings";
import { buildInterviewerPrompt, wrapCandidateTurn, shouldEnd } from "@/lib/interview/prompt";
import { loadSession, appendTurn, endSession, addFlags, bumpQualified } from "@/lib/interview/store";
import { scoreInterview } from "@/lib/interview/scorer";
import type { AIMessage } from "@/types";

type Params = { params: Promise<{ token: string }> };

/** Public view of a turn — the wrapping tags are an implementation detail. */
function publicTurns(turns: { role: string; content: string; at: string }[]) {
  return turns.map(t => ({
    role: t.role,
    content: t.content.replace(/<\/?candidate_message>/g, "").trim(),
    at: t.at,
  }));
}

export async function GET(_req: NextRequest, { params }: Params) {
  const { token } = await params;
  const session = await loadSession(token);
  if (!session) return NextResponse.json(apiError("השיחה לא נמצאה או הסתיימה"), { status: 404 });

  return NextResponse.json(apiSuccess({
    job_title:  session.job.title,
    agent_name: session.agent.persona_name,
    candidate:  session.candidateName,
    turns:      publicTurns(session.turns),
    ended:      session.ended,
  }));
}

export async function POST(req: NextRequest, { params }: Params) {
  const { token } = await params;

  // Per-session rather than per-IP: two candidates behind one office NAT
  // must not throttle each other, but one session cannot loop forever.
  const rl = checkRateLimit({ key: "interview-msg", id: token, limit: 40, windowSec: 3600 });
  if (!rl.allowed) {
    return NextResponse.json(apiError("יותר מדי הודעות. נסה שוב מאוחר יותר."), { status: 429 });
  }

  const session = await loadSession(token);
  if (!session)       return NextResponse.json(apiError("השיחה לא נמצאה או הסתיימה"), { status: 404 });
  if (session.ended)  return NextResponse.json(apiError("השיחה הסתיימה"), { status: 409 });

  const body = await req.json().catch(() => null) as { message?: string } | null;
  const raw  = body?.message ?? "";

  // An empty first call is how the client asks for the opening greeting.
  const isOpening = session.turns.length === 0 && !raw.trim();
  if (!isOpening && !raw.trim()) {
    return NextResponse.json(apiError("הודעה ריקה"), { status: 400 });
  }

  const systemPrompt = buildInterviewerPrompt(
    session.agent,
    session.job,
    session.cvText,
    session.candidateName,
  );

  const messages: AIMessage[] = session.turns.map(t => ({
    role: t.role,
    content: t.content,
  }));

  let turnsSoFar = session.turns;

  if (!isOpening) {
    const { text, signals } = sanitizeMessage(raw);

    // Flag, do not block. A candidate whose phrasing trips a pattern still
    // gets interviewed; the flag surfaces on the recruiter's side.
    if (signals.length) await addFlags(session.contextId, [], signals);

    const wrapped = wrapCandidateTurn(text);
    const userTurn = { role: "user" as const, content: wrapped, at: new Date().toISOString() };

    await appendTurn({
      contextId:      session.contextId,
      candidateId:    session.candidateId,
      organizationId: session.organizationId,
      turns:          turnsSoFar,
      turn:           userTurn,
    });

    turnsSoFar = [...turnsSoFar, userTurn];
    messages.push({ role: "user", content: wrapped });
  } else {
    messages.push({ role: "user", content: "התחל את הריאיון." });
  }

  let reply: string;
  try {
    // 1400 rather than 700: Gemini counts internal reasoning against the
    // output budget, and at 700 replies arrived truncated mid-sentence.
    const res = await callAI(messages, {
      systemPrompt,
      maxTokens: 1400,
      temperature: 0.7,
      // Settings-screen override first, env defaults second.
      ...(await aiRoleOptionsFor("interview", session.organizationId)),
    });
    reply = res.content.trim();
  } catch (e) {
    // Do not surface the provider's error to a candidate — it can leak
    // model names, keys echoed in messages, or internal endpoints.
    console.error("[interview] AI call failed:", e);
    return NextResponse.json(apiError("תקלה זמנית. נסה לשלוח שוב בעוד רגע."), { status: 502 });
  }

  const aiTurn = { role: "assistant" as const, content: reply, at: new Date().toISOString() };
  await appendTurn({
    contextId:      session.contextId,
    candidateId:    session.candidateId,
    organizationId: session.organizationId,
    turns:          turnsSoFar,
    turn:           aiTurn,
  });

  // Count the agent's own turns rather than trusting it to stop on its own.
  // A model told "maximum 6 questions" will occasionally ask a seventh, and
  // the cap bounds cost as well as candidate patience.
  const assistantTurns = turnsSoFar.filter(t => t.role === "assistant").length + 1;
  const ended = shouldEnd(assistantTurns, session.agent.max_questions);

  if (ended) {
    await endSession(session.contextId);

    // Score in a separate pass, awaited so the recruiter sees a result
    // immediately rather than an empty row that fills in later. A scoring
    // failure must not affect the candidate, who has already finished —
    // scoreInterview swallows its own errors and returns null.
    const scored = await scoreInterview({
      candidateId:    session.candidateId,
      organizationId: session.organizationId,
      jobId:          session.jobId,
      candidateName:  session.candidateName,
      job:            session.job,
      turns:          [...turnsSoFar, aiTurn],
    });

    if (scored) await bumpQualified(session.campaignCode).catch(() => {});
  }

  return NextResponse.json(apiSuccess({ reply, ended }));
}
