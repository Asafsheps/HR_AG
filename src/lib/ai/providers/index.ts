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

/** Which env var must be set for each provider to work. */
const REQUIRED_KEY: Partial<Record<AIProvider, string>> = {
  anthropic: "ANTHROPIC_API_KEY",
  openai:    "OPENAI_API_KEY",
  gemini:    "GEMINI_API_KEY",
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

export async function callAI(
  messages: AIMessage[],
  options: AIRequestOptions = {}
): Promise<AIResponse> {
  const provider: AIProvider =
    options.provider ??
    (process.env.AI_DEFAULT_PROVIDER?.trim() as AIProvider) ??
    "gemini";

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
      // OpenAI-compatible; route through the OpenAI provider with a
      // different base URL when it is needed.
      throw new Error("OpenRouter provider not yet implemented");

    default:
      throw new Error(`Unknown AI provider: ${provider}`);
  }
}

export type { AIProvider, AIMessage, AIRequestOptions, AIResponse };
export { listOllamaModels } from "./ollama";
