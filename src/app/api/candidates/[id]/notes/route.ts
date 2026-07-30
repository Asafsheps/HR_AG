// API Route — /api/candidates/[id]/notes
// GET  — list notes for a candidate
// POST — add a note

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { apiSuccess, apiError } from "@/lib/utils";
import { z } from "zod";

const noteSchema = z.object({
  content: z.string().min(1, "תוכן ההערה לא יכול להיות ריק").max(2000),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await getSupabaseServerClient();
  const { id } = await params;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json(apiError("לא מחובר"), { status: 401 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data, error } = await db
    .from("candidate_notes")
    .select(`
      id, content, created_at, updated_at,
      recruiter:recruiter_profiles (
        full_name, avatar_url
      )
    `)
    .eq("candidate_id", id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json(apiError("שגיאה בטעינת הערות"), { status: 500 });

  return NextResponse.json(apiSuccess(data ?? []));
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await getSupabaseServerClient();
  const { id: candidateId } = await params;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json(apiError("לא מחובר"), { status: 401 });

  const body = await request.json().catch(() => ({}));
  const parsed = noteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(apiError(parsed.error.errors[0].message), { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  // Get recruiter profile id
  const { data: profile } = await db
    .from("recruiter_profiles")
    .select("id")
    .eq("id", user.id)
    .single();

  if (!profile) return NextResponse.json(apiError("פרופיל מגייס לא נמצא"), { status: 403 });

  const { data, error } = await db
    .from("candidate_notes")
    .insert({
      candidate_id: candidateId,
      recruiter_id: profile.id,
      content:      parsed.data.content,
    })
    .select(`
      id, content, created_at,
      recruiter:recruiter_profiles (
        full_name, avatar_url
      )
    `)
    .single();

  if (error) return NextResponse.json(apiError("שגיאה בשמירת ההערה"), { status: 500 });

  return NextResponse.json(apiSuccess(data), { status: 201 });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await getSupabaseServerClient();
  await params; // candidate id - not needed for delete by note id

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json(apiError("לא מחובר"), { status: 401 });

  const url    = new URL(request.url);
  const noteId = url.searchParams.get("note_id");
  if (!noteId) return NextResponse.json(apiError("note_id נדרש"), { status: 400 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { error } = await db
    .from("candidate_notes")
    .delete()
    .eq("id", noteId)
    .eq("recruiter_id", user.id);

  if (error) return NextResponse.json(apiError("מחיקה נכשלה"), { status: 500 });

  return NextResponse.json(apiSuccess({ deleted: true }));
}
