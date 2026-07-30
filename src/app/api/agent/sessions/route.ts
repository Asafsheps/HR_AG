// API — /api/agent/sessions
// GET  — list all active agent sessions (conversations the AI is managing)
// PATCH — pause / resume / escalate a session

import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  if (process.env.NEXT_PUBLIC_DEMO_MODE === "true" || req.cookies.has("hr-demo")) {
    const { DEMO_AGENT_SESSIONS } = await import("@/lib/demo/mock-data");
    return NextResponse.json({ success: true, data: DEMO_AGENT_SESSIONS });
  }
  return NextResponse.json({ success: true, data: [] });
}

export async function PATCH(req: NextRequest) {
  if (process.env.NEXT_PUBLIC_DEMO_MODE === "true" || req.cookies.has("hr-demo")) {
    const body = await req.json().catch(() => ({}));
    return NextResponse.json({ success: true, data: { updated: true, ...body } });
  }
  return NextResponse.json({ success: false, error: "Not implemented" }, { status: 501 });
}
