// ==================================================
// AI settings — DB override over env defaults
// ==================================================
// Resolution order for which model runs a role:
//   1. ai_settings row for the organization (set from the Settings screen)
//   2. AI_INTERVIEW_* / AI_SCORING_* env vars
//   3. AI_DEFAULT_PROVIDER, then the router's own default
//
// The DB read is cached for 60s per org: an interview turn must not pay a
// settings query on every message, but a switch in the UI should take
// effect within a minute without a redeploy.

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { AIProvider, AIRequestOptions } from "@/types";
import { aiRoleOptions } from "./providers";

export interface AiSettingsRow {
  default_provider:   string | null;
  interview_provider: string | null;
  interview_model:    string | null;
  scoring_provider:   string | null;
  scoring_model:      string | null;
}

const CACHE_TTL_MS = 60_000;
const cache = new Map<string, { at: number; row: AiSettingsRow | null }>();

async function loadSettings(organizationId: string): Promise<AiSettingsRow | null> {
  const hit = cache.get(organizationId);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.row;

  try {
    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!.trim(),
      process.env.SUPABASE_SERVICE_ROLE_KEY!.trim(),
      { auth: { persistSession: false } }
    );
    const { data } = await supabase
      .from("ai_settings")
      .select("default_provider, interview_provider, interview_model, scoring_provider, scoring_model")
      .eq("organization_id", organizationId)
      .maybeSingle();

    cache.set(organizationId, { at: Date.now(), row: (data as AiSettingsRow | null) ?? null });
    return (data as AiSettingsRow | null) ?? null;
  } catch (e) {
    // A settings lookup failure must never block an interview — fall back
    // to env and let the conversation continue.
    console.error("[ai-settings] load failed:", e);
    return null;
  }
}

/** Force the next read to hit the DB — called right after a save. */
export function invalidateAiSettings(organizationId: string): void {
  cache.delete(organizationId);
}

/**
 * DB-aware version of aiRoleOptions. Falls back to the env resolution the
 * moment anything is missing, so behavior without a settings row is
 * identical to before this feature existed.
 */
export async function aiRoleOptionsFor(
  role: "interview" | "scoring",
  organizationId: string,
): Promise<Pick<AIRequestOptions, "provider" | "model">> {
  const row = await loadSettings(organizationId);
  const envOpts = aiRoleOptions(role);

  const provider = (row?.[`${role}_provider`] ?? row?.default_provider)?.trim() as AIProvider | undefined;
  const model    = row?.[`${role}_model`]?.trim();

  return {
    ...(provider ? { provider } : envOpts.provider ? { provider: envOpts.provider } : {}),
    ...(model ? { model } : envOpts.model ? { model: envOpts.model } : {}),
  };
}
