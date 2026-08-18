// ==================================================
// API — /api/settings/ai
// ==================================================
// GET — which providers hold a real key, and the effective model per role
//       (settings-row override, else env defaults).
// PUT — save org overrides; admin-only via RLS. Takes effect within the
//       resolver's 60s cache window, no redeploy.
//
// API keys themselves are NOT managed here — they live in env on purpose.
// This screen chooses among providers that already have keys; it never
// displays or transports the keys themselves.

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { apiSuccess, apiError } from "@/lib/utils";
import { configuredProviders, aiRoleOptions } from "@/lib/ai/providers";
import { invalidateAiSettings } from "@/lib/ai/settings";

const PROVIDERS = ["openrouter", "gemini", "anthropic", "openai", "ollama"] as const;

async function orgIdOf(supabase: Awaited<ReturnType<typeof getSupabaseServerClient>>, userId: string) {
  const { data } = await supabase
    .from("recruiter_profiles")
    .select("organization_id")
    .eq("id", userId)
    .single();
  return data?.organization_id ?? null;
}

export async function GET() {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json(apiError("Unauthorized"), { status: 401 });

  const orgId = await orgIdOf(supabase, user.id);
  if (!orgId) return NextResponse.json(apiError("פרופיל לא נמצא"), { status: 403 });

  const { data: row } = await supabase
    .from("ai_settings")
    .select("default_provider, interview_provider, interview_model, scoring_provider, scoring_model, updated_at")
    .eq("organization_id", orgId)
    .maybeSingle();

  const envInterview = aiRoleOptions("interview");
  const envScoring   = aiRoleOptions("scoring");
  const envDefault   = process.env.AI_DEFAULT_PROVIDER?.trim() ?? "openrouter";

  return NextResponse.json(apiSuccess({
    configured: configuredProviders(),
    overrides:  row ?? null,
    effective: {
      interview: {
        provider: row?.interview_provider ?? row?.default_provider ?? envInterview.provider ?? envDefault,
        model:    row?.interview_model    ?? envInterview.model    ?? null,
        source:   row?.interview_provider || row?.interview_model ? "settings" : "env",
      },
      scoring: {
        provider: row?.scoring_provider ?? row?.default_provider ?? envScoring.provider ?? envDefault,
        model:    row?.scoring_model    ?? envScoring.model    ?? null,
        source:   row?.scoring_provider || row?.scoring_model ? "settings" : "env",
      },
    },
  }));
}

export async function PUT(req: NextRequest) {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json(apiError("Unauthorized"), { status: 401 });

  const orgId = await orgIdOf(supabase, user.id);
  if (!orgId) return NextResponse.json(apiError("פרופיל לא נמצא"), { status: 403 });

  const body = await req.json().catch(() => null) as Partial<Record<
    "default_provider" | "interview_provider" | "interview_model" | "scoring_provider" | "scoring_model",
    string | null
  >> | null;
  if (!body) return NextResponse.json(apiError("בקשה לא תקינה"), { status: 400 });

  // Providers narrowed against the known list; model ids are free text
  // (OpenRouter has hundreds) but bounded and trimmed.
  function cleanProvider(v: unknown): string | null {
    const t = typeof v === "string" ? v.trim().toLowerCase() : "";
    return (PROVIDERS as readonly string[]).includes(t) ? t : null;
  }
  function cleanModel(v: unknown): string | null {
    const t = typeof v === "string" ? v.trim() : "";
    return t && t.length <= 120 ? t : null;
  }

  const { error } = await supabase
    .from("ai_settings")
    .upsert({
      organization_id:    orgId,
      default_provider:   cleanProvider(body.default_provider),
      interview_provider: cleanProvider(body.interview_provider),
      interview_model:    cleanModel(body.interview_model),
      scoring_provider:   cleanProvider(body.scoring_provider),
      scoring_model:      cleanModel(body.scoring_model),
      updated_at:         new Date().toISOString(),
    } as never, { onConflict: "organization_id" });

  // RLS silently matches zero rows for non-admins on update paths; surface
  // a clear message instead of pretending the save happened.
  if (error) {
    console.error("[ai-settings] save failed:", error.message);
    return NextResponse.json(apiError("השמירה נכשלה — נדרשות הרשאות אדמין"), { status: 403 });
  }

  invalidateAiSettings(orgId);
  return NextResponse.json(apiSuccess({ saved: true }));
}
