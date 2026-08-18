"use client";

// ==================================================
// Reset password — set the new one
// ==================================================
// The recovery link from the email lands here with a recovery session
// already attached by Supabase; updateUser({password}) completes the flow.
// If someone opens this page cold (no recovery session), updating fails
// and we point them back to /forgot-password.

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8)   { setError("הסיסמה צריכה להיות באורך 8 תווים לפחות"); return; }
    if (password !== confirm)  { setError("הסיסמאות אינן זהות"); return; }

    setLoading(true);
    const supabase = getSupabaseBrowserClient();
    const { error: err } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (err) {
      setError("הקישור פג תוקף או שאינו תקין — בקש קישור איפוס חדש");
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-600 rounded-xl mb-4">
            <span className="text-white font-bold text-xl">H</span>
          </div>
          <h1 className="text-2xl font-semibold text-neutral-900">HR AG</h1>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold mb-6">קביעת סיסמה חדשה</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">סיסמה חדשה</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                placeholder="לפחות 8 תווים"
                className={cn(
                  "w-full px-3 py-2 border rounded-md text-sm",
                  "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500",
                  "placeholder:text-neutral-400"
                )}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">אימות סיסמה</label>
              <input
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
                autoComplete="new-password"
                placeholder="••••••••"
                className={cn(
                  "w-full px-3 py-2 border rounded-md text-sm",
                  "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500",
                  "placeholder:text-neutral-400"
                )}
              />
            </div>

            {error && (
              <p className="text-sm text-danger bg-danger-light px-3 py-2 rounded-md">{error}</p>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? "שומר…" : "קבע סיסמה והתחבר"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-neutral-500 mt-6">
          <Link href="/forgot-password" className="text-primary-600 hover:text-primary-700 font-medium">
            בקש קישור איפוס חדש
          </Link>
        </p>
      </div>
    </main>
  );
}
