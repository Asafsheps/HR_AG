import { z } from "zod";

export const screeningQuestionSchema = z.object({
  id:       z.string(),
  question: z.string().min(5, "שאלה קצרה מדי"),
  type:     z.enum(["open", "yes_no", "multiple_choice", "numeric"]),
  options:  z.array(z.string()).optional(),
  required: z.boolean().default(true),
  weight:   z.number().min(1).max(10).default(5),
});

export const rejectionRuleSchema = z.object({
  id:       z.string(),
  field:    z.string(),
  operator: z.enum(["equals", "not_equals", "contains", "less_than", "greater_than"]),
  value:    z.union([z.string(), z.number(), z.boolean()]),
  reason:   z.string().min(3),
});

export const createJobSchema = z.object({
  title:                   z.string().min(2, "שם תפקיד חייב להכיל לפחות 2 תווים"),
  description:             z.string().min(20, "תיאור קצר מדי"),
  requirements:            z.array(z.string().min(2)).min(1, "נא להוסיף לפחות דרישה אחת"),
  culture_fit_expectations: z.string().optional(),
  department:              z.string().optional(),
  location:                z.string().optional(),
  employment_type:         z.enum(["full_time", "part_time", "contract", "internship"]).optional(),
  salary_range:            z.object({
    min:      z.number().positive(),
    max:      z.number().positive(),
    currency: z.string().default("ILS"),
  }).optional(),
  screening_questions:     z.array(screeningQuestionSchema).default([]),
  rejection_rules:         z.array(rejectionRuleSchema).default([]),
  ai_instructions:         z.string().optional(),
  status:                  z.enum(["draft", "active"]).default("draft"),
});

export type CreateJobInput      = z.infer<typeof createJobSchema>;
export type ScreeningQuestionInput = z.infer<typeof screeningQuestionSchema>;
export type RejectionRuleInput  = z.infer<typeof rejectionRuleSchema>;
