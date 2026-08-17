// ==================================================
// API — POST /api/interview/[token]/message
// GET  — transcript so far
// ==================================================
// One turn of the interview. Public, so the token is the only credential —
// it is 24 random bytes, which is why it can be.
//
// Everything the candidate sends is wrapped as data before it reaches the
// model. The interviewer cannot score and has no database access; both are
// enforced by what this route does and does not do, not by asking the model
// nicely.

import { NextRequest, NextResponse } from "next/server";
import { apiSuccess, apiError } from "@/lib/utils";
import { checkRateLimit } from "@/lib/security/rate-limiter";
import { sanitizeMessage } from "@/lib/security/prompt-safety";
import { callAI } from "@/lib/ai/providers";
import { buildInterviewerPrompt, wrapCandidateTurn, shouldEnd } from "@/lib/interview/prompt";
import {
  getDemoSession, appendDemoTurn, endDemoSession, flagDemoSession,
} from "@/lib/interview/session";
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
  const session = getDemoSession(token);
  if (!session) return NextResponse.json(apiError("השיחה לא נמצאה או הסתיימה"), { status: 404 });

  return NextResponse.json(apiSuccess({
    job_title:  session.job.title,
    agent_name: session.agent.persona_name,
    candidate:  session.candidate.full_name,
    turns:      publicTurns(session.turns),
    ended:      Boolean(session.endedAt),
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

  const session = getDemoSession(token);
  if (!session) return NextResponse.json(apiError("השיחה לא נמצאה או הסתיימה"), { status: 404 });
  if (session.endedAt) return NextResponse.json(apiError("השיחה הסתיימה"), { status: 409 });

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
    session.candidate.full_name,
  );

  const messages: AIMessage[] = session.turns.map(t => ({
    role: t.role,
    content: t.content,
  }));

  if (!isOpening) {
    const { text, signals } = sanitizeMessage(raw);

    // Flag, do not block. A candidate whose phrasing trips a pattern still
    // gets interviewed; the flag surfaces on the recruiter's side.
    if (signals.length) flagDemoSession(token, signals);

    const wrapped = wrapCandidateTurn(text);
    appendDemoTurn(token, { role: "user", content: wrapped, at: new Date().toISOString() });
    messages.push({ role: "user", content: wrapped });
  } else {
    messages.push({ role: "user", content: "התחל את הריאיון." });
  }

  let reply: string;
  try {
    const res = await callAI(messages, {
      systemPrompt,
      maxTokens:   700,
      temperature: 0.7,
    });
    reply = res.content.trim();
  } catch (e) {
    // Do not surface the provider's error to a candidate — it can leak
    // model names, keys in messages, or internal endpoints.
    console.error("[interview] AI call failed:", e);
    return NextResponse.json(
      apiError("תקלה זמנית. נסה לשלוח שוב בעוד רגע."),
      { status: 502 }
    );
  }

  appendDemoTurn(token, { role: "assistant", content: reply, at: new Date().toISOString() });

  // Count the agent's own turns rather than trusting it to stop on its own.
  const assistantTurns = session.turns.filter(t => t.role === "assistant").length;
  const ended = shouldEnd(assistantTurns, session.agent.max_questions);
  if (ended) endDemoSession(token);

  return NextResponse.json(apiSuccess({ reply, ended }));
}
