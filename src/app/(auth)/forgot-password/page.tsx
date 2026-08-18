"use client";

// ==================================================
// Forgot password — request a reset email
// ==================================================
// The login screen linked here since Phase 3; the page never existed and
// the link 404'd. Supabase sends the recovery email (its built-in auth
// mailer); the link lands on /reset-password where the new password is set.

import { useState } from "react";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState("");
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = getSupabaseBrowserClient();
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setLoading(false);
    if (err) {
      // Rate limiting is the realistic failure (built-in mailer is capped);
      // anything else still gets a generic message — do not leak whether
      // the address exists.
      setError("שליחת המייל נכשלה — נסה שוב בעוד כמה דקות");
    } else {
      setSent(true);
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
          <h2 className="text-lg font-semibold mb-2">איפוס סיסמה</h2>

          {sent ? (
            <div className="space-y-4">
              <p className="text-sm text-neutral-600 leading-relaxed">
                אם קיים חשבון עם הכתובת <span className="font-medium" dir="ltr">{email}</span>,
                נשלח אליו עכשיו מייל עם קישור לאיפוס. בדוק גם את תיקיית הספאם.
              </p>
              <Link href="/login" className="btn-primary w-full block text-center">
                חזרה להתחברות
              </Link>
            </div>
          ) : (
            <>
              <p className="text-sm text-neutral-500 mb-6">
                הזן את כתובת המייל שאיתה נרשמת ונשלח לך קישור לאיפוס.
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="you@company.com"
                  className={cn(
                    "w-full px-3 py-2 border rounded-md text-sm",
                    "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500",
                    "placeholder:text-neutral-400"
                  )}
                />
                {error && (
                  <p className="text-sm text-danger bg-danger-light px-3 py-2 rounded-md">{error}</p>
                )}
                <button type="submit" disabled={loading} className="btn-primary w-full">
                  {loading ? "שולח…" : "שלח קישור איפוס"}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-sm text-neutral-500 mt-6">
          נזכרת בסיסמה?{" "}
          <Link href="/login" className="text-primary-600 hover:text-primary-700 font-medium">
            התחבר
          </Link>
        </p>
      </div>
    </main>
  );
}
