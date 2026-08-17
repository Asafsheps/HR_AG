// ==================================================
// AI Provider — OpenRouter
// ==================================================
// One key, every model. OpenAI-compatible API, so the request shape is the
// same as openai.ts — only the base URL, headers and model naming differ.
// Model IDs are namespaced: "anthropic/claude-sonnet-4.5",
// "google/gemini-2.5-flash", "openai/gpt-4o-mini" and so on.

import type { AIMessage, AIRequestOptions, AIResponse } from "@/types";

const DEFAULT_MAX_TOKENS = 1024;

export async function callOpenRouter(
  messages: AIMessage[],
  options: AIRequestOptions = {}
): Promise<AIResponse> {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  if (!apiKey) throw new Error("OPENROUTER_API_KEY is not set");

  const model =
    options.model ??
    process.env.OPENROUTER_DEFAULT_MODEL?.trim() ??
    "google/gemini-2.5-flash";

  const builtMessages: { role: string; content: string }[] = [];
  if (options.systemPrompt) {
    builtMessages.push({ role: "system", content: options.systemPrompt });
  }
  messages
    .filter((m) => m.role !== "system")
    .forEach((m) => builtMessages.push({ role: m.role, content: m.content }));

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      max_tokens: options.maxTokens ?? DEFAULT_MAX_TOKENS,
      temperature: options.temperature,
      messages: builtMessages,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} — ${err.slice(0, 300)}`);
  }

  const data = await response.json();
  const content: string = data.choices?.[0]?.message?.content ?? "";

  return {
    content,
    provider: "openrouter",
    model: data.model ?? model,
    usage: {
      input_tokens: data.usage?.prompt_tokens ?? 0,
      output_tokens: data.usage?.completion_tokens ?? 0,
    },
  };
}
