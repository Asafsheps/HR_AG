"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { MapPin, Briefcase, Building2, CheckCircle2, Upload, X } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type ScreeningQuestion = {
  question: string;
  type: "numeric" | "yes_no" | "open";
  weight: number;
  required?: boolean;
};

type JobPublic = {
  id: string;
  title: string;
  department: string;
  location: string;
  employment_type: string;
  description: string;
  requirements: string[];
  screening_questions: ScreeningQuestion[];
};

const EMPLOYMENT_LABELS: Record<string, string> = {
  full_time: "משרה מלאה", part_time: "משרה חלקית",
  contract: "חוזה", freelance: "פרילנס", internship: "סטאז'",
};

// ─── Component ─────────────────────────────────────────────────────────────────
export default function CandidateApplyPage() {
  const { jobSlug } = useParams<{ jobSlug: string }>();

  const [job, setJob]               = useState<JobPublic | null>(null);
  const [loading, setLoading]       = useState(true);
  const [notFound, setNotFound]     = useState(false);
  const [submitted, setSubmitted]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [cvFile, setCvFile]         = useState<File | null>(null);
  const fileRef                     = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    full_name:       "",
    email:           "",
    phone:           "",
    linkedin_url:    "",
    portfolio_url:   "",
    cover_letter:    "",
    whatsapp_consent: false,
  });

  const [answers, setAnswers] = useState<Record<string, string>>({});

  // ── Fetch job ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!jobSlug) return;
    fetch(`/api/jobs/${jobSlug}/public`)
      .then(r => r.json())
      .then(data => {
        if (data.success) setJob(data.data);
        else setNotFound(true);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [jobSlug]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  function handleField(key: string, value: string | boolean) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  function handleAnswer(idx: number, value: string) {
    setAnswers(prev => ({ ...prev, [idx]: value }));
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (file && file.size > 10 * 1024 * 1024) {
      setError("הקובץ גדול מדי. מקסימום 10MB");
      return;
    }
    setCvFile(file);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!job) return;
    setError(null);

    if (!form.full_name || !form.email || !form.phone) {
      setError("נא למלא את כל שדות החובה");
      return;
    }

    // Check required screening questions
    const missing = job.screening_questions.some(
      (q, i) => q.required && !answers[i]
    );
    if (missing) {
      setError("נא לענות על כל שאלות החובה");
      return;
    }

    setSubmitting(true);
    const fd = new FormData();
    fd.append("job_id",            job.id);
    fd.append("full_name",         form.full_name);
    fd.append("email",             form.email);
    fd.append("phone",             form.phone);
    fd.append("linkedin_url",      form.linkedin_url);
    fd.append("portfolio_url",     form.portfolio_url);
    fd.append("cover_letter",      form.cover_letter);
    fd.append("whatsapp_consent",  String(form.whatsapp_consent));
    fd.append("screening_answers", JSON.stringify(answers));
    if (cvFile) fd.append("cv_file", cvFile);

    try {
      const res  = await fetch("/api/candidates", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "שגיאה בשליחת הטופס");
      setSubmitted(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "שגיאה בשליחת הטופס");
    } finally {
      setSubmitting(false);
    }
  }

  // ── States ─────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (notFound) return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-neutral-900 mb-2">משרה לא נמצאה</h1>
        <p className="text-neutral-500">ייתכן שהמשרה לא פעילה או שהקישור שגוי.</p>
      </div>
    </div>
  );

  if (submitted) return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4" dir="rtl">
      <Card className="max-w-md w-full text-center py-10">
        <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-2xl font-semibold text-neutral-900 mb-2">המועמדות נשלחה!</h1>
        <p className="text-neutral-600 mb-1">תודה על הגשת מועמדותך ל{job?.title}.</p>
        <p className="text-sm text-neutral-500">ניצור איתך קשר בהקדם.</p>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-neutral-50" dir="rtl">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">{job!.title}</h1>
          <div className="flex flex-wrap items-center gap-3 text-sm text-neutral-500">
            {job!.department && (
              <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5" />{job!.department}</span>
            )}
            {job!.location && (
              <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{job!.location}</span>
            )}
            {job!.employment_type && (
              <Badge variant="info">{EMPLOYMENT_LABELS[job!.employment_type] ?? job!.employment_type}</Badge>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Job details */}
        <Card>
          <h2 className="font-semibold text-neutral-900 mb-3">תיאור המשרה</h2>
          <p className="text-sm text-neutral-700 whitespace-pre-line leading-relaxed">{job!.description}</p>
          {job!.requirements.length > 0 && (
            <>
              <h3 className="font-semibold text-neutral-900 mt-4 mb-2 text-sm">דרישות</h3>
              <ul className="space-y-1">
                {job!.requirements.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-neutral-700">
                    <span className="w-1.5 h-1.5 bg-primary-500 rounded-full mt-2 flex-shrink-0" />
                    {r}
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>

        {/* Application form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <Card>
            <h2 className="font-semibold text-neutral-900 mb-4">פרטים אישיים</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="שם מלא *"
                value={form.full_name}
                onChange={e => handleField("full_name", e.target.value)}
                required
              />
              <Input
                label="אימייל *"
                type="email"
                value={form.email}
                onChange={e => handleField("email", e.target.value)}
                required
              />
              <Input
                label="טלפון *"
                type="tel"
                value={form.phone}
                onChange={e => handleField("phone", e.target.value)}
                required
              />
              <Input
                label="LinkedIn"
                type="url"
                placeholder="https://linkedin.com/in/..."
                value={form.linkedin_url}
                onChange={e => handleField("linkedin_url", e.target.value)}
              />
              <Input
                label="פורטפוליו"
                type="url"
                placeholder="https://..."
                value={form.portfolio_url}
                onChange={e => handleField("portfolio_url", e.target.value)}
              />
            </div>
          </Card>

          {/* CV Upload */}
          <Card>
            <h2 className="font-semibold text-neutral-900 mb-3">קורות חיים</h2>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFileChange}
              className="hidden"
            />
            {cvFile ? (
              <div className="flex items-center gap-3 p-3 bg-neutral-50 border border-neutral-200 rounded-lg">
                <Briefcase className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                <span className="text-sm text-neutral-700 truncate flex-1">{cvFile.name}</span>
                <button
                  type="button"
                  onClick={() => { setCvFile(null); if (fileRef.current) fileRef.current.value = ""; }}
                  className="text-neutral-400 hover:text-neutral-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-full border-2 border-dashed border-neutral-300 rounded-lg p-6 text-center hover:border-primary-400 hover:bg-primary-50 transition-colors"
              >
                <Upload className="w-6 h-6 text-neutral-400 mx-auto mb-2" />
                <p className="text-sm text-neutral-600">לחץ להעלאת קובץ PDF או Word</p>
                <p className="text-xs text-neutral-400 mt-1">מקסימום 10MB</p>
              </button>
            )}
          </Card>

          {/* Cover letter */}
          <Card>
            <h2 className="font-semibold text-neutral-900 mb-3">מכתב מוטיבציה (אופציונלי)</h2>
            <textarea
              value={form.cover_letter}
              onChange={e => handleField("cover_letter", e.target.value)}
              rows={5}
              maxLength={3000}
              placeholder="ספר/י לנו עליך ולמה מתאימ/ה למשרה..."
              className="w-full text-sm border border-neutral-200 rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <p className="text-xs text-neutral-400 mt-1 text-left">{form.cover_letter.length}/3000</p>
          </Card>

          {/* Screening questions */}
          {job!.screening_questions.length > 0 && (
            <Card>
              <h2 className="font-semibold text-neutral-900 mb-4">שאלות סינון</h2>
              <div className="space-y-4">
                {job!.screening_questions.map((q, i) => (
                  <div key={i}>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                      {q.question}
                      {q.required && <span className="text-red-500 mr-1">*</span>}
                    </label>
                    {q.type === "yes_no" ? (
                      <div className="flex gap-3">
                        {["כן", "לא"].map(opt => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => handleAnswer(i, opt)}
                            className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
                              answers[i] === opt
                                ? "bg-primary-500 text-white border-primary-500"
                                : "bg-white text-neutral-700 border-neutral-300 hover:border-primary-400"
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    ) : q.type === "numeric" ? (
                      <input
                        type="number"
                        value={answers[i] ?? ""}
                        onChange={e => handleAnswer(i, e.target.value)}
                        className="w-32 text-sm border border-neutral-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    ) : (
                      <textarea
                        value={answers[i] ?? ""}
                        onChange={e => handleAnswer(i, e.target.value)}
                        rows={3}
                        className="w-full text-sm border border-neutral-200 rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* WhatsApp consent */}
          <Card>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.whatsapp_consent}
                onChange={e => handleField("whatsapp_consent", e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-neutral-700">
                אני מסכימ/ה לקבל עדכונים על תהליך הגיוס דרך WhatsApp
              </span>
            </label>
          </Card>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          <Button type="submit" loading={submitting} className="w-full" size="lg">
            שלח מועמדות
          </Button>
        </form>
      </div>
    </div>
  );
}
