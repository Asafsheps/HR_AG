// ==================================================
// AI Provider — Abstraction Router
// ==================================================
// Single entry point for all AI calls in the platform.
// Selects provider based on AIRequestOptions or the AI_DEFAULT_PROVIDER env var.
// Adding a new provider: implement the callXxx function and add a case here.
// ==================================================

import type { AIMessage, AIProvider, AIRequestOptions, AIResponse } from "@/types";
import { callAnthropic } from "./anthropic";
import { callOpenAI } from "./openai";

export async function callAI(
  messages: AIMessage[],
  options: AIRequestOptions = {}
): Promise<AIResponse> {
  const provider: AIProvider =
    options.provider ??
    (process.env.AI_DEFAULT_PROVIDER as AIProvider) ??
    "anthropic";

  switch (provider) {
    case "anthropic":
      return callAnthropic(messages, options);

    case "openai":
      return callOpenAI(messages, options);

    case "openrouter":
      // OpenRouter uses the OpenAI-compatible API — route through OpenAI provider
      // with the OpenRouter base URL (implemented in Phase 7+)
      throw new Error("OpenRouter provider not yet implemented");

    default:
      throw new Error(`Unknown AI provider: ${provider}`);
  }
}

export type { AIProvider, AIMessage, AIRequestOptions, AIResponse };
