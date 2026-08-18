// ==================================================
// API — /api/campaigns
// ==================================================
// GET  — the org's campaigns with their funnel counters, newest first.
// POST — create a campaign for a job; the landing URL is derived from the
//        generated code, so a campaign is usable the moment it exists.
//
// Runs on the authenticated client: RLS confines every read and write to
// the caller's organization, and the recruiter-role policy decides who may
// create. No service role here — nothing needs to bypass the rules.

import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { apiSuccess, apiError } from "@/lib/utils";

// No 0/O/1/I — these codes get read aloud and retyped from printed ads.
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_LENGTH   = 5;

function generateCode(): string {
  const bytes = randomBytes(CODE_LENGTH);
  let out = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    out += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  }
  return out;
}

const CHANNELS = ["facebook", "linkedin", "instagram", "whatsapp", "telegram", "print", "other"] as const;

export async function GET() {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json(apiError("Unauthorized"), { status: 401 });

  const { data, error } = await supabase
    .from("campaigns")
    .select("id, code, channel, ad_copy, landing_url, is_active, clicks, conversations, qualified, created_at, jobs ( id, title )")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json(apiError(error.message), { status: 500 });
  return NextResponse.json(apiSuccess({ campaigns: data ?? [] }));
}

export async function POST(req: NextRequest) {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json(apiError("Unauthorized"), { status: 401 });

  const body = await req.json().catch(() => null) as {
    job_id?: string; channel?: string; ad_copy?: string;
  } | null;

  if (!body?.job_id) return NextResponse.json(apiError("נא לבחור משרה"), { status: 400 });
  const channel = (body.channel ?? "other").toLowerCase();
  if (!(CHANNELS as readonly string[]).includes(channel)) {
    return NextResponse.json(apiError("ערוץ לא מוכר"), { status: 400 });
  }

  const { data: profile } = await supabase
    .from("recruiter_profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();
  if (!profile) return NextResponse.json(apiError("פרופיל מגייס לא נמצא"), { status: 403 });

  // RLS also verifies the job belongs to the caller's org — a job_id from
  // another tenant simply comes back empty here.
  const { data: job } = await supabase
    .from("jobs")
    .select("id, title")
    .eq("id", body.job_id)
    .maybeSingle();
  if (!job) return NextResponse.json(apiError("המשרה לא נמצאה"), { status: 404 });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() ?? "";

  // Codes are globally unique; on the rare collision, retry with a fresh one
  // rather than failing the request over 1-in-33M luck.
  for (let attempt = 0; attempt < 3; attempt++) {
    const code = generateCode();
    const { data: created, error } = await supabase
      .from("campaigns")
      .insert({
        organization_id: profile.organization_id,
        job_id:          job.id,
        code,
        channel,
        ad_copy:         body.ad_copy?.trim() ?? "",
        landing_url:     `${appUrl}/j/${code}`,
        is_active:       true,
      })
      .select("id, code, landing_url")
      .single();

    if (!error) return NextResponse.json(apiSuccess(created), { status: 201 });
    if (!/duplicate|unique/i.test(error.message)) {
      return NextResponse.json(apiError(error.message), { status: 500 });
    }
  }

  return NextResponse.json(apiError("לא הצלחנו ליצור קוד ייחודי — נסה שוב"), { status: 500 });
}
