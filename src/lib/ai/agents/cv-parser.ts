// ==================================================
// CV Parser Agent
// ==================================================
// Downloads a candidate's CV from Supabase Storage and
// extracts structured data via Claude's native PDF support.
//
// For PDF files:  sent as base64 document to Claude API
// For DOC/DOCX:   fetched as text (best-effort)
// Returns: CVParsedData (skills, years, education, etc.)
// ==================================================

import Anthropic from "@anthropic-ai/sdk";
import { fillPrompt } from "@/lib/ai/prompts/v1";

export type CVParsedData = {
  skills:          string[];
  experience_years: number;
  education:       string[];
  previous_roles:  string[];
  languages:       string[];
  raw_summary?:    string;
};

const DEFAULT_PARSED: CVParsedData = {
  skills:           [],
  experience_years: 0,
  education:        [],
  previous_roles:   [],
  languages:        [],
};

// ── Main entry point ──────────────────────────────────────────────────────────
export async function parseCV(cvUrl: string): Promise<CVParsedData> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not configured");

  // Download CV file
  const response = await fetch(cvUrl);
  if (!response.ok) throw new Error(`Failed to download CV: ${response.status}`);

  const contentType = response.headers.get("content-type") ?? "";
  const isPdf       = contentType.includes("pdf") || cvUrl.toLowerCase().endsWith(".pdf");

  let result: CVParsedData;

  if (isPdf) {
    result = await parsePdfWithClaude(apiKey, response);
  } else {
    result = await parseTextWithClaude(apiKey, response, cvUrl);
  }

  return result;
}

// ── PDF path — use Claude's native document support ───────────────────────────
async function parsePdfWithClaude(
  apiKey:   string,
  response: Response
): Promise<CVParsedData> {
  const buffer     = await response.arrayBuffer();
  const base64Data = Buffer.from(buffer).toString("base64");

  const client = new Anthropic({ apiKey });

  const message = await client.messages.create({
    model:      process.env.ANTHROPIC_DEFAULT_MODEL ?? "claude-sonnet-4-6",
    max_tokens: 1024,
    messages: [
      {
        role:    "user",
        content: [
          {
            type:   "document",
            source: {
              type:       "base64",
              media_type: "application/pdf",
              data:       base64Data,
            },
          } as Anthropic.DocumentBlockParam,
          {
            type: "text",
            text: fillPrompt("CV_PARSER", { cv_text: "(see attached PDF)" }),
          },
        ],
      },
    ],
  });

  return extractJson(message.content[0]?.type === "text" ? message.content[0].text : "{}");
}

// ── Text/DOC path — extract text and pass to Claude ──────────────────────────
async function parseTextWithClaude(
  apiKey:   string,
  response: Response,
  cvUrl:    string
): Promise<CVParsedData> {
  let cvText: string;

  try {
    cvText = await response.text();
    // Strip binary garbage from DOC files — keep printable ASCII / Hebrew
    cvText = cvText.replace(/[^\x20-\x7Eא-ת\n\r\t]/g, " ").replace(/\s{3,}/g, " ").slice(0, 8000);
  } catch {
    return { ...DEFAULT_PARSED, raw_summary: `CV available at: ${cvUrl}` };
  }

  const client = new Anthropic({ apiKey });
  const prompt = fillPrompt("CV_PARSER", { cv_text: cvText });

  const message = await client.messages.create({
    model:      process.env.ANTHROPIC_DEFAULT_MODEL ?? "claude-sonnet-4-6",
    max_tokens: 1024,
    messages:   [{ role: "user", content: prompt }],
  });

  return extractJson(message.content[0]?.type === "text" ? message.content[0].text : "{}");
}

// ── Parse JSON from AI response ───────────────────────────────────────────────
function extractJson(raw: string): CVParsedData {
  try {
    const cleaned = raw.trim().replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    const parsed  = JSON.parse(cleaned);
    return {
      skills:           Array.isArray(parsed.skills)         ? parsed.skills         : [],
      experience_years: typeof parsed.experience_years === "number" ? parsed.experience_years : 0,
      education:        Array.isArray(parsed.education)       ? parsed.education       : [],
      previous_roles:   Array.isArray(parsed.previous_roles)  ? parsed.previous_roles  : [],
      languages:        Array.isArray(parsed.languages)        ? parsed.languages        : [],
    };
  } catch {
    return DEFAULT_PARSED;
  }
}
