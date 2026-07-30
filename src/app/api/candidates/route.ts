// API Route — /api/candidates
// POST — submit a job application (public, no auth required)
// Accepts multipart/form-data: fields + optional cv_file

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient, getSupabaseAdminClient } from "@/lib/supabase/server";
import { applyJobSchema } from "@/lib/validators/candidate";
import { apiSuccess, apiError } from "@/lib/utils";

export async function POST(request: NextRequest) {
  const supabase = await getSupabaseServerClient();
  const adminClient = await getSupabaseAdminClient();

  const formData = await request.formData();

  // Parse JSON fields from form data
  const raw = {
    full_name:          formData.get("full_name"),
    email:              formData.get("email"),
    phone:              formData.get("phone"),
    linkedin_url:       formData.get("linkedin_url") ?? "",
    portfolio_url:      formData.get("portfolio_url") ?? "",
    cover_letter:       formData.get("cover_letter") ?? "",
    whatsapp_consent:   formData.get("whatsapp_consent") === "true",
    screening_answers:  formData.get("screening_answers")
      ? JSON.parse(formData.get("screening_answers") as string)
      : undefined,
  };

  const parsed = applyJobSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(apiError(parsed.error.errors[0].message), { status: 400 });
  }

  const jobId = formData.get("job_id") as string;
  if (!jobId) return NextResponse.json(apiError("job_id נדרש"), { status: 400 });

  // Verify job is active
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: job } = await (supabase as any)
    .from("jobs")
    .select("id, organization_id, title")
    .eq("id", jobId)
    .eq("status", "active")
    .single() as { data: { id: string; organization_id: string; title: string } | null };

  if (!job) return NextResponse.json(apiError("משרה לא קיימת או לא פעילה"), { status: 404 });

  // Handle CV upload
  let cvUrl: string | null = null;
  const cvFile = formData.get("cv_file") as File | null;

  if (cvFile && cvFile.size > 0) {
    const allowedTypes = ["application/pdf", "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!allowedTypes.includes(cvFile.type)) {
      return NextResponse.json(apiError("סוג קובץ לא נתמך. נא להעלות PDF או Word"), { status: 400 });
    }
    if (cvFile.size > 10 * 1024 * 1024) {
      return NextResponse.json(apiError("הקובץ גדול מדי. מקסימום 10MB"), { status: 400 });
    }

    const ext      = cvFile.name.split(".").pop() ?? "pdf";
    const fileName = `${jobId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const buffer   = Buffer.from(await cvFile.arrayBuffer());

    const { error: uploadError } = await adminClient.storage
      .from("cv-uploads")
      .upload(fileName, buffer, { contentType: cvFile.type, upsert: false });

    if (uploadError) {
      return NextResponse.json(apiError("שגיאה בהעלאת הקובץ"), { status: 500 });
    }

    const { data: urlData } = adminClient.storage.from("cv-uploads").getPublicUrl(fileName);
    cvUrl = urlData.publicUrl;
  }

  // Insert candidate — RLS allows anon inserts via policy
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: candidate, error: insertError } = await (supabase as any)
    .from("candidates")
    .insert({
      organization_id:   job.organization_id,
      job_id:            jobId,
      full_name:         parsed.data.full_name,
      email:             parsed.data.email,
      phone:             parsed.data.phone,
      linkedin_url:      parsed.data.linkedin_url || null,
      portfolio_url:     parsed.data.portfolio_url || null,
      cover_letter:      parsed.data.cover_letter || null,
      cv_url:            cvUrl,
      whatsapp_consent:  parsed.data.whatsapp_consent,
      screening_answers: parsed.data.screening_answers ?? {},
      status:            "new",
      source:            "direct_link",
    })
    .select("id, full_name, email, phone, whatsapp_consent")
    .single();

  if (insertError) {
    if (insertError.code === "23505") {
      return NextResponse.json(apiError("כבר הגשת מועמדות למשרה זו"), { status: 409 });
    }
    return NextResponse.json(apiError("שגיאה בשמירת הפרטים"), { status: 500 });
  }

  return NextResponse.json(
    apiSuccess({
      candidate_id:      candidate.id,
      whatsapp_consent:  candidate.whatsapp_consent,
      message:           "המועמדות נשלחה בהצלחה",
    }),
    { status: 201 }
  );
}
