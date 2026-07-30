// API — /api/agent/sessions/[sessionId]
// GET — full annotated message thread for a session

import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  if (process.env.NEXT_PUBLIC_DEMO_MODE === "true" || req.cookies.has("hr-demo")) {
    const { DEMO_AGENT_SESSIONS, DEMO_AGENT_THREAD } = await import("@/lib/demo/mock-data");
    const { sessionId } = await params;
    const session = DEMO_AGENT_SESSIONS.find(s => s.id === sessionId) ?? DEMO_AGENT_SESSIONS[0];
    // Only session-1 has a full thread; others get a minimal thread
    const thread = sessionId === "session-1"
      ? DEMO_AGENT_THREAD
      : [
          { id: "x1", type: "message", direction: "inbound",  body: "שלום, אני מעוניין במשרה.", timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), agent_note: null },
          { id: "x1-ann", type: "agent_action", action: "score_update", body: "פתיחת שיחה — ניקוד בסיס +5", score_delta: 5, timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000 + 2000).toISOString(), agent_note: null },
          { id: "x2", type: "message", direction: "outbound", body: `שלום ${session.candidate_name.split(" ")[0]}! 👋 שמחים שפנית. ספר/י קצת על הניסיון שלך.`, timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000 + 10000).toISOString(), agent_note: "שאלת פתיחה" },
        ];
    return NextResponse.json({ success: true, data: { session, thread } });
  }
  return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
}
