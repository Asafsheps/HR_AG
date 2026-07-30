// API — /api/agent/config
// GET  — current agent configuration
// PUT  — save agent configuration

import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  if (process.env.NEXT_PUBLIC_DEMO_MODE === "true" || req.cookies.has("hr-demo")) {
    const { DEMO_AGENT_CONFIG } = await import("@/lib/demo/mock-data");
    return NextResponse.json({ success: true, data: DEMO_AGENT_CONFIG });
  }
  return NextResponse.json({ success: false, error: "Not configured" }, { status: 404 });
}

export async function PUT(req: NextRequest) {
  if (process.env.NEXT_PUBLIC_DEMO_MODE === "true" || req.cookies.has("hr-demo")) {
    const body = await req.json().catch(() => ({}));
    // In real mode: save to DB. In demo: echo back
    return NextResponse.json({ success: true, data: body });
  }
  return NextResponse.json({ success: false, error: "Not implemented" }, { status: 501 });
}
