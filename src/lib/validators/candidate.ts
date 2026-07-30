import { z } from "zod";

export const applyJobSchema = z.object({
  full_name:   z.string().min(2, "שם מלא נדרש"),
  email:       z.string().email("כתובת אימייל לא תקינה"),
  phone:       z.string().min(9, "מספר טלפון לא תקין").max(15),
  linkedin_url: z.string().url("כתובת LinkedIn לא תקינה").optional().or(z.literal("")),
  portfolio_url: z.string().url("כתובת פורטפוליו לא תקינה").optional().or(z.literal("")),
  cover_letter: z.string().max(3000).optional(),
  // screening answers: key = question index, value = answer string
  screening_answers: z.record(z.string(), z.string()).optional(),
  whatsapp_consent: z.boolean().default(false),
});

export type ApplyJobInput = z.infer<typeof applyJobSchema>;
