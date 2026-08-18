// ==================================================
// API — GET /api/candidates/[id]/cv
// ==================================================
// Hands the recruiter the candidate's CV from the private cv-uploads
// bucket. The stored cv_url is a bucket path, not a URL — linking it
// directly 404s, which is exactly the bug this route replaces.
//
// Default: redirect to a short-lived signed URL served inline, so a PDF
// opens in the browser for viewing. ?download=1 adds a content-disposition
// attachment for saving the file.
//
// Access control is two-layered: the candidate row is fetched with the
// caller's own client, so RLS decides whether this recruiter may see this
// candidate at all; only then does the service role sign the storage URL.

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

  const { data: candidate } = await supabase
    .from("candidates")
    .select("cv_url, full_name")
    .eq("id", id)
    .maybeSingle();

  if (!candidate)        return NextResponse.json(apiError("המועמד לא נמצא"), { status: 404 });
  if (!candidate.cv_url) return NextResponse.json(apiError("למועמד אין קובץ קורות חיים"), { status: 404 });

  const admin = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!.trim(),
    process.env.SUPABASE_SERVICE_ROLE_KEY!.trim(),
    { auth: { persistSession: false } }
  );

  const wantsDownload = req.nextUrl.searchParams.get("download") === "1";
  const ext = candidate.cv_url.split(".").pop() ?? "pdf";

  const { data: signed, error } = await admin.storage
    .from("cv-uploads")
    .createSignedUrl(candidate.cv_url, 300, wantsDownload
      // Named after the candidate, so a folder of saved CVs stays legible.
      ? { download: `CV-${candidate.full_name}.${ext}` }
      : undefined);

  if (error || !signed) {
    console.error("[cv] sign failed:", error?.message);
    return NextResponse.json(apiError("הקובץ לא זמין"), { status: 404 });
  }

  return NextResponse.redirect(signed.signedUrl, 302);
}
