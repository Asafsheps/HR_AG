import { z } from "zod";

// Mirrors agent_profiles in supabase/migrations/..._agent_profiles_and_campaigns.sql

export const agentStageSchema = z.object({
  id:      z.string(),
  label:   z.string().min(1),
  enabled: z.boolean().default(true),
});

export const scoringCriterionSchema = z.object({
  id:          z.string(),
  label:       z.string().min(2),
  weight:      z.number().min(1).max(100),
  description: z.string().optional(),
});

export const agentProfileSchema = z.object({
  // Present when updating, absent when creating.
  id:    z.string().uuid().optional(),
  // Optional link: attach this profile to a specific job.
  jobId: z.string().uuid().optional(),

  name:         z.string().min(2, "שם פרופיל קצר מדי"),
  persona_name: z.string().min(1, "לסוכן חייב להיות שם").default("עמי"),
  objective:    z.string().default(""),
  tone:         z.enum(["friendly", "professional", "strict", "concise"]).default("friendly"),
  guidelines:   z.string().default(""),
  language:     z.string().default("he"),

  max_questions:  z.number().int().min(1).max(30).default(8),
  escalate_after: z.number().int().positive().nullable().default(null),
  never_discuss:  z.array(z.string()).default([]),

  stages:           z.array(agentStageSchema).default([]),
  scoring_criteria: z.array(scoringCriterionSchema).default([]),

  auto_score:          z.boolean().default(true),
  // Null means the rule is off. A default number here would silently
  // reject or escalate people nobody decided to reject or escalate.
  auto_escalate_score: z.number().int().min(0).max(100).nullable().default(null),
  reject_score:        z.number().int().min(0).max(100).nullable().default(null),

  is_default: z.boolean().default(false),
})
  // Matches the CHECK constraint on the table. Caught here too so the user
  // gets a readable message instead of a Postgres constraint violation.
  .refine(
    v => v.auto_escalate_score === null || v.reject_score === null
      || v.reject_score < v.auto_escalate_score,
    { message: "סף הדחייה חייב להיות נמוך מסף ההסלמה", path: ["reject_score"] }
  );

/**
 * The subset of agent settings the job wizard sends inline with a new job.
 * Kept separate from agentProfileSchema, which covers the full profile
 * editor including stages and scoring criteria.
 */
export const agentGuidanceSchema = z.object({
  persona_name:  z.string().min(1).default("עמי"),
  tone:          z.enum(["friendly", "professional", "strict", "concise"]).default("friendly"),
  objective:     z.string().default(""),
  guidelines:    z.string().default(""),
  max_questions: z.number().int().min(1).max(30).default(8),
});

export type AgentGuidanceInput   = z.infer<typeof agentGuidanceSchema>;
export type AgentProfileInput    = z.infer<typeof agentProfileSchema>;
export type AgentStageInput      = z.infer<typeof agentStageSchema>;
export type ScoringCriterionInput = z.infer<typeof scoringCriterionSchema>;
