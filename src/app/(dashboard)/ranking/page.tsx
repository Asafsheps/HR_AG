"use client";

// ==================================================
// Candidate ranking — the multi-dimensional score table
// ==================================================
// The recruiter-side payoff of the whole funnel: every candidate with
// their six scoring dimensions, filterable and sortable, reading the
// candidate_rankings view through /api/candidates/ranked. Filters mirror
// exactly what that API whitelists — nothing here invents a parameter.

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Trophy, Loader2, Flag, SlidersHorizontal } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

interface RankedRow {
  candidate_id: string;
  full_name: string;
  email: string;
  status: string;
  job_id: string;
  job_title: string;
  overall: number | null;
  tools_match: number | null;
  domain_match: number | null;
  seniority_match: number | null;
  communication: number | null;
  confidence: number | null;
  motivation: number | null;
  evidence_quality: string | null;
  age: number | null;
  gender: string | null;
  interview_complete: boolean;
  turn_count: number;
  flag_count: number;
  applied_at: string;
}

interface JobOption { id: string; title: string; }

const DIMENSIONS = [
  { key: "overall",         label: "כללי" },
  { key: "tools_match",     label: "כלים" },
  { key: "domain_match",    label: "תחום" },
  { key: "seniority_match", label: "ותק" },
  { key: "communication",   label: "תקשורת" },
  { key: "confidence",      label: "ביטחון" },
  { key: "motivation",      label: "מוטיבציה" },
] as const;

const EVIDENCE_LABELS: Record<string, { label: string; variant: "success"|"warning"|"danger" }> = {
  strong:  { label: "ראיות חזקות",  variant: "success" },
  partial: { label: "ראיות חלקיות", variant: "warning" },
  thin:    { label: "ראיות דלות",   variant: "danger" },
};

function scoreColor(v: number | null): string {
  if (v === null) return "text-neutral-300";
  if (v >= 75) return "text-emerald-600 font-semibold";
  if (v >= 50) return "text-amber-600";
  return "text-red-500";
}

