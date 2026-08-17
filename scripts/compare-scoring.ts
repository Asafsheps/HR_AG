// ==================================================
// Scoring quality comparison
// ==================================================
// Scores the most recent finished interview with each model given on the
// command line and prints the results side by side against whatever is
// already stored. Nothing is persisted — this is a read-only quality check
// for choosing AI_SCORING_MODEL.
//
//   npm run compare-scoring -- google/gemini-3.6-flash anthropic/claude-haiku-4.5

import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/types/database";
import { callAI } from "../src/lib/ai/providers";
import { buildScoringPrompt, renderTranscript } from "../src/lib/interview/scorer";
import type { InterviewTurn } from "../src/lib/interview/session";

const DIMS = ["tools_match", "domain_match", "seniority_match", "communication", "confidence", "motivation"] as const;

async function main() {
  const models = process.argv.slice(2);
  if (!models.length) {
    console.error("usage: npm run compare-scoring -- <model> [model...]");
    process.exit(1);
  }

  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!.trim(),
    process.env.SUPABASE_SERVICE_ROLE_KEY!.trim(),
    { auth: { persistSession: false } }
  );

  const { data: ctx } = await supabase
    .from("conversation_contexts")
    .select(`
      candidate_id, transcript,
      candidates ( full_name ),
      jobs ( title, description, requirements, screening_questions, ai_instructions )
    `)
    .not("ended_at", "is", null)
    .order("ended_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!ctx?.jobs) { console.error("no finished interview found"); process.exit(1); }

  const job = ctx.jobs as unknown as {
    title: string; description: string; requirements: string[];
    screening_questions: { question: string; weight?: number }[] | null;
    ai_instructions: string | null;
  };
  const name = (ctx.candidates as unknown as { full_name: string } | null)?.full_name ?? "";
  const turns = (ctx.transcript as unknown as InterviewTurn[]) ?? [];

  const systemPrompt = buildScoringPrompt({
    title: job.title, description: job.description,
    requirements: job.requirements ?? [],
    screening_questions: job.screening_questions ?? [],
    ai_instructions: job.ai_instructions,
  });
  const userMessage = renderTranscript(turns, name);

  // The stored score is the baseline column.
  const { data: stored } = await supabase
    .from("candidate_scores")
    .select("*")
    .eq("candidate_id", ctx.candidate_id!)
    .maybeSingle();

  const results: Record<string, Record<string, number | string | null>> = {};
  if (stored) {
    results[`stored (${stored.model})`] = Object.fromEntries([
      ["overall", stored.overall],
      ...DIMS.map(d => [d, stored[d]]),
      ["evidence", stored.evidence_quality],
    ]);
  }

  for (const model of models) {
    process.stderr.write(`scoring with ${model}...\n`);
    const t0 = Date.now();
    try {
      const res = await callAI(
        [{ role: "user", content: userMessage }],
        { provider: "openrouter", model, systemPrompt, maxTokens: 8000, temperature: 0.2 }
      );
      const c = res.content.trim();
      const parsed = JSON.parse(c.slice(c.indexOf("{"), c.lastIndexOf("}") + 1));
      results[model] = Object.fromEntries([
        ["overall", parsed.overall],
        ...DIMS.map(d => [d, parsed.dimensions?.[d]?.score ?? null]),
        ["evidence", parsed.evidence_quality],
        ["sec", Math.round((Date.now() - t0) / 1000)],
        ["out_tokens", res.usage?.output_tokens ?? null],
      ]);
      console.log(`\n=== ${model} — summary ===\n${parsed.summary}\n`);
    } catch (e) {
      results[model] = { error: (e as Error).message.slice(0, 100) };
    }
  }

  console.table(results);
}

main().catch(e => { console.error(e); process.exit(1); });
