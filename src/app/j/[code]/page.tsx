"use client";

// ==================================================
// Landing page — /j/[code]
// ==================================================
// The public entry point from an ad. The campaign code lives in the URL,
// so the job and channel are known from the click onward — the candidate
// never has to remember or type where they came from.
//
// Flow: read the job → name/phone/email + CV → start the interview chat.
// The CV is uploaded before the chat on purpose: an agent that has read
// it asks "what broke in that pipeline?" instead of "do you know Airflow?".

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import {
  MapPin, Briefcase, Upload, Loader2, MessageCircle,
  CheckCircle2, FileText, X,
} from "lucide-react";

interface CampaignJob {
  id: string;
  title: string;
  location: string | null;
  employment_type: string | null;
  description: string;
  requirements: string[];
}

interface Campaign {
  code: string;
  ad_copy: string;
  job: CampaignJob | null;
}

const MAX_CV_MB = 5;
const ACCEPTED = ".pdf,.doc,.docx";

export default function CampaignLandingPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const router = useRouter();

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading]   = useState(true);
  const [starting, setStarting] = useState(false);

  const [form, setForm] = useState({ full_name: "", phone: "", email: "" });
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch(`/api/campaigns/${code}/public`)
      .then(r => r.json())
      .then(d => setCampaign(d.success ? d.data : null))
      .catch(() => setCampaign(null))
      .finally(() => setLoading(false));
  }, [code]);

  function validate() {
    const e: Record<string, string> = {};
    if (!form.full_name.trim()) e.full_name = "נא להזין שם מלא";

    // Count digits rather than matching a format. People type 050-1234567,
    // 050 1234567 and +972501234567; rejecting any of those loses a real
    // candidate over punctuation. Normalisation happens server-side.
    const digits = form.phone.replace(/\D/g, "");
    if (digits.length < 9 || digits.length > 15) e.phone = "מספר טלפון לא תקין";

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "כתובת מייל לא תקינה";
    if (!cvFile) e.cv = "נא לצרף קורות חיים";

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleFile(f: File | null) {
    if (!f) return;
    if (f.size > MAX_CV_MB * 1024 * 1024) {
      setErrors(p => ({ ...p, cv: `הקובץ גדול מ-${MAX_CV_MB}MB` }));
      return;
    }
    setCvFile(f);
    setErrors(p => { const n = { ...p }; delete n.cv; return n; });
  }

  async function handleStart(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setStarting(true);
    try {
      const fd = new FormData();
      fd.append("code",      code);
      fd.append("full_name", form.full_name);
      fd.append("phone",     form.phone);
      fd.append("email",     form.email);
      if (cvFile) fd.append("cv", cvFile);

      const r = await fetch("/api/interview/start", { method: "POST", body: fd });
      const d = await r.json();

      if (d.success) {
        router.push(`/chat/${d.data.session_token}`);
      } else {
        setErrors({ _: d.error ?? "שגיאה — נסה שוב" });
        setStarting(false);
      }
    } catch {
      setErrors({ _: "שגיאת רשת — נסה שוב" });
      setStarting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-primary-600 animate-spin" />
      </div>
    );
  }

  if (!campaign?.job) {
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center gap-4 px-4 text-center">
        <div className="w-14 h-14 bg-neutral-100 rounded-full flex items-center justify-center">
          <Briefcase className="w-7 h-7 text-neutral-400" />
        </div>
        <h1 className="text-xl font-semibold text-neutral-800">המשרה לא נמצאה</h1>
        <p className="text-neutral-500 text-sm">ייתכן שהקישור אינו תקין או שהמשרה כבר אוישה</p>
      </div>
    );
  }

  const job = campaign.job;

  return (
    <div className="min-h-screen bg-neutral-50" dir="rtl">
      {/* Job header */}
      <header className="bg-gradient-to-l from-primary-700 to-primary-600 text-white">
        <div className="max-w-3xl mx-auto px-4 py-10">
          <p className="text-primary-200 text-sm font-medium mb-1">HR AG</p>
          <h1 className="text-2xl sm:text-3xl font-bold mb-3">{job.title}</h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-primary-100">
            {job.location && (
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />{job.location}
              </span>
            )}
            {job.employment_type && (
              <span className="flex items-center gap-1.5">
                <Briefcase className="w-4 h-4" />{job.employment_type}
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Description */}
        <section className="bg-white rounded-xl border border-neutral-200 p-6">
          <h2 className="font-semibold text-neutral-900 mb-3">על התפקיד</h2>
          <p className="text-neutral-600 text-sm leading-relaxed whitespace-pre-line">
            {campaign.ad_copy || job.description}
          </p>

          {job.requirements?.length > 0 && (
            <>
              <h3 className="font-semibold text-neutral-900 mt-6 mb-3">דרישות</h3>
              <ul className="space-y-2">
                {job.requirements.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-neutral-600">
                    <CheckCircle2 className="w-4 h-4 text-primary-600 mt-0.5 shrink-0" />
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>

        {/* Application */}
        <section className="bg-white rounded-xl border border-neutral-200 p-6">
          <h2 className="font-semibold text-neutral-900 mb-1">מעוניין? בוא נדבר</h2>
          <p className="text-sm text-neutral-500 mb-5">
            השאר פרטים וצרף קורות חיים, ונתחיל בשיחה קצרה כדי להכיר אותך.
          </p>

          <form onSubmit={handleStart} className="space-y-4">
            <Field label="שם מלא" error={errors.full_name}>
              <input
                type="text"
                value={form.full_name}
                onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="ישראל ישראלי"
              />
            </Field>

            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="טלפון" error={errors.phone}>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="050-0000000"
                  dir="ltr"
                />
              </Field>

              <Field label="אימייל" error={errors.email}>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="you@example.com"
                  dir="ltr"
                />
              </Field>
            </div>

            {/* CV — required, and read before the chat starts */}
            <Field label="קורות חיים" error={errors.cv}>
              {cvFile ? (
                <div className="flex items-center justify-between px-3 py-2.5 bg-primary-50 border border-primary-200 rounded-lg">
                  <span className="flex items-center gap-2 text-sm text-primary-900 min-w-0">
                    <FileText className="w-4 h-4 shrink-0" />
                    <span className="truncate">{cvFile.name}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setCvFile(null)}
                    className="text-primary-600 hover:text-primary-800 shrink-0"
                    aria-label="הסר קובץ"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center gap-2 px-4 py-6 border-2 border-dashed border-neutral-300 rounded-lg cursor-pointer hover:border-primary-400 hover:bg-neutral-50 transition-colors">
                  <Upload className="w-5 h-5 text-neutral-400" />
                  <span className="text-sm text-neutral-600">לחץ לצירוף קובץ</span>
                  <span className="text-xs text-neutral-400">PDF או Word, עד {MAX_CV_MB}MB</span>
                  <input
                    type="file"
                    accept={ACCEPTED}
                    className="hidden"
                    onChange={e => handleFile(e.target.files?.[0] ?? null)}
                  />
                </label>
              )}
            </Field>

            {errors._ && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {errors._}
              </p>
            )}

            <button
              type="submit"
              disabled={starting}
              className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium rounded-lg px-4 py-3 transition-colors"
            >
              {starting
                ? <><Loader2 className="w-4 h-4 animate-spin" />מתחיל…</>
                : <><MessageCircle className="w-4 h-4" />בוא נדבר</>}
            </button>

            <p className="text-xs text-neutral-400 text-center">
              בשליחה אתה מאשר שנשמור את פרטיך ונפנה אליך בנוגע למשרה זו ולמשרות דומות.
            </p>
          </form>
        </section>
      </main>
    </div>
  );
}

function Field({ label, error, children }: {
  label: string; error?: string; children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-neutral-700 mb-1.5">{label}</label>
      {children}
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}
