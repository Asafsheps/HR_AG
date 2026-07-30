"use client";

import { useState, useEffect, use } from "react";
import {
  MapPin, Briefcase, DollarSign, CheckCircle2,
  Upload, ArrowLeft, MessageCircle, Loader2, ChevronDown, ChevronUp,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Job {
  id: string; slug: string; title: string;
  location: string; type: string; salary_range: string;
  description: string;
  requirements: string[];
  nice_to_have: string[];
  whatsapp_bot_number: string;
}

// ─── Step states ──────────────────────────────────────────────────────────────
type Step = "form" | "submitting" | "success";

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ApplyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [job, setJob]       = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep]     = useState<Step>("form");
  const [whatsappUrl, setWhatsappUrl] = useState("");
  const [showFullDesc, setShowFullDesc] = useState(false);

  // Form state
  const [form, setForm] = useState({
    full_name: "", email: "", phone: "", cover_letter: "", agree: false,
  });
  const [cvFile, setCvFile]   = useState<File | null>(null);
  const [errors, setErrors]   = useState<Record<string, string>>({});

  useEffect(() => {
    fetch(`/api/jobs/${slug}/public`)
      .then(r => r.json())
      .then(d => { setJob(d.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [slug]);

  function validate() {
    const e: Record<string, string> = {};
    if (!form.full_name.trim()) e.full_name = "נא להזין שם מלא";
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "כתובת מייל לא תקינה";
    if (!form.phone.trim() || form.phone.length < 9) e.phone = "מספר טלפון לא תקין";
    if (!form.agree) e.agree = "יש לאשר את תנאי השימוש";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setStep("submitting");
    try {
      const fd = new FormData();
      fd.append("full_name",    form.full_name);
      fd.append("email",        form.email);
      fd.append("phone",        form.phone);
      fd.append("cover_letter", form.cover_letter);
      if (cvFile) fd.append("cv", cvFile);

      const r = await fetch(`/api/apply/${slug}`, { method: "POST", body: fd });
      const d = await r.json();

      if (d.success) {
        setWhatsappUrl(d.data.whatsapp_url ?? "");
        setStep("success");
      } else {
        setErrors({ _: d.error ?? "שגיאה — נסה שוב" });
        setStep("form");
      }
    } catch {
      setErrors({ _: "שגיאת רשת — נסה שוב" });
      setStep("form");
    }
  }

  // ── Loading ──
  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-primary-600 animate-spin" />
      </div>
    );
  }

  // ── Not found ──
  if (!job) {
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center gap-4">
        <div className="w-14 h-14 bg-neutral-100 rounded-full flex items-center justify-center">
          <Briefcase className="w-7 h-7 text-neutral-400" />
        </div>
        <h1 className="text-xl font-semibold text-neutral-800">המשרה לא נמצאה</h1>
        <p className="text-neutral-500 text-sm">ייתכן שהמשרה הוסרה או שהקישור אינו תקין</p>
      </div>
    );
  }

  // ── Success ──
  if (step === "success") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-md text-center space-y-6">

          <div className="flex items-center justify-center">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </div>
          </div>

          <div>
            <h1 className="text-2xl font-bold text-neutral-900 mb-2">המועמדות התקבלה! 🎉</h1>
            <p className="text-neutral-600 leading-relaxed">
              תודה {form.full_name.split(" ")[0]}! קיבלנו את הפרטים שלך למשרת <strong>{job.title}</strong>.
            </p>
          </div>

          {/* WhatsApp CTA */}
          <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-center w-12 h-12 bg-[#25D366]/10 rounded-xl mx-auto">
              <MessageCircle className="w-6 h-6 text-[#25D366]" />
            </div>
            <div>
              <h2 className="font-semibold text-neutral-900 text-lg mb-1">שלב הבא: שיחה עם הבוט</h2>
              <p className="text-sm text-neutral-500 leading-relaxed">
                הבוט שלנו ב-WhatsApp ישאל אותך מספר שאלות קצרות ויעביר את מועמדותך לצוות הגיוס.
                השיחה לוקחת כ-5 דקות.
              </p>
            </div>
            {whatsappUrl ? (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-3 w-full py-3.5 bg-[#25D366] hover:bg-[#1da851] text-white font-semibold rounded-xl transition-colors text-base"
              >
                <MessageCircle className="w-5 h-5" />
                התחל/י שיחה עם הבוט
              </a>
            ) : (
              <p className="text-sm text-neutral-400">מספר הוואטסאפ לא הוגדר — צור קשר עם המגייס ישירות.</p>
            )}
          </div>

          <p className="text-xs text-neutral-400">
            נשמח לחזור אליך בהמשך. בהצלחה! 💪
          </p>
        </div>
      </div>
    );
  }

  // ── Form ──
  const descLines = job.description.split("\n");
  const shortDesc = descLines.slice(0, 2).join("\n");
  const hasMore   = descLines.length > 2;

  return (
    <div className="min-h-screen bg-neutral-50" dir="rtl">

      {/* Hero header */}
      <div className="bg-gradient-to-l from-primary-700 to-primary-600 text-white">
        <div className="max-w-3xl mx-auto px-4 py-10">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl font-bold">
              H
            </div>
            <div>
              <p className="text-primary-200 text-sm font-medium mb-1">HR Project</p>
              <h1 className="text-2xl font-bold mb-3">{job.title}</h1>
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <span className="flex items-center gap-1.5 bg-white/15 px-3 py-1 rounded-full">
                  <MapPin className="w-3.5 h-3.5" /> {job.location}
                </span>
                <span className="flex items-center gap-1.5 bg-white/15 px-3 py-1 rounded-full">
                  <Briefcase className="w-3.5 h-3.5" /> {job.type}
                </span>
                <span className="flex items-center gap-1.5 bg-white/15 px-3 py-1 rounded-full">
                  <DollarSign className="w-3.5 h-3.5" /> {job.salary_range}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* Left: Job details */}
          <div className="lg:col-span-2 space-y-4">

            {/* Description */}
            <div className="bg-white border border-neutral-200 rounded-xl p-4 space-y-2">
              <h3 className="font-semibold text-neutral-900 text-sm">על המשרה</h3>
              <p className="text-sm text-neutral-600 leading-relaxed whitespace-pre-line">
                {showFullDesc ? job.description : shortDesc}
              </p>
              {hasMore && (
                <button
                  onClick={() => setShowFullDesc(v => !v)}
                  className="text-primary-600 text-xs font-medium flex items-center gap-1 hover:underline"
                >
                  {showFullDesc ? <><ChevronUp className="w-3.5 h-3.5" /> פחות</> : <><ChevronDown className="w-3.5 h-3.5" /> קרא עוד</>}
                </button>
              )}
            </div>

            {/* Requirements */}
            <div className="bg-white border border-neutral-200 rounded-xl p-4 space-y-2">
              <h3 className="font-semibold text-neutral-900 text-sm">דרישות</h3>
              <ul className="space-y-1.5">
                {job.requirements.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-neutral-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    {r}
                  </li>
                ))}
              </ul>
            </div>

            {/* Nice to have */}
            {job.nice_to_have.length > 0 && (
              <div className="bg-white border border-neutral-200 rounded-xl p-4 space-y-2">
                <h3 className="font-semibold text-neutral-900 text-sm">יתרון</h3>
                <ul className="space-y-1.5">
                  {job.nice_to_have.map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-neutral-500">
                      <span className="text-amber-400 mt-0.5">✦</span>
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* WhatsApp note */}
            <div className="bg-[#25D366]/10 border border-[#25D366]/30 rounded-xl p-4 flex items-start gap-3">
              <MessageCircle className="w-5 h-5 text-[#25D366] flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-neutral-800">תהליך מהיר בוואטסאפ</p>
                <p className="text-xs text-neutral-500 mt-0.5 leading-relaxed">
                  אחרי הגשת הטופס תועבר/י לשיחה קצרה עם הבוט שלנו — כ-5 דקות, ישירות מהנייד.
                </p>
              </div>
            </div>
          </div>

          {/* Right: Application form */}
          <div className="lg:col-span-3">
            <form onSubmit={handleSubmit} className="bg-white border border-neutral-200 rounded-xl p-6 space-y-4">
              <h2 className="text-lg font-semibold text-neutral-900">הגשת מועמדות</h2>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">שם מלא *</label>
                <input
                  type="text"
                  value={form.full_name}
                  onChange={e => setForm({ ...form, full_name: e.target.value })}
                  placeholder="ישראל ישראלי"
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${errors.full_name ? "border-red-400 bg-red-50" : "border-neutral-300"}`}
                />
                {errors.full_name && <p className="text-xs text-red-500 mt-1">{errors.full_name}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">כתובת מייל *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="israel@example.com"
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${errors.email ? "border-red-400 bg-red-50" : "border-neutral-300"}`}
                />
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  מספר טלפון / WhatsApp *
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                    placeholder="050-000-0000"
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${errors.phone ? "border-red-400 bg-red-50" : "border-neutral-300"}`}
                  />
                  <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#25D366]" />
                </div>
                <p className="text-xs text-neutral-400 mt-1">המספר ישמש לשיחה עם הבוט בוואטסאפ</p>
                {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
              </div>

              {/* CV Upload */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">קורות חיים (PDF) — אופציונלי</label>
                <label className={`flex flex-col items-center justify-center gap-2 w-full py-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                  cvFile
                    ? "border-emerald-400 bg-emerald-50"
                    : "border-neutral-300 bg-neutral-50 hover:border-primary-400 hover:bg-primary-50"
                }`}>
                  {cvFile ? (
                    <>
                      <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                      <span className="text-sm font-medium text-emerald-700">{cvFile.name}</span>
                      <span className="text-xs text-neutral-400">{(cvFile.size / 1024).toFixed(0)} KB</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-6 h-6 text-neutral-400" />
                      <span className="text-sm text-neutral-500">לחץ לבחירת קובץ PDF</span>
                      <span className="text-xs text-neutral-400">עד 5MB</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    className="hidden"
                    onChange={e => setCvFile(e.target.files?.[0] ?? null)}
                  />
                </label>
              </div>

              {/* Cover letter */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">מכתב מוטיבציה — אופציונלי</label>
                <textarea
                  value={form.cover_letter}
                  onChange={e => setForm({ ...form, cover_letter: e.target.value })}
                  rows={4}
                  placeholder="ספר/י לנו קצת על עצמך ולמה אתה/את מתאים/ה לתפקיד..."
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                />
              </div>

              {/* Agree */}
              <div>
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.agree}
                    onChange={e => setForm({ ...form, agree: e.target.checked })}
                    className="mt-0.5 rounded"
                  />
                  <span className="text-xs text-neutral-600 leading-relaxed">
                    אני מסכים/ה לאחסון הפרטים שלי לצרכי גיוס, ולקבלת הודעות בוואטסאפ בנושא הגיוס.
                    ניתן להסיר בכל עת.
                  </span>
                </label>
                {errors.agree && <p className="text-xs text-red-500 mt-1">{errors.agree}</p>}
              </div>

              {/* Global error */}
              {errors._ && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-600">
                  {errors._}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={step === "submitting"}
                className="w-full flex items-center justify-center gap-2 py-3 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors text-base"
              >
                {step === "submitting" ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> שולח מועמדות...</>
                ) : (
                  <><ArrowLeft className="w-5 h-5 rotate-180" /> שלח מועמדות</>
                )}
              </button>

              <p className="text-center text-xs text-neutral-400">
                לאחר השליחה תועבר/י לשיחה עם הבוט בוואטסאפ 💬
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
