// ==================================================
// API — GET /api/companies
// ==================================================
// The partner companies (Yael Group, Yael Soft, Koren Tec, SoftwareOne…)
// with their imported jobs. This is the business-development side of the
// product: which companies pay a placement bonus, how candidates are
// submitted to each, and which of their jobs are in our pipeline.

import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { apiSuccess, apiError } from "@/lib/utils";

export async function GET() {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json(apiError("Unauthorized"), { status: 401 });

  const { data, error } = await supabase
    .from("client_companies")
    .select(`
      id, name, website, careers_url, submission_method, submission_config,
      bonus_amount_ils, bonus_delay_months, bonus_notes, status,
      contact_name, contact_email, notes,
      client_jobs (
        id, external_ref, source_url, title, location, employment_type,
        core_skills, min_years, business_priority, is_reviewed, status, created_at
      )
    `)
    .order("name");

  if (error) return NextResponse.json(apiError(error.message), { status: 500 });
  return NextResponse.json(apiSuccess({ companies: data ?? [] }));
}
