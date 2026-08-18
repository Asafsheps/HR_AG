// ==================================================
// API — PATCH /api/campaigns/[id]
// ==================================================
// Pause or resume a campaign. Deactivating is the kill switch for a live
// ad: the landing page refuses the code within seconds of the toggle, so a
// bad post can be stopped without deleting its stats.

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { apiSuccess, apiError } from "@/lib/utils";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;

  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json(apiError("Unauthorized"), { status: 401 });

  const body = await req.json().catch(() => null) as { is_active?: boolean } | null;
  if (typeof body?.is_active !== "boolean") {
    return NextResponse.json(apiError("is_active נדרש"), { status: 400 });
  }

  // RLS scopes the update to the caller's org; an id from another tenant
  // matches zero rows and falls through to the 404.
  const { data, error } = await supabase
    .from("campaigns")
    .update({ is_active: body.is_active })
    .eq("id", id)
    .select("id, is_active")
    .maybeSingle();

  if (error) return NextResponse.json(apiError(error.message), { status: 500 });
  if (!data)  return NextResponse.json(apiError("הקמפיין לא נמצא"), { status: 404 });

  return NextResponse.json(apiSuccess(data));
}
