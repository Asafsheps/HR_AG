// API — /api/agent/sessions/[sessionId]
// GET — the full message thread of one interview session, live from the
// stored transcript. Previously demo-only.

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { apiSuccess, apiError } from "@/lib/utils";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;

  if (process.env.NEXT_PUBLIC_DEMO_MODE === "true" || req.cookies.has("hr-demo")) {
    const { DEMO_AGENT_SESSIONS, DEMO_AGENT_THREAD } = await import("@/lib/demo/mock-data");
    const session = DEMO_AGENT_SESSIONS.find(s => s.id === sessionId) ?? DEMO_AGENT_SESSIONS[0];
    return NextResponse.json({ success: true, data: { session, thread: DEMO_AGENT_THREAD } });
  }

  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json(apiError("Unauthorized"), { status: 401 });

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const db = supabase as any;
  const { data: s } = await db
    .from("conversation_contexts")
    .select(`
      id, started_at, ended_at, transcript, flags,
      candidates ( id, full_name, ai_score, phone ),
      jobs ( title )
    `)
    .eq("id", sessionId)
    .maybeSingle();

  if (!s?.candidates) return NextResponse.json(apiError("סשן לא נמצא"), { status: 404 });

  const transcript: { role: string; content: string; at: string }[] =
    Array.isArray(s.transcript) ? s.transcript : [];

  const thread = transcript.map((t, i) => ({
    id:        `${s.id}-${i}`,
    type:      "message",
    // In the hub's vocabulary, inbound is the candidate speaking.
    direction: t.role === "user" ? "inbound" : "outbound",
    body:      (t.content ?? "").replace(/<\/?candidate_message>/g, "").trim(),
    timestamp: t.at,
    agent_note: null,
  }));

  const flagged = Array.isArray(s.flags) && s.flags.length > 0;
  const session = {
    id:              s.id,
    candidate_id:    s.candidates.id,
    candidate_name:  s.candidates.full_name,
    job_title:       s.jobs?.title ?? "",
    status:          flagged ? "escalated" : s.ended_at ? "completed" : "active",
    stage:           s.ended_at ? "done" : "screening",
    last_message_at: transcript.at(-1)?.at ?? s.started_at,
    messages_count:  transcript.length,
    ai_score:        s.candidates.ai_score,
    next_action:     s.ended_at ? null : "ממתין לתשובת המועמד",
    whatsapp_number: s.candidates.phone ?? null,
  };

  return NextResponse.json(apiSuccess({ session, thread }));
}
