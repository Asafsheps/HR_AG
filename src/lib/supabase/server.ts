// ==================================================
// Supabase — Server Client
// ==================================================
// Used in Server Components, Server Actions, and Route Handlers.
// Reads cookies via Next.js `cookies()` for session persistence.
// ==================================================

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

// trim() everywhere an env value becomes an HTTP header. A BOM or stray
// whitespace pasted into a hosting dashboard is invisible, and the Edge
// runtime rejects the header with a ByteString error — which surfaced as
// every production sign-in failing.
function env(name: string): string {
  return process.env[name]?.trim() ?? "";
}

export async function getSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    env("NEXT_PUBLIC_SUPABASE_URL"),
    env("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll called from a Server Component — safe to ignore
          }
        },
      },
    }
  );
}

// Service-role client — bypasses RLS. Use only in trusted server contexts.
export async function getSupabaseAdminClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    env("NEXT_PUBLIC_SUPABASE_URL"),
    env("SUPABASE_SERVICE_ROLE_KEY"),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // ignore in Server Components
          }
        },
      },
    }
  );
}
