// API Route — /api/conversations/[candidateId]
// GET — full WhatsApp message thread for a candidate

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { apiSuccess, apiError } from "@/lib/utils";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ candidateId: string }> }
) {
  if (process.env.NEXT_PUBLIC_DEMO_MODE === "true" || req.cookies.has("hr-demo")) {
    const { DEMO_CANDIDATES, DEMO_MESSAGES } = await import("@/lib/demo/mock-data");
    const { candidateId } = await params;
    const candidate = DEMO_CANDIDATES.find(c => c.id === candidateId) ?? DEMO_CANDIDATES[0];
    const messages  = candidateId === "demo-1" ? DEMO_MESSAGES : [];
    return NextResponse.json({ success: true, data: { candidate, messages } });
  }

  const supabase = await getSupabaseServerClient();
  const { candidateId } = await params;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json(apiError("לא מחובר"), { status: 401 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  // Candidate header
  const { data: candidate } = await db
    .from("candidates")
    .select(`
      id, full_name, phone, whatsapp_number, status, ai_score, ai_summary,
      job:jobs ( id, title )
    `)
    .eq("id", candidateId)
    .single();

  if (!candidate) return NextResponse.json(apiError("מועמד לא נמצא"), { status: 404 });

  // Full message thread
  const { data: messages, error } = await db
    .from("whatsapp_messages")
    .select("id, direction, sender, body, provider_message_id, created_at")
    .eq("candidate_id", candidateId)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json(apiError("שגיאה בטעינת השיחה"), { status: 500 });

  return NextResponse.json(
    apiSuccess({ candidate, messages: messages ?? [] })
  );
}
