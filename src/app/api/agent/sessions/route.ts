// API — /api/agent/sessions
// GET — the interviews the agent is running, live from
// conversation_contexts. Previously demo-only; the real list maps each
// session to the shape the Agent Hub screen already renders.

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { apiSuccess, apiError } from "@/lib/utils";

export async function GET(req: NextRequest) {
  if (process.env.NEXT_PUBLIC_DEMO_MODE === "true" || req.cookies.has("hr-demo")) {
    const { DEMO_AGENT_SESSIONS } = await import("@/lib/demo/mock-data");
    return NextResponse.json({ success: true, data: DEMO_AGENT_SESSIONS });
  }

  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json(apiError("Unauthorized"), { status: 401 });

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const db = supabase as any;
  const { data, error } = await db
    .from("conversation_contexts")
    .select(`
      id, started_at, ended_at, transcript, flags, channel,
      candidates ( id, full_name, ai_score, phone ),
      jobs ( title )
    `)
    .order("started_at", { ascending: false })
    .limit(50);

  if (error) return NextResponse.json(apiError("שגיאה בטעינת סשנים"), { status: 500 });

  const sessions = (data ?? [])
    .filter((s: any) => s.candidates)
    .map((s: any) => {
      const turns = Array.isArray(s.transcript) ? s.transcript.length : 0;
      const last  = Array.isArray(s.transcript) && s.transcript.length > 0
        ? s.transcript[s.transcript.length - 1]?.at ?? s.started_at
        : s.started_at;
      const flagged = Array.isArray(s.flags) && s.flags.length > 0;
      return {
        id:              s.id,
        candidate_id:    s.candidates.id,
        candidate_name:  s.candidates.full_name,
        job_title:       s.jobs?.title ?? "",
        status:          flagged ? "escalated" : s.ended_at ? "completed" : "active",
        stage:           s.ended_at ? "done" : turns <= 2 ? "intro" : "screening",
        last_message_at: last,
        messages_count:  turns,
        ai_score:        s.candidates.ai_score,
        next_action:     s.ended_at ? null : "ממתין לתשובת המועמד",
        whatsapp_number: s.candidates.phone ?? null,
      };
    });

  return NextResponse.json(apiSuccess(sessions));
}

// Pausing/escalating a session from the hub is not built yet — say so
// honestly instead of pretending in demo and 501ing in production.
export async function PATCH() {
  return NextResponse.json(
    { success: false, error: "שליטה בסשן מהמסך הזה תתווסף בהמשך" },
    { status: 501 }
  );
}
