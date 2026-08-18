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

  // messages!inner: only candidates that actually have a conversation.
  // The old filter was whatsapp_number IS NOT NULL, which silently hid
  // every web-chat interview — the main channel — from this screen.
  // Aliases map the real columns (content, sent_at) to the keys the UI
  // already reads (body, created_at).
  let query = db
    .from("candidates")
    .select(`
      id, full_name, phone, whatsapp_number, status, ai_score, updated_at,
      job:jobs ( id, title ),
      last_message:messages!inner (
        body:content, direction, created_at:sent_at
      )
    `)
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
