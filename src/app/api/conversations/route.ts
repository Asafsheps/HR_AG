// API Route — /api/conversations
// GET — list all candidates with WhatsApp conversation activity, org-scoped

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { apiSuccess, apiError } from "@/lib/utils";

export async function GET(request: NextRequest) {
  if (process.env.NEXT_PUBLIC_DEMO_MODE === "true" || request.cookies.has("hr-demo")) {
    const { DEMO_CANDIDATES } = await import("@/lib/demo/mock-data");
    const withWhatsapp = DEMO_CANDIDATES.filter(c => c.whatsapp_number);
    return NextResponse.json({ success: true, data: withWhatsapp });
  }

  const supabase = await getSupabaseServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json(apiError("לא מחובר"), { status: 401 });

  const url    = new URL(request.url);
  const search = url.searchParams.get("q") ?? "";
  const status = url.searchParams.get("status") ?? "";
  const page   = parseInt(url.searchParams.get("page") ?? "1", 10);
  const limit  = 20;
  const offset = (page - 1) * limit;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  // Subquery: latest message per candidate
  let query = db
    .from("candidates")
    .select(`
      id, full_name, phone, whatsapp_number, status, ai_score, updated_at,
      job:jobs ( id, title ),
      last_message:messages (
        body, direction, created_at
      )
    `)
    .not("whatsapp_number", "is", null)
    .order("updated_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (search) {
    query = query.ilike("full_name", `%${search}%`);
  }
  if (status) {
    query = query.eq("status", status);
  }

  const { data, error, count } = await query;
  if (error) return NextResponse.json(apiError("שגיאה בטעינת שיחות"), { status: 500 });

  return NextResponse.json(
    apiSuccess({
      conversations: data ?? [],
      total:         count ?? 0,
      page,
    })
  );
}
