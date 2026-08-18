// ==================================================
// API — GET /api/assignments/[id]/file
// ==================================================
// Hands the recruiter a submitted assignment file from the private
// assignment-submissions bucket, same two-layer model as the CV route:
// the assignment is fetched with the caller's client (RLS decides), then
// the service role signs a short-lived URL.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { apiError } from "@/lib/utils";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params;

  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json(apiError("Unauthorized"), { status: 401 });

  const { data: a } = await supabase
    .from("assignments")
    .select("submission_url, candidates ( full_name )")
    .eq("id", id)
    .maybeSingle();

  // An http(s) value is an external link the candidate pasted, not a file
  // of ours to sign.
  if (!a?.submission_url || /^https?:\/\//i.test(a.submission_url)) {
    return NextResponse.json(apiError("אין קובץ הגשה"), { status: 404 });
  }

  const admin = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!.trim(),
    process.env.SUPABASE_SERVICE_ROLE_KEY!.trim(),
    { auth: { persistSession: false } }
  );

  const wantsDownload = req.nextUrl.searchParams.get("download") === "1";
  const name = (a.candidates as unknown as { full_name: string } | null)?.full_name ?? "candidate";
  const ext  = a.submission_url.split(".").pop() ?? "bin";

  const { data: signed, error } = await admin.storage
    .from("assignment-submissions")
    .createSignedUrl(a.submission_url, 300, wantsDownload
      ? { download: `Assignment-${name}.${ext}` }
      : undefined);

  if (error || !signed) {
    console.error("[assignment-file] sign failed:", error?.message);
    return NextResponse.json(apiError("הקובץ לא זמין"), { status: 404 });
  }

  return NextResponse.redirect(signed.signedUrl, 302);
}
