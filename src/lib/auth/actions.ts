// ==================================================
// Auth — Server Actions
// ==================================================
// All auth mutations run server-side via Next.js Server Actions.
// Never expose Supabase service role to the client.
// ==================================================

"use server";

import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { loginSchema, registerSchema, organizationSchema } from "@/lib/validators/auth";
import { slugify } from "@/lib/utils";
import type { LoginInput, RegisterInput, OrganizationInput } from "@/lib/validators/auth";

// --------------------------------------------------
// LOGIN
// --------------------------------------------------
export async function loginAction(input: LoginInput) {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    if (error.message.includes("Invalid login credentials")) {
      return { error: "מייל או סיסמה שגויים" };
    }
    // Server-side only. The candidate-facing message stays generic, but an
    // unmapped auth failure with no log is undiagnosable in production.
    console.error("[auth] signInWithPassword failed:", error.status, error.code, error.message);
    return { error: "שגיאה בהתחברות. נסה שוב." };
  }

  redirect("/dashboard");
}

// --------------------------------------------------
// REGISTER + CREATE ORGANIZATION
// --------------------------------------------------
export async function registerAction(
  userInput: RegisterInput,
  orgInput: OrganizationInput
) {
  const parsedUser = registerSchema.safeParse(userInput);
  const parsedOrg  = organizationSchema.safeParse(orgInput);

  if (!parsedUser.success) return { error: parsedUser.error.errors[0].message };
  if (!parsedOrg.success)  return { error: parsedOrg.error.errors[0].message };

  const adminClient = await getSupabaseAdminClient();

  // 1. Create organization first
  const { data: org, error: orgError } = await adminClient
    .from("organizations")
    .insert({
      name: parsedOrg.data.name,
      slug: parsedOrg.data.slug || slugify(parsedOrg.data.name),
    })
    .select("id")
    .single();

  if (orgError) {
    if (orgError.code === "23505") {
      return { error: "מזהה החברה כבר קיים. בחר מזהה אחר." };
    }
    return { error: "שגיאה ביצירת הארגון" };
  }

  // 2. Create user — pass organization_id + role in metadata
  //    handle_new_user trigger will create the recruiter_profile automatically
  const { error: signUpError } = await adminClient.auth.admin.createUser({
    email:    parsedUser.data.email,
    password: parsedUser.data.password,
    email_confirm: true,
    user_metadata: {
      full_name:       parsedUser.data.fullName,
      organization_id: org.id,
      role:            "super_admin", // first user is always super_admin
    },
  });

  if (signUpError) {
    // Roll back org creation
    await adminClient.from("organizations").delete().eq("id", org.id);

    if (signUpError.message.includes("already registered")) {
      return { error: "כתובת המייל כבר רשומה במערכת" };
    }
    return { error: "שגיאה ביצירת המשתמש" };
  }

  // 3. Sign in the new user
  const supabase = await getSupabaseServerClient();
  await supabase.auth.signInWithPassword({
    email:    parsedUser.data.email,
    password: parsedUser.data.password,
  });

  redirect("/dashboard");
}

// --------------------------------------------------
// LOGOUT
// --------------------------------------------------
export async function logoutAction() {
  const supabase = await getSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}

// --------------------------------------------------
// INVITE TEAM MEMBER (admin only)
// --------------------------------------------------
export async function inviteTeamMemberAction(
  email: string,
  fullName: string,
  role: "admin" | "recruiter" | "viewer"
) {
  const supabase      = await getSupabaseServerClient();
  const adminClient   = await getSupabaseAdminClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "לא מחובר" };

  // Get current user's org
  const { data: profile } = await supabase
    .from("recruiter_profiles")
    .select("organization_id, role")
    .eq("id", user.id)
    .single();

  if (!profile || !["super_admin", "admin"].includes(profile.role)) {
    return { error: "אין הרשאה לבצע פעולה זו" };
  }

  const { error } = await adminClient.auth.admin.inviteUserByEmail(email, {
    data: {
      full_name:       fullName,
      organization_id: profile.organization_id,
      role,
    },
  });

  if (error) return { error: "שגיאה בשליחת ההזמנה" };
  return { success: true };
}
