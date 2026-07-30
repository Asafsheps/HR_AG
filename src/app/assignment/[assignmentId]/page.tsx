"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CheckCircle2, Upload, X, Clock, FileText, Link2 } from "lucide-react";

type Assignment = {
  id:             string;
  title:          string;
  description:    string;
  instructions:   string;
  deadline_hours: number;
  status:         string;
  sent_at:        string | null;
};

export default function AssignmentSubmissionPage() {
  const { assignmentId } = useParams<{ assignmentId: string }>();

  const [assignment, setAssignment]   = useState<Assignment | null>(null);
  const [loading, setLoading]         = useState(true);
  const [notFound, setNotFound]       = useState(false);
  const [alreadyDone, setAlreadyDone] = useState(false);
  const [submitted, setSubmitted]     = useState(false);
  const [submitting, setSubmitting]   = useState(false);
  const [error, setError]             = useState<string | null>(null);

  const [submissionText, setSubmissionText] = useState("");
  const [submissionUrl, setSubmissionUrl]   = useState("");
  const [file, setFile]                     = useState<File | null>(null);
  const fileRef                             = useRef<HTMLInputElement>(null);

  // Deadline countdown
  const [timeLeft, setTimeLeft] = useState<string>("");

  useEffect(() => {
    if (!assignmentId) return;
    fetch(`/api/assignments/${assignmentId}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) setAssignment(data.data);
        else if (data.error?.includes("כבר הוגשה")) setAlreadyDone(true);
        else setNotFound(true);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [assignmentId]);

  // Live countdown
  useEffect(() => {
    if (!assignment?.sent_at || !assignment?.deadline_hours) return;
    const deadline = new Date(assignment.sent_at).getTime() + assignment.deadline_hours * 3600000;
    const tick = () => {
      const diff = deadline - Date.now();
      if (diff <= 0) { setTimeLeft("פג תוקף"); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setTimeLeft(`${h}ש ${m}ד`);
    };
    tick();
    const interval = setInterval(tick, 60000);
    return () => clearInterval(interval);
  }, [assignment]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!submissionText.trim() && !submissionUrl.trim() && !file) {
      setError("נא לספק תגובה, קישור או קובץ");
      return;
    }
    setError(null);
    setSubmitting(true);

    const fd = new FormData();
    if (submissionText.trim()) fd.append("submission_text", submissionText.trim());
    if (submissionUrl.trim()) fd.append("submission_url",  submissionUrl.trim());
    if (file) fd.append("file", file);

    try {
      const res  = await fetch(`/api/assignments/${assignmentId}/submit`, { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "שגיאה בהגשה");
      setSubmitted(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "שגיאה בהגשה");
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
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center" dir="rtl">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-neutral-900 mb-2">מטלה לא נמצאה</h1>
        <p className="text-neutral-500">הקישור שגוי או שהמטלה לא זמינה.</p>
      </div>
    </div>
  );

  if (alreadyDone) return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4" dir="rtl">
      <Card className="max-w-md w-full text-center py-10">
        <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-xl font-semibold text-neutral-900 mb-2">המטלה כבר הוגשה</h1>
        <p className="text-sm text-neutral-500">תודה על הגשתך. נחזור אליך בהקדם.</p>
      </Card>
    </div>
  );

  if (submitted) return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4" dir="rtl">
      <Card className="max-w-md w-full text-center py-10">
        <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-2xl font-semibold text-neutral-900 mb-2">המטלה הוגשה בהצלחה!</h1>
        <p className="text-neutral-600">תודה. נחזור אליך עם תוצאות בהקדם.</p>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-neutral-50" dir="rtl">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900 mb-1">{assignment!.title}</h1>
              <p className="text-neutral-500 text-sm">{assignment!.description}</p>
            </div>
            {timeLeft && (
              <div className="flex items-center gap-1.5 text-sm font-medium text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 flex-shrink-0">
                <Clock className="w-4 h-4" />
                {timeLeft}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Instructions */}
        <Card>
          <h2 className="font-semibold text-neutral-900 mb-3">הוראות המטלה</h2>
          <div className="text-sm text-neutral-700 whitespace-pre-line leading-relaxed">
            {assignment!.instructions}
          </div>
        </Card>

        {/* Submission form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Text response */}
          <Card>
            <h2 className="font-semibold text-neutral-900 mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4" />תגובה כתובה
            </h2>
            <textarea
              value={submissionText}
              onChange={e => setSubmissionText(e.target.value)}
              rows={10}
              placeholder="כתב/י את תשובתך כאן..."
              className="w-full text-sm border border-neutral-200 rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </Card>

          {/* URL submission */}
          <Card>
            <h2 className="font-semibold text-neutral-900 mb-3 flex items-center gap-2">
              <Link2 className="w-4 h-4" />קישור לעבודה
            </h2>
            <input
              type="url"
              value={submissionUrl}
              onChange={e => setSubmissionUrl(e.target.value)}
              placeholder="https://github.com/... או Google Drive..."
              className="w-full text-sm border border-neutral-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </Card>

          {/* File upload */}
          <Card>
            <h2 className="font-semibold text-neutral-900 mb-3 flex items-center gap-2">
              <Upload className="w-4 h-4" />העלאת קובץ
            </h2>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.zip,.txt,.xlsx,.docx,.png,.jpg,.jpeg"
              onChange={e => setFile(e.target.files?.[0] ?? null)}
              className="hidden"
            />
            {file ? (
              <div className="flex items-center gap-3 p-3 bg-neutral-50 border border-neutral-200 rounded-lg">
                <FileText className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                <span className="text-sm text-neutral-700 truncate flex-1">{file.name}</span>
                <button
                  type="button"
                  onClick={() => { setFile(null); if (fileRef.current) fileRef.current.value = ""; }}
                  className="text-neutral-400 hover:text-neutral-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-full border-2 border-dashed border-neutral-300 rounded-lg p-5 text-center hover:border-primary-400 hover:bg-primary-50 transition-colors"
              >
                <Upload className="w-5 h-5 text-neutral-400 mx-auto mb-1.5" />
                <p className="text-sm text-neutral-600">לחץ להעלאת קובץ</p>
                <p className="text-xs text-neutral-400 mt-0.5">PDF, ZIP, DOCX, XLSX, PNG — עד 50MB</p>
              </button>
            )}
          </Card>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          <Button type="submit" loading={submitting} className="w-full" size="lg">
            הגש מטלה
          </Button>
        </form>
      </div>
    </div>
  );
}
