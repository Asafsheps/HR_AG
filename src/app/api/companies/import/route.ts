// ==================================================
// API — POST /api/companies/import
// ==================================================
// Paste-based job import — the deliberate alternative to scraping.
// Careers sites block automated collection (SoftwareOne returned 429 on
// our FIRST request during research), and a blocked scraper flags us with
// a business partner. So Asaf copies a posting from the company's careers
// page, pastes it here, and the AI extracts structured screening criteria.
//
// The import lands as is_reviewed=false: AI extraction is a draft until a
// human confirms it, and activation into a live funnel job is a separate,
// explicit step.

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { apiSuccess, apiError } from "@/lib/utils";
import { callAI } from "@/lib/ai/providers";
import { wrapUntrusted } from "@/lib/security/prompt-safety";

export async function POST(request: NextRequest) {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json(apiError("Unauthorized"), { status: 401 });

  const body = await request.json().catch(() => null) as {
    company_id?: string; raw_text?: string; source_url?: string; external_ref?: string;
  } | null;

  const rawText = body?.raw_text?.trim() ?? "";
  if (!body?.company_id)     return NextResponse.json(apiError("נא לבחור חברה"), { status: 400 });
  if (rawText.length < 40)   return NextResponse.json(apiError("הדבק את טקסט המשרה המלא"), { status: 400 });
  if (rawText.length > 20000) return NextResponse.json(apiError("הטקסט ארוך מדי"), { status: 400 });

  // RLS scopes to the caller's org.
  const { data: company } = await supabase
    .from("client_companies")
    .select("id, organization_id, name")
    .eq("id", body.company_id)
    .maybeSingle();
  if (!company) return NextResponse.json(apiError("החברה לא נמצאה"), { status: 404 });

  // Pasted postings are third-party text; wrapped as data like every other
  // untrusted input that reaches a model.
  let extracted: {
    title?: string; location?: string; employment_type?: string;
    core_skills?: string[]; nice_to_have?: string[]; min_years?: number | null;
    business_priority?: string; candidate_expectations?: string;
  };
  let model = "";
  try {
    const res = await callAI(
      [{
        role: "user",
        content: `חלץ קריטריונים מובנים ממודעת הדרושים הבאה.

${wrapUntrusted("job_posting", rawText)}

החזר JSON בלבד:
{
  "title": "שם התפקיד",
  "location": "מיקום או null",
  "employment_type": "full_time|part_time|contract|null",
  "core_skills": ["דרישות חובה — כלים ומיומנויות שבלעדיהם המועמד נפסל"],
  "nice_to_have": ["יתרונות"],
  "min_years": מספר שנות ניסיון מינימלי או null,
  "business_priority": "משפט אחד — מה כנראה הכי חשוב למעסיק כאן",
  "candidate_expectations": "משפט אחד — מה המועמד צריך לקבל על עצמו (משמרות, נסיעות, אתר)"
}`,
      }],
      { maxTokens: 6000, temperature: 0.2 }
    );
    model = `${res.provider}/${res.model}`;
    const c = res.content.trim();
    extracted = JSON.parse(c.slice(c.indexOf("{"), c.lastIndexOf("}") + 1));
  } catch (e) {
    console.error("[import] extraction failed:", e);
    return NextResponse.json(apiError("חילוץ הקריטריונים נכשל — נסה שוב"), { status: 502 });
  }

  const { data: row, error } = await supabase
    .from("client_jobs")
    .insert({
      organization_id:   company.organization_id,
      client_company_id: company.id,
      external_ref:      body.external_ref?.trim() || null,
      source_url:        body.source_url?.trim() || null,
      title:             extracted.title?.trim() || "משרה ללא כותרת",
      location:          extracted.location ?? null,
      employment_type:   extracted.employment_type ?? null,
      // The raw posting stays intact for reference; criteria evolve separately.
      description:       rawText,
      core_skills:       Array.isArray(extracted.core_skills) ? extracted.core_skills : [],
      nice_to_have:      Array.isArray(extracted.nice_to_have) ? extracted.nice_to_have : [],
      min_years:         typeof extracted.min_years === "number" ? extracted.min_years : null,
      business_priority: extracted.business_priority ?? null,
      candidate_expectations: extracted.candidate_expectations ?? null,
      extracted_at:      new Date().toISOString(),
      extraction_model:  model,
      is_reviewed:       false,
      status:            "open",
    })
    .select("id, title, core_skills, nice_to_have, min_years, business_priority")
    .single();

  if (error || !row) {
    console.error("[import] insert failed:", error?.message);
    return NextResponse.json(apiError("שגיאה בשמירת המשרה"), { status: 500 });
  }

  return NextResponse.json(apiSuccess(row), { status: 201 });
}
