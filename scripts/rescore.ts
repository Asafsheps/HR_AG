// ==================================================
// Rescore finished interviews that have no score
// ==================================================
// Scoring runs automatically when an interview ends, but it can fail —
// provider outage, truncated JSON — while the interview itself is fine.
// This script picks those up: every finished conversation whose candidate
// has no candidate_scores row gets scored again from its stored transcript.
//
//   npm run rescore
//
// Safe to run repeatedly: already-scored candidates are skipped.

import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/types/database";
import { scoreInterview } from "../src/lib/interview/scorer";
import type { InterviewTurn } from "../src/lib/interview/session";
import type { JobConfig } from "../src/lib/interview/prompt";

async function main() {
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!.trim(),
    process.env.SUPABASE_SERVICE_ROLE_KEY!.trim(),
    { auth: { persistSession: false } }
  );

  const { data: contexts, error } = await supabase
    .from("conversation_contexts")
    .select(`
      id, candidate_id, organization_id, job_id, transcript,
      candidates ( full_name ),
      jobs ( title, description, requirements, screening_questions, ai_instructions )
    `)
    .not("ended_at", "is", null)
    .not("candidate_id", "is", null);

  if (error) throw new Error(error.message);

  let scored = 0, skipped = 0, failed = 0;

  for (const ctx of contexts ?? []) {
    const { data: existing } = await supabase
      .from("candidate_scores")
      .select("id")
      .eq("candidate_id", ctx.candidate_id!)
      .maybeSingle();

    if (existing) { skipped++; continue; }

    const job = ctx.jobs as unknown as {
      title: string; description: string; requirements: string[];
      screening_questions: { question: string; weight?: number }[] | null;
      ai_instructions: string | null;
    } | null;
    const candidate = ctx.candidates as unknown as { full_name: string } | null;
    if (!job || !ctx.job_id) { skipped++; continue; }

    const name = candidate?.full_name ?? "";
    console.log(`scoring: ${name} (${ctx.candidate_id})`);

    const result = await scoreInterview({
      candidateId:    ctx.candidate_id!,
      organizationId: ctx.organization_id,
      jobId:          ctx.job_id,
      candidateName:  name,
      job: {
        title:               job.title,
        description:         job.description,
        requirements:        job.requirements ?? [],
        screening_questions: job.screening_questions ?? [],
        ai_instructions:     job.ai_instructions,
      } satisfies JobConfig,
      turns: (ctx.transcript as unknown as InterviewTurn[]) ?? [],
    });

    if (result) {
      scored++;
      console.log(`  → overall ${result.overall}, evidence ${result.evidence_quality}`);
    } else {
      failed++;
      console.log("  → scoring failed (see errors above)");
    }
  }

  console.log(`\ndone: ${scored} scored, ${skipped} skipped, ${failed} failed`);
}

main().catch(e => { console.error(e); process.exit(1); });
