// ==================================================
// API Route — /api/ai/job-description
// POST — generate a job description via AI
// ==================================================

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { callAI } from "@/lib/ai/providers";
import { fillPrompt } from "@/lib/ai/prompts/v1";
import { apiSuccess, apiError } from "@/lib/utils";
import { z } from "zod";

const schema = z.object({
  title:        z.string().min(2),
  department:   z.string().optional(),
  requirements: z.string().optional(),
  seniority:    z.string().optional(),
});

export async function POST(request: NextRequest) {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json(apiError("Unauthorized"), { status: 401 });

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(apiError(parsed.error.errors[0].message), { status: 400 });
  }

  const prompt = fillPrompt("JOB_DESCRIPTION_GENERATOR", {
    title:        parsed.data.title,
    department:   parsed.data.department ?? "לא צוין",
    requirements: parsed.data.requirements ?? "לא צוינו",
    seniority:    parsed.data.seniority ?? "mid-level",
  });

  const response = await callAI(
    [{ role: "user", content: "Generate the job description now." }],
    { systemPrompt: prompt, maxTokens: 1500 }
  );

  // Log token usage
  const { data: profile } = await supabase
    .from("recruiter_profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (profile) {
    await supabase.from("ai_usage_logs").insert({
      organization_id: profile.organization_id,
      feature:         "jd_generator",
      prompt_version:  "v1",
      provider:        response.provider,
      model:           response.model,
      input_tokens:    response.usage.input_tokens,
      output_tokens:   response.usage.output_tokens,
    });
  }

  return NextResponse.json(apiSuccess({ description: response.content }));
}
