"use client";

import { useState } from "react";
import Link from "next/link";
import { registerAction } from "@/lib/auth/actions";
import { slugify, cn } from "@/lib/utils";

type Step = "account" | "organization";

export default function RegisterPage() {
  const [step, setStep]           = useState<Step>("account");
  const [error, setError]         = useState("");
  const [loading, setLoading]     = useState(false);

  // Account fields
  const [fullName, setFullName]   = useState("");
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [confirm, setConfirm]     = useState("");

  // Org fields
  const [orgName, setOrgName]     = useState("");
  const [orgSlug, setOrgSlug]     = useState("");

  function handleOrgNameChange(v: string) {
    setOrgName(v);
    setOrgSlug(slugify(v));
  }

  function handleNextStep(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("הסיסמאות אינן תואמות");
      return;
    }
    if (password.length < 8) {
      setError("סיסמה חייבת להכיל לפחות 8 תווים");
      return;
    }
    setStep("organization");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await registerAction(
      { fullName, email, password, confirmPassword: confirm },
      { name: orgName, slug: orgSlug }
    );

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm">

        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-600 rounded-xl mb-4">
            <span className="text-white font-bold text-xl">H</span>
          </div>
          <h1 className="text-2xl font-semibold text-neutral-900">HR Project</h1>
          <p className="text-sm text-neutral-500 mt-1">צור חשבון חדש</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-6">
          <div className={cn(
            "flex-1 h-1.5 rounded-full transition-colors",
            step === "account" ? "bg-primary-600" : "bg-primary-600"
          )} />
          <div className={cn(
            "flex-1 h-1.5 rounded-full transition-colors",
            step === "organization" ? "bg-primary-600" : "bg-neutral-200"
          )} />
        </div>

        <div className="card">

          {/* STEP 1: Account */}
          {step === "account" && (
            <>
              <h2 className="text-lg font-semibold mb-5">פרטי חשבון</h2>
              <form onSubmit={handleNextStep} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">שם מלא</label>
                  <input
                    type="text" required value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="ישראל ישראלי"
                    className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">כתובת מייל</label>
                  <input
                    type="email" required value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">סיסמה</label>
                  <input
                    type="password" required value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="לפחות 8 תווים, אות גדולה וספרה"
                    className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">אימות סיסמה</label>
                  <input
                    type="password" required value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                {error && (
                  <p className="text-sm text-danger bg-danger-light px-3 py-2 rounded-md">{error}</p>
                )}
                <button type="submit" className="btn-primary w-full mt-2">
                  המשך
                </button>
              </form>
            </>
          )}

          {/* STEP 2: Organization */}
          {step === "organization" && (
            <>
              <h2 className="text-lg font-semibold mb-1">פרטי החברה</h2>
              <p className="text-sm text-neutral-500 mb-5">
                תיצור כחשבון super admin של הארגון שלך
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">שם החברה</label>
                  <input
                    type="text" required value={orgName}
                    onChange={(e) => handleOrgNameChange(e.target.value)}
                    placeholder="Acme Corp"
                    className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    מזהה ייחודי
                    <span className="text-neutral-400 font-normal mr-1">(URL-friendly)</span>
                  </label>
                  <div className="flex items-center border rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-primary-500">
                    <span className="px-3 py-2 bg-neutral-50 text-neutral-400 text-sm border-r">hr-app/</span>
                    <input
                      type="text" required value={orgSlug}
                      onChange={(e) => setOrgSlug(e.target.value)}
                      placeholder="acme-corp"
                      className="flex-1 px-3 py-2 text-sm focus:outline-none"
                    />
                  </div>
                </div>
                {error && (
                  <p className="text-sm text-danger bg-danger-light px-3 py-2 rounded-md">{error}</p>
                )}
                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setStep("account")}
                    className="btn-secondary flex-1"
                  >
                    חזור
                  </button>
                  <button type="submit" disabled={loading} className="btn-primary flex-1">
                    {loading ? "יוצר חשבון..." : "צור חשבון"}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-sm text-neutral-500 mt-6">
          יש לך חשבון?{" "}
          <Link href="/login" className="text-primary-600 hover:text-primary-700 font-medium">
            התחבר
          </Link>
        </p>
      </div>
    </main>
  );
}
