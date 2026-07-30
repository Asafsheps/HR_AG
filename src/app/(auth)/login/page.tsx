"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { loginAction } from "@/lib/auth/actions";
import { cn } from "@/lib/utils";

const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await loginAction({ email, password });
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
    // on success, loginAction redirects → no need to handle
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm">

        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-600 rounded-xl mb-4">
            <span className="text-white font-bold text-xl">H</span>
          </div>
          <h1 className="text-2xl font-semibold text-neutral-900">HR Project</h1>
          <p className="text-sm text-neutral-500 mt-1">פלטפורמת גיוס מבוססת AI</p>
        </div>

        {/* Demo banner */}
        {IS_DEMO && (
          <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
            <p className="text-sm text-amber-700 mb-2">
              🎭 <span className="font-medium">מצב Demo פעיל</span> — אין צורך בחשבון
            </p>
            <button
              onClick={() => router.push("/dashboard")}
              className="w-full py-2 px-4 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-md transition-colors"
            >
              🚀 כניסה לדמו ←
            </button>
          </div>
        )}

        {/* Card */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-6">כניסה למערכת</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                כתובת מייל
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@company.com"
                className={cn(
                  "w-full px-3 py-2 border rounded-md text-sm",
                  "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500",
                  "placeholder:text-neutral-400"
                )}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-neutral-700">
                  סיסמה
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-primary-600 hover:text-primary-700"
                >
                  שכחתי סיסמה
                </Link>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className={cn(
                  "w-full px-3 py-2 border rounded-md text-sm",
                  "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500",
                  "placeholder:text-neutral-400"
                )}
              />
            </div>

            {error && (
              <p className="text-sm text-danger bg-danger-light px-3 py-2 rounded-md">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full mt-2"
            >
              {loading ? "מתחבר..." : "כניסה"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-neutral-500 mt-6">
          אין לך חשבון?{" "}
          <Link href="/register" className="text-primary-600 hover:text-primary-700 font-medium">
            צור חשבון חדש
          </Link>
        </p>
      </div>
    </main>
  );
}
