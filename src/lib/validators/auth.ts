// ==================================================
// Validators — Auth & Organization
// ==================================================
import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("כתובת מייל לא תקינה"),
  password: z.string().min(8, "סיסמה חייבת להכיל לפחות 8 תווים"),
});

export const registerSchema = z.object({
  fullName: z.string().min(2, "שם חייב להכיל לפחות 2 תווים").max(100),
  email: z.string().email("כתובת מייל לא תקינה"),
  password: z
    .string()
    .min(8, "סיסמה חייבת להכיל לפחות 8 תווים")
    .regex(/[A-Z]/, "חייב להכיל אות גדולה")
    .regex(/[0-9]/, "חייב להכיל ספרה"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "הסיסמאות אינן תואמות",
  path: ["confirmPassword"],
});

export const organizationSchema = z.object({
  name: z.string().min(2, "שם חברה חייב להכיל לפחות 2 תווים").max(100),
  slug: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "מזהה חייב להיות באותיות קטנות ומקפים בלבד"),
});

export type LoginInput        = z.infer<typeof loginSchema>;
export type RegisterInput     = z.infer<typeof registerSchema>;
export type OrganizationInput = z.infer<typeof organizationSchema>;
