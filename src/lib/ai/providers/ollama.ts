// ==================================================
// AI Provider — Ollama (local, free)
// ==================================================
// Talks to a locally running `ollama serve`. Costs nothing, so it is the
// right provider for development, for trying agent wording in the
// simulator, and for bulk work where latency does not matter.
//
// Measured on this machine (AG, 02/08): qwen2.5-coder:7b answered a real
// prompt in 40.5s on CPU. That is fine for a background job and too slow
// for a candidate waiting between interview questions — which is why the
// provider is selectable per call rather than global.
// ==================================================

import type { AIMessage, AIRequestOptions, AIResponse } from "@/types";

const DEFAULT_HOST  = process.env.OLLAMA_HOST ?? "http://localhost:11434";
const DEFAULT_MODEL = process.env.OLLAMA_DEFAULT_MODEL ?? "qwen2.5-coder:7b";

// Local inference on CPU is slow. Without a generous ceiling the fetch
// aborts mid-generation and looks like a model failure.
const TIMEOUT_MS = Number(process.env.OLLAMA_TIMEOUT_MS ?? 180_000);

interface OllamaChatResponse {
  message?: { role: string; content: string };
  prompt_eval_count?: number;
  eval_count?: number;
  error?: string;
}

export async function callOllama(
  messages: AIMessage[],
  options: AIRequestOptions = {}
): Promise<AIResponse> {
  const model = options.model ?? DEFAULT_MODEL;
  const host  = DEFAULT_HOST.replace(/\/$/, "");

  // Ollama takes the system prompt as a message, unlike Anthropic and Gemini.
  const chatMessages = [
    ...(options.systemPrompt ? [{ role: "system", content: options.systemPrompt }] : []),
    ...messages.filter(m => m.role !== "system").map(m => ({ role: m.role, content: m.content })),
  ];

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(`${host}/api/chat`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      signal:  controller.signal,
      body: JSON.stringify({
        model,
        messages: chatMessages,
        stream: false,
        options: {
          ...(options.temperature !== undefined ? { temperature: options.temperature } : {}),
          ...(options.maxTokens   !== undefined ? { num_predict: options.maxTokens } : {}),
        },
      }),
    });
  } catch (e) {
    // The overwhelmingly common cause is that `ollama serve` is not running.
    // Say so, rather than surfacing a bare fetch failure.
    if ((e as Error).name === "AbortError") {
      throw new Error(`Ollama timed out after ${TIMEOUT_MS / 1000}s (model: ${model})`);
    }
    throw new Error(`Cannot reach Ollama at ${host}. Is 'ollama serve' running?`);
  } finally {
    clearTimeout(timer);
  }

  const data = await res.json() as OllamaChatResponse;

  if (!res.ok || data.error) {
    throw new Error(`Ollama ${res.status}: ${data.error ?? "unknown error"}`);
  }

  const content = data.message?.content?.trim() ?? "";
  if (!content) throw new Error("Ollama returned an empty response");

  return {
    content,
    provider: "ollama",
    model,
    usage: {
      input_tokens:  data.prompt_eval_count ?? 0,
      output_tokens: data.eval_count ?? 0,
    },
  };
}

/**
 * Which models are actually pulled locally.
 *
 * Used by the settings screen so it can offer what exists instead of
 * listing models the machine would have to download mid-interview.
 */
export async function listOllamaModels(): Promise<string[]> {
  const host = DEFAULT_HOST.replace(/\/$/, "");
  try {
    const res = await fetch(`${host}/api/tags`, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return [];
    const data = await res.json() as { models?: { name: string }[] };
    return data.models?.map(m => m.name) ?? [];
  } catch {
    return [];
  }
}
