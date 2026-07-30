// ==================================================
// AI Provider — Anthropic (Claude)
// ==================================================
// Wraps the @anthropic-ai/sdk into the platform's AIProvider interface.
// Default provider. Uses claude-sonnet-4-6 by default.
// ==================================================

import Anthropic from "@anthropic-ai/sdk";
import type { AIMessage, AIRequestOptions, AIResponse } from "@/types";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const DEFAULT_MODEL = process.env.ANTHROPIC_DEFAULT_MODEL ?? "claude-sonnet-4-6";
const DEFAULT_MAX_TOKENS = 1024;

export async function callAnthropic(
  messages: AIMessage[],
  options: AIRequestOptions = {}
): Promise<AIResponse> {
  const model = options.model ?? DEFAULT_MODEL;
  const maxTokens = options.maxTokens ?? DEFAULT_MAX_TOKENS;

  // Separate system prompt from conversation messages
  const systemContent = options.systemPrompt;
  const conversationMessages = messages.filter((m) => m.role !== "system");

  const response = await client.messages.create({
    model,
    max_tokens: maxTokens,
    ...(systemContent ? { system: systemContent } : {}),
    messages: conversationMessages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
  });

  const textBlock = response.content.find((b) => b.type === "text");
  const content = textBlock?.type === "text" ? textBlock.text : "";

  return {
    content,
    provider: "anthropic",
    model,
    usage: {
      input_tokens: response.usage.input_tokens,
      output_tokens: response.usage.output_tokens,
    },
  };
}
