// ==================================================
// AI Provider — OpenAI (GPT)
// ==================================================
// Optional fallback provider. Activate by setting AI_DEFAULT_PROVIDER=openai.
// Requires OPENAI_API_KEY in environment.
// ==================================================

import type { AIMessage, AIRequestOptions, AIResponse } from "@/types";

const DEFAULT_MODEL = process.env.OPENAI_DEFAULT_MODEL ?? "gpt-4o";
const DEFAULT_MAX_TOKENS = 1024;

export async function callOpenAI(
  messages: AIMessage[],
  options: AIRequestOptions = {}
): Promise<AIResponse> {
  const model = options.model ?? DEFAULT_MODEL;
  const maxTokens = options.maxTokens ?? DEFAULT_MAX_TOKENS;
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set");
  }

  // Build message array with optional system prompt
  const builtMessages: { role: string; content: string }[] = [];

  if (options.systemPrompt) {
    builtMessages.push({ role: "system", content: options.systemPrompt });
  }

  messages
    .filter((m) => m.role !== "system")
    .forEach((m) => builtMessages.push({ role: m.role, content: m.content }));

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      messages: builtMessages,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI API error: ${response.status} — ${err}`);
  }

  const data = await response.json();
  const content: string = data.choices?.[0]?.message?.content ?? "";

  return {
    content,
    provider: "openai",
    model,
    usage: {
      input_tokens: data.usage?.prompt_tokens ?? 0,
      output_tokens: data.usage?.completion_tokens ?? 0,
    },
  };
}
