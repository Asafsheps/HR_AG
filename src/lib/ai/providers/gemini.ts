// ==================================================
// AI Provider — Google Gemini
// ==================================================
// Uses the REST API directly rather than @google/genai: one fetch call,
// no extra dependency, and no SDK version churn to track. The response
// shape used here is small and stable.
//
// Gemini has a free tier, which is why it is the default for development.
// Get a key at https://aistudio.google.com/apikey
// ==================================================

import type { AIMessage, AIRequestOptions, AIResponse } from "@/types";

// gemini-2.5-flash is closed to new API keys; Google's own 404 points at
// 3.6-flash as the replacement.
const DEFAULT_MODEL = process.env.GEMINI_DEFAULT_MODEL ?? "gemini-3.6-flash";
// Generous because Gemini 3.x counts internal reasoning against
// maxOutputTokens. At 700 the interviewer's replies came back cut off
// mid-sentence, which reads to a candidate as a broken product.
const DEFAULT_MAX_TOKENS = 2048;
const API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

interface GeminiResponse {
  candidates?: {
    content?: { parts?: { text?: string }[] };
    finishReason?: string;
  }[];
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
  };
  error?: { message?: string; status?: string };
}

export async function callGemini(
  messages: AIMessage[],
  options: AIRequestOptions = {}
): Promise<AIResponse> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }

  const model     = options.model ?? DEFAULT_MODEL;
  const maxTokens = options.maxTokens ?? DEFAULT_MAX_TOKENS;

  // Gemini calls the assistant role "model", and takes the system prompt as
  // a separate systemInstruction rather than a message.
  const contents = messages
    .filter(m => m.role !== "system")
    .map(m => ({
      role:  m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

  const res = await fetch(`${API_BASE}/${model}:generateContent`, {
    method: "POST",
    headers: {
      "Content-Type":   "application/json",
      // Header rather than a query parameter: a key in the URL ends up in
      // proxy logs and error reports.
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      contents,
      ...(options.systemPrompt
        ? { systemInstruction: { parts: [{ text: options.systemPrompt }] } }
        : {}),
      generationConfig: {
        maxOutputTokens: maxTokens,
        ...(options.temperature !== undefined ? { temperature: options.temperature } : {}),
      },
    }),
  });

  const data = await res.json() as GeminiResponse;

  if (!res.ok) {
    throw new Error(`Gemini ${res.status}: ${data.error?.message ?? "unknown error"}`);
  }

  const candidate = data.candidates?.[0];
  const content = candidate?.content?.parts?.map(p => p.text ?? "").join("").trim() ?? "";

  // An empty reply with a finishReason is a filter or token cap, not a
  // network problem. Saying which makes it debuggable instead of mysterious.
  if (!content) {
    throw new Error(`Gemini returned no text (finishReason: ${candidate?.finishReason ?? "none"})`);
  }

  return {
    content,
    provider: "gemini",
    model,
    usage: {
      input_tokens:  data.usageMetadata?.promptTokenCount ?? 0,
      output_tokens: data.usageMetadata?.candidatesTokenCount ?? 0,
    },
  };
}
