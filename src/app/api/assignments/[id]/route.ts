// API Route — GET /api/assignments/[id]
// Public read for candidate-facing page (no auth) + PATCH for recruiter (auth)

import { NextRequest, NextResponse } from "next/server";
import { apiSuccess, apiError } from "@/lib/utils";

type Params = { params: Promise<{ id: string }> };

// Public GET — candidate uses this to load their assignment
export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params;

  // Demo mode
  if (process.env.NEXT_PUBLIC_DEMO_MODE === "true" || req.cookies.has("hr-demo")) {
    const { DEMO_ASSIGNMENTS } = await import("@/lib/demo/mock-data");
    const assignment = DEMO_ASSIGNMENTS.find(a => a.id === id);
    if (!assignment) return NextResponse.json(apiError("מטלה לא נמצאה"), { status: 404 });
    return NextResponse.json(apiSuccess(assignment));
  }

  return NextResponse.json(apiError("מטלה לא נמצאה"), { status: 404 });
}

// PATCH — recruiter sends / updates assignment
export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;

  // Demo mode
  if (process.env.NEXT_PUBLIC_DEMO_MODE === "true" || request.cookies.has("hr-demo")) {
    const body = await request.json().catch(() => ({}));
    return NextResponse.json(apiSuccess({ id, ...body, updated_at: new Date().toISOString() }));
  }

  return NextResponse.json(apiError("Unauthorized"), { status: 401 });
}
