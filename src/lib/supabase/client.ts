// ==================================================
// Supabase — Browser Client
// ==================================================
// Used in React components and client-side hooks.
// Creates a singleton to avoid multiple GoTrueClient warnings.
// ==================================================

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

let client: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function getSupabaseBrowserClient() {
  if (client) return client;

  client = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!.trim(),
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!.trim()
  );

  return client;
}
