// ==================================================
// AI Provider — Abstraction Router
// ==================================================
// Single entry point for all AI calls in the platform.
// Selects the provider from AIRequestOptions or AI_DEFAULT_PROVIDER.
// Adding a provider: implement callXxx and add a case here.
// ==================================================

import type { AIMessage, AIProvider, AIRequestOptions, AIResponse } from "@/types";
import { callAnthropic } from "./anthropic";
import { callOpenAI } from "./openai";
import { callGemini } from "./gemini";
import { callOllama } from "./ollama";
import { callOpenRouter } from "./openrouter";

/** Which env var must be set for each provider to work. */
const REQUIRED_KEY: Partial<Record<AIProvider, string>> = {
  anthropic:  "ANTHROPIC_API_KEY",
  openai:     "OPENAI_API_KEY",
  gemini:     "GEMINI_API_KEY",
  openrouter: "OPENROUTER_API_KEY",
  // ollama needs no key — it talks to a local server.
};

/**
 * Providers that are actually usable right now.
 *
 * A placeholder value counts as missing. The repo shipped with
 * ANTHROPIC_API_KEY set to an 18-character placeholder, which produced a
 * 401 at request time instead of a clear "not configured" — exactly the
 * failure this check exists to prevent.
 */
export function configuredProviders(): AIProvider[] {
  const out: AIProvider[] = ["ollama"];   // always available if the server runs

  for (const [provider, envVar] of Object.entries(REQUIRED_KEY) as [AIProvider, string][]) {
    const v = process.env[envVar]?.trim();
    if (v && v.length > 20 && !/placeholder|your[-_]?key|changeme|xxx/i.test(v)) {
      out.push(provider);
    }
  }
  return out;
}

/** Errors worth trying another provider for. */
function isTransient(e: unknown): boolean {
  const msg = (e as Error)?.message ?? "";
  // 429 is the one that matters in practice: Gemini's free tier allows only
  // a handful of requests per minute, and a single interview needs more than
  // that. 5xx and timeouts are worth a second provider too; a 401 or a bad
  // request is not — retrying those just burns the fallback.
  return /\b(429|500|502|503|504)\b|quota|rate.?limit|timed out|ECONNRESET/i.test(msg);
}

/**
 * Ordered fallbacks. Ollama sits last on purpose: it is free and always
 * available locally, but ~40s per reply on CPU, so it should only carry a
 * conversation when the faster options are exhausted.
 */
function fallbackChain(primary: AIProvider): AIProvider[] {
  const configured = configuredProviders();
  // OpenRouter first among the fallbacks: one key covers many models, so it
  // is the most likely to actually answer when the primary hits a quota.
  const preference: AIProvider[] = ["openrouter", "gemini", "anthropic", "openai", "ollama"];
  return preference.filter(p => p !== primary && configured.includes(p));
}

/**
 * Per-role model selection, so the interviewer and the scorer can run on
 * different models without touching code:
 *
 *   AI_INTERVIEW_PROVIDER / AI_INTERVIEW_MODEL
 *   AI_SCORING_PROVIDER   / AI_SCORING_MODEL
 *
 * Unset values fall back to AI_DEFAULT_PROVIDER and the provider's own
 * default model, which keeps a fresh .env working with zero configuration.
 */
export function aiRoleOptions(role: "interview" | "scoring"): Pick<AIRequestOptions, "provider" | "model"> {
  const prefix = role === "interview" ? "AI_INTERVIEW" : "AI_SCORING";
  const provider = process.env[`${prefix}_PROVIDER`]?.trim() as AIProvider | undefined;
  const model    = process.env[`${prefix}_MODEL`]?.trim();
  return {
    ...(provider ? { provider } : {}),
    ...(model ? { model } : {}),
  };
}

export async function callAI(
  messages: AIMessage[],
  options: AIRequestOptions = {}
): Promise<AIResponse> {
  const primary: AIProvider =
    options.provider ??
    (process.env.AI_DEFAULT_PROVIDER?.trim() as AIProvider) ??
    "gemini";

  try {
    return await callProvider(primary, messages, options);
  } catch (e) {
    if (!isTransient(e)) throw e;

    // An interview in progress is worth more than provider purity: a
    // candidate mid-conversation should not be dropped because a free-tier
    // quota ran out.
    for (const next of fallbackChain(primary)) {
      try {
        console.warn(`[ai] ${primary} failed (${(e as Error).message.slice(0, 80)}); falling back to ${next}`);
        return await callProvider(next, messages, options);
      } catch (inner) {
        if (!isTransient(inner)) throw inner;
      }
    }
    throw e;
  }
}

async function callProvider(
  provider: AIProvider,
  messages: AIMessage[],
  options: AIRequestOptions
): Promise<AIResponse> {
  switch (provider) {
    case "anthropic":
      return callAnthropic(messages, options);

    case "openai":
      return callOpenAI(messages, options);

    case "gemini":
      return callGemini(messages, options);

    case "ollama":
      return callOllama(messages, options);

    case "openrouter":
      return callOpenRouter(messages, options);

    default:
      throw new Error(`Unknown AI provider: ${provider}`);
  }
}

export type { AIProvider, AIMessage, AIRequestOptions, AIResponse };
export { listOllamaModels } from "./ollama";