export default function RankingPage() {
  const [rows, setRows]       = useState<RankedRow[]>([]);
  const [jobs, setJobs]       = useState<JobOption[]>([]);
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  const [jobId, setJobId]         = useState("");
  const [minOverall, setMinOverall] = useState("");
  const [scoredOnly, setScoredOnly] = useState(false);
  const [doneOnly, setDoneOnly]     = useState(false);
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const [gender, setGender]       = useState("");
  const [minAge, setMinAge]       = useState("");
  const [maxAge, setMaxAge]       = useState("");
  const [sort, setSort]           = useState("overall");

  const load = useCallback(() => {
    setLoading(true);
    const p = new URLSearchParams();
    if (jobId)       p.set("job_id", jobId);
    if (minOverall)  p.set("min_overall", minOverall);
    if (scoredOnly)  p.set("scored", "true");
    if (doneOnly)    p.set("interviewed", "true");
    if (flaggedOnly) p.set("flagged", "true");
    if (gender)      p.set("gender", gender);
    if (minAge)      p.set("min_age", minAge);
    if (maxAge)      p.set("max_age", maxAge);
    p.set("sort", sort);

    fetch(`/api/candidates/ranked?${p}`)
      .then(r => r.json())
      .then(d => {
        if (d.success) { setRows(d.data.candidates); setTotal(d.data.total); setError(""); }
        else setError(d.error ?? "שגיאה בטעינה");
      })
      .catch(() => setError("שגיאת רשת — נסה לרענן"))
      .finally(() => setLoading(false));
  }, [jobId, minOverall, scoredOnly, doneOnly, flaggedOnly, gender, minAge, maxAge, sort]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    fetch("/api/jobs?limit=100")
      .then(r => r.json())
      .then(d => { if (d.success) setJobs(d.data.jobs ?? []); });
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900 flex items-center gap-2">
          <Trophy className="w-6 h-6 text-amber-500" />
          דירוג מועמדים
        </h1>
        <p className="text-neutral-500 mt-0.5">
          {loading ? "…" : `${total} מועמדים`} · ניקוד בשישה ממדים על בסיס תמליל הריאיון
        </p>
      </div>

      {/* Filters */}
      <Card padding="sm">
        <div className="flex flex-wrap items-center gap-3">
          <SlidersHorizontal className="w-4 h-4 text-neutral-400" />

          <select value={jobId} onChange={e => setJobId(e.target.value)}
            className="px-3 py-1.5 text-sm border border-neutral-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-primary-500">
            <option value="">כל המשרות</option>
            {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
          </select>

          <label className="flex items-center gap-1.5 text-sm text-neutral-600">
            ציון מ-
            <input type="number" min={0} max={100} value={minOverall}
              onChange={e => setMinOverall(e.target.value)}
              className="w-16 px-2 py-1.5 text-sm border border-neutral-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="0" />
          </label>

          {[
            { label: "נוקדו בלבד",    value: scoredOnly,  set: setScoredOnly },
            { label: "סיימו ריאיון",  value: doneOnly,    set: setDoneOnly },
            { label: "מסומנים 🚩",    value: flaggedOnly, set: setFlaggedOnly },
          ].map(f => (
            <button key={f.label}
              onClick={() => f.set(v => !v)}
              className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                f.value ? "bg-primary-600 text-white border-primary-600"
                        : "bg-white text-neutral-600 border-neutral-200 hover:border-primary-300"
              }`}>
              {f.label}
            </button>
          ))}

          <select value={gender} onChange={e => setGender(e.target.value)}
            className="px-3 py-1.5 text-sm border border-neutral-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-primary-500">
            <option value="">כל המגדרים</option>
            <option value="male">גברים</option>
            <option value="female">נשים</option>
          </select>

          <label className="flex items-center gap-1.5 text-sm text-neutral-600">
            גיל
            <input type="number" value={minAge} onChange={e => setMinAge(e.target.value)}
              className="w-14 px-2 py-1.5 text-sm border border-neutral-200 rounded-md" placeholder="מ-" />
            <input type="number" value={maxAge} onChange={e => setMaxAge(e.target.value)}
              className="w-14 px-2 py-1.5 text-sm border border-neutral-200 rounded-md" placeholder="עד" />
          </label>
        </div>
      </Card>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 text-primary-600 animate-spin" /></div>
      ) : error ? (
        <Card><p className="text-sm text-red-600 text-center py-8">{error}</p></Card>
      ) : rows.length === 0 ? (
        <Card>
          <div className="py-12 text-center text-neutral-500 text-sm">
            אין מועמדים שתואמים את הסינון
          </div>
        </Card>
      ) : (
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50 text-right">
                  <th className="font-medium text-neutral-500 px-4 py-3">מועמד</th>
                  <th className="font-medium text-neutral-500 px-3 py-3">משרה</th>
                  {DIMENSIONS.map(d => (
                    <th key={d.key}
                      onClick={() => setSort(d.key)}
                      className={`font-medium px-2 py-3 text-center cursor-pointer select-none hover:text-primary-700 ${
                        sort === d.key ? "text-primary-700" : "text-neutral-500"
                      }`}
                      title="לחץ למיון">
                      {d.label}{sort === d.key ? " ↓" : ""}
                    </th>
                  ))}
                  <th className="font-medium text-neutral-500 px-3 py-3">ראיות</th>
                  <th className="font-medium text-neutral-500 px-2 py-3 text-center">🚩</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {rows.map(r => (
                  <tr key={r.candidate_id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/candidates/${r.candidate_id}`}
                        className="font-medium text-neutral-900 hover:text-primary-700">
                        {r.full_name}
                      </Link>
                      <p className="text-xs text-neutral-400">
                        {r.interview_complete ? "ריאיון הושלם" : `ריאיון חלקי (${r.turn_count} הודעות)`}
                        {r.age ? ` · גיל ${r.age}` : ""}
                      </p>
                    </td>
                    <td className="px-3 py-3 text-neutral-600 whitespace-nowrap">{r.job_title}</td>
                    {DIMENSIONS.map(d => (
                      <td key={d.key} className={`px-2 py-3 text-center ${scoreColor(r[d.key])} ${
                        d.key === "overall" ? "text-base" : ""
                      }`}>
                        {r[d.key] ?? "—"}
                      </td>
                    ))}
                    <td className="px-3 py-3">
                      {r.evidence_quality ? (
                        <Badge variant={EVIDENCE_LABELS[r.evidence_quality]?.variant ?? "neutral"}>
                          {EVIDENCE_LABELS[r.evidence_quality]?.label ?? r.evidence_quality}
                        </Badge>
                      ) : <span className="text-neutral-300 text-xs">לא נוקד</span>}
                    </td>
                    <td className="px-2 py-3 text-center">
                      {r.flag_count > 0 && (
                        <span className="inline-flex items-center gap-1 text-red-600 text-xs font-medium">
                          <Flag className="w-3.5 h-3.5" />{r.flag_count}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <p className="text-xs text-neutral-400">
        ציון חסר (—) פירושו שהממד לא נבדק בשיחה — לא ציון נמוך. סימון 🚩 מציין ניסיון השפעה על הסוכן שדורש עין אנושית.
      </p>
    </div>
  );
}
