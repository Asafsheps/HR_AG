// API Route — /api/jobs/[id]/public
// GET — public job info by ID or slug (no auth required)

import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params;

  // Demo mode OR always use demo data when Supabase is placeholder
  const { DEMO_JOBS } = await import("@/lib/demo/mock-data");

  // Support lookup by ID OR by slug
  const job = DEMO_JOBS.find(j => j.id === id || j.slug === id);

  if (!job) {
    return NextResponse.json({ success: false, error: "משרה לא נמצאה" }, { status: 404 });
  }

  const { id: jid, slug, title, location, type, salary_range, description, requirements, nice_to_have, whatsapp_bot_number } = job;
  return NextResponse.json({
    success: true,
    data: { id: jid, slug, title, location, type, salary_range, description, requirements, nice_to_have, whatsapp_bot_number },
  });
}
