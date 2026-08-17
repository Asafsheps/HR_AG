// ==================================================
// Supabase — Middleware Client
// ==================================================
// Used exclusively in Next.js middleware (middleware.ts).
// Refreshes the user session on every request.
// ==================================================

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  // trim(): a BOM in a dashboard-pasted env value makes the Edge runtime
  // reject the auth header, killing every sign-in. See supabase/server.ts.
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!.trim(),
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!.trim(),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session — do not add logic between createServerClient and getUser
  const { data: { user } } = await supabase.auth.getUser();

  // Redirect unauthenticated users away from dashboard routes
  const isDashboardRoute = request.nextUrl.pathname.startsWith("/dashboard") ||
    request.nextUrl.pathname.startsWith("/jobs") ||
    request.nextUrl.pathname.startsWith("/candidates") ||
    request.nextUrl.pathname.startsWith("/conversations") ||
    request.nextUrl.pathname.startsWith("/analytics") ||
    request.nextUrl.pathname.startsWith("/settings");

  if (!user && isDashboardRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
