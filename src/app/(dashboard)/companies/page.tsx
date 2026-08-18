"use client";

// ==================================================
// Client companies — the business-development screen
// ==================================================
// Who pays a placement bonus, how candidates are submitted to each
// company, which of their jobs we imported, and the paste-import flow:
// copy a posting from their careers page → AI extracts criteria →
// review → activate into a live funnel job with a landing link.
// Paste, not scrape: careers sites block bots, and a blocked scraper
// burns a business partner.

import { useState, useEffect, useCallback } from "react";
import {
  Building2, Loader2, Plus, ExternalLink, Sparkles,
  CheckCircle2, Copy, Check, Banknote, Send,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

interface ClientJob {
  id: string;
  external_ref: string | null;
  source_url: string | null;
  title: string;
  location: string | null;
  core_skills: string[];
  min_years: number | null;
  business_priority: string | null;
  is_reviewed: boolean;
  status: string;
  created_at: string;
}

interface Company {
  id: string;
  name: string;
  website: string | null;
  careers_url: string | null;
  submission_method: string;
  bonus_amount_ils: number | null;
  bonus_delay_months: number | null;
  bonus_notes: string | null;
  status: string;
  contact_email: string | null;
  client_jobs: ClientJob[];
}

const SUBMISSION_LABELS: Record<string, string> = {
  email:    "שליחת מועמד במייל",
  web_form: "טופס באתר",
  manual:   "ידני",
};

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");

  // Import form
  const [importFor, setImportFor]   = useState<string | null>(null);
  const [rawText, setRawText]       = useState("");
  const [sourceUrl, setSourceUrl]   = useState("");
  const [externalRef, setExternalRef] = useState("");
  const [importing, setImporting]   = useState(false);
  const [importError, setImportError] = useState("");

  // Activation
  const [activating, setActivating] = useState("");
  const [activated, setActivated]   = useState<Record<string, { landing_url: string | null }>>({});
  const [copied, setCopied]         = useState("");

  const load = useCallback(() => {
    fetch("/api/companies")
      .then(r => r.json())
      .then(d => {
        if (d.success) { setCompanies(d.data.companies); setError(""); }
        else setError(d.error ?? "שגיאה בטעינה");
      })
      .catch(() => setError("שגיאת רשת — נסה לרענן"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleImport(companyId: string) {
    setImporting(true);
    setImportError("");
    try {
      const r = await fetch("/api/companies/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_id: companyId,
          raw_text: rawText,
          source_url: sourceUrl || undefined,
          external_ref: externalRef || undefined,
        }),
      });
      const d = await r.json();
      if (d.success) {
        setImportFor(null);
        setRawText(""); setSourceUrl(""); setExternalRef("");
        load();
      } else {
        setImportError(d.error ?? "הייבוא נכשל");
      }
    } catch {
      setImportError("שגיאת רשת — נסה שוב");
    } finally {
      setImporting(false);
    }
  }

  async function handleActivate(job: ClientJob) {
    setActivating(job.id);
    try {
      const r = await fetch("/api/companies/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client_job_id: job.id }),
      });
      const d = await r.json();
      if (d.success) {
        setActivated(p => ({ ...p, [job.id]: { landing_url: d.data.landing_url } }));
        load();
      }
    } finally {
      setActivating("");
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900 flex items-center gap-2">
          <Building2 className="w-6 h-6 text-primary-600" />
          חברות
        </h1>
        <p className="text-neutral-500 mt-0.5">
          שותפות להשמה — תנאי בונוס, מסלול שליחת מועמדים, ומשרות שיובאו לתהליך
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 text-primary-600 animate-spin" /></div>
      ) : error ? (
        <Card><p className="text-sm text-red-600 text-center py-8">{error}</p></Card>
      ) : companies.map(co => (
        <Card key={co.id}>
          {/* Company header */}
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <h2 className="font-semibold text-neutral-900 flex items-center gap-2">
                {co.name}
                <Badge variant={co.status === "active" ? "success" : "neutral"}>
                  {co.status === "active" ? "פעילה" : co.status}
                </Badge>
              </h2>
              <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-neutral-500">
                <span className="flex items-center gap-1">
                  <Banknote className="w-3.5 h-3.5" />
                  {co.bonus_amount_ils
                    ? `בונוס ₪${co.bonus_amount_ils.toLocaleString()}${co.bonus_delay_months ? ` (אחרי ${co.bonus_delay_months} ח׳)` : ""}`
                    : "בונוס לא פורסם — לברר"}
                </span>
                <span className="flex items-center gap-1">
                  <Send className="w-3.5 h-3.5" />
                  {SUBMISSION_LABELS[co.submission_method] ?? co.submission_method}
                  {co.contact_email ? ` · ${co.contact_email}` : ""}
                </span>
                {co.careers_url && (
                  <a href={co.careers_url} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1 text-primary-600 hover:text-primary-800">
                    <ExternalLink className="w-3.5 h-3.5" />עמוד קריירה
                  </a>
                )}
              </div>
              {co.bonus_notes && <p className="text-xs text-neutral-400 mt-1">{co.bonus_notes}</p>}
            </div>
            <button
              onClick={() => { setImportFor(importFor === co.id ? null : co.id); setImportError(""); }}
              className="flex items-center gap-1.5 px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              ייבוא משרה
            </button>
          </div>

          {/* Import form */}
          {importFor === co.id && (
            <div className="mt-4 p-4 bg-neutral-50 border border-neutral-200 rounded-xl space-y-3">
              <p className="text-xs text-neutral-500">
                פתח את עמוד הקריירה של {co.name}, העתק את טקסט המשרה המלא והדבק כאן — ה-AI יחלץ את הקריטריונים.
              </p>
              <textarea
                value={rawText}
                onChange={e => setRawText(e.target.value)}
                rows={6}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="הדבק כאן את טקסט המשרה המלא…"
              />
              <div className="grid sm:grid-cols-2 gap-3">
                <input
                  value={sourceUrl}
                  onChange={e => setSourceUrl(e.target.value)}
                  className="px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="קישור למשרה (אופציונלי)"
                  dir="ltr"
                />
                <input
                  value={externalRef}
                  onChange={e => setExternalRef(e.target.value)}
                  className="px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="מספר משרה אצלם (אופציונלי)"
                />
              </div>
              {importError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{importError}</p>
              )}
              <div className="flex justify-end">
                <button
                  onClick={() => handleImport(co.id)}
                  disabled={importing || rawText.trim().length < 40}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {importing ? "מחלץ קריטריונים…" : "ייבא עם AI"}
                </button>
              </div>
            </div>
          )}

          {/* Imported jobs */}
          {co.client_jobs.length > 0 && (
            <div className="mt-4 divide-y divide-neutral-100">
              {co.client_jobs.map(job => (
                <div key={job.id} className="py-3 flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <p className="font-medium text-neutral-900 text-sm">
                      {job.title}
                      {job.external_ref && <span className="text-neutral-400 font-normal"> · #{job.external_ref}</span>}
                    </p>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      {[job.location, job.min_years ? `${job.min_years}+ שנים` : null,
                        job.core_skills.slice(0, 4).join(", ")].filter(Boolean).join(" · ")}
                    </p>
                    {job.business_priority && (
                      <p className="text-xs text-neutral-400 mt-0.5">💡 {job.business_priority}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {activated[job.id]?.landing_url ? (
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(activated[job.id].landing_url!);
                          setCopied(job.id);
                          setTimeout(() => setCopied(""), 2000);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium rounded-lg"
                      >
                        {copied === job.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {copied === job.id ? "הועתק" : "העתק לינק נחיתה"}
                      </button>
                    ) : job.is_reviewed ? (
                      <Badge variant="success">
                        <CheckCircle2 className="w-3 h-3 ml-1" />הופעלה
                      </Badge>
                    ) : (
                      <button
                        onClick={() => handleActivate(job)}
                        disabled={activating === job.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 border border-primary-300 text-primary-700 hover:bg-primary-50 text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                      >
                        {activating === job.id
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          : <CheckCircle2 className="w-3.5 h-3.5" />}
                        אשר והפוך למשרה פעילה
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      ))}

      <p className="text-xs text-neutral-400">
        &quot;אשר והפוך למשרה פעילה&quot; יוצר משרה בתהליך שלנו + קמפיין עם לינק נחיתה מוכן לפרסום. שליחת מועמד לחברה נעשית לפי המסלול שלה (מייל/טופס) — מהפרופיל של המועמד.
      </p>
    </div>
  );
}
