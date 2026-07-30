// ==================================================
// API Route — /api/jobs
// GET  — list jobs for the current org
// POST — create a new job
// ==================================================

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { createJobSchema } from "@/lib/validators/job";
import { slugify, apiSuccess, apiError } from "@/lib/utils";

// GET /api/jobs
export async function GET(request: NextRequest) {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json(apiError("Unauthorized"), { status: 401 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const page   = parseInt(searchParams.get("page") ?? "1");
  const limit  = parseInt(searchParams.get("limit") ?? "20");
  const offset = (page - 1) * limit;

  let query = supabase
    .from("jobs")
    .select("*, recruiter_profiles(full_name)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) query = query.eq("status", status);

  const { data, error, count } = await query;
  if (error) return NextResponse.json(apiError(error.message), { status: 500 });

  return NextResponse.json(apiSuccess({ jobs: data, total: count ?? 0, page, limit }));
}

// POST /api/jobs
export async function POST(request: NextRequest) {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json(apiError("Unauthorized"), { status: 401 });

  const body = await request.json();
  const parsed = createJobSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(apiError(parsed.error.errors[0].message), { status: 400 });
  }

  // Get the user's organization
  const { data: profile } = await supabase
    .from("recruiter_profiles")
    .select("organization_id, role")
    .eq("id", user.id)
    .single();

  if (!profile) return NextResponse.json(apiError("Profile not found"), { status: 404 });
  if (!["super_admin", "admin", "recruiter"].includes(profile.role)) {
    return NextResponse.json(apiError("Insufficient permissions"), { status: 403 });
  }

  // Build a unique slug within the org
  const baseSlug = slugify(parsed.data.title);
  const slug = `${baseSlug}-${Date.now().toString(36)}`;

  const { data: job, error } = await supabase
    .from("jobs")
    .insert({
      ...parsed.data,
      organization_id: profile.organization_id,
      created_by:      user.id,
      slug,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json(apiError(error.message), { status: 500 });
  }

  return NextResponse.json(apiSuccess(job), { status: 201 });
}
