// API Route — /api/candidates/list
// GET — paginated, filtered candidate list (recruiter, org-scoped)

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { apiSuccess, apiError } from "@/lib/utils";

export async function GET(request: NextRequest) {
  if (process.env.NEXT_PUBLIC_DEMO_MODE === "true" || request.cookies.has("hr-demo")) {
    const { DEMO_CANDIDATES } = await import("@/lib/demo/mock-data");
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.toLowerCase() ?? "";
    const status = searchParams.get("status") ?? "";
    const page   = parseInt(searchParams.get("page") ?? "1", 10);
    const limit  = parseInt(searchParams.get("limit") ?? "20", 10);

    let filtered = DEMO_CANDIDATES;
    if (search) filtered = filtered.filter(c =>
      c.full_name.toLowerCase().includes(search) ||
      c.email.toLowerCase().includes(search)
    );
    if (status) filtered = filtered.filter(c => c.status === status);

    const start = (page - 1) * limit;
    return NextResponse.json({
      success: true,
      data: {
        candidates: filtered.slice(start, start + limit),
        total: filtered.length,
        page,
        limit,
      },
    });
  }

  const supabase = await getSupabaseServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json(apiError("לא מחובר"), { status: 401 });

  const url    = new URL(request.url);
  const q      = url.searchParams.get("q") ?? "";
  const status = url.searchParams.get("status") ?? "";
  const jobId  = url.searchParams.get("job_id") ?? "";
  const page   = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
  const limit  = Math.min(50, parseInt(url.searchParams.get("limit") ?? "20", 10));
  const offset = (page - 1) * limit;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  let query = db
    .from("candidates")
    .select(`
      id, full_name, email, phone, status, ai_score, created_at,
      job:jobs ( id, title )
    `, { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (q) {
    query = query.or(`full_name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`);
  }
  if (status) {
    query = query.eq("status", status);
  }
  if (jobId) {
    query = query.eq("job_id", jobId);
  }

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json(apiError("שגיאה בטעינת מועמדים"), { status: 500 });
  }

  return NextResponse.json(
    apiSuccess({
      candidates: data ?? [],
      total:      count ?? 0,
      page,
      limit,
    })
  );
}
