"use client";

// ==================================================
// Jobs list — real data
// ==================================================
// Replaces the static Phase-4 placeholder that shipped with six invented
// jobs baked into the page. Every row here now comes from /api/jobs, i.e.
// from the caller's own organization — a recruiter looking at this screen
// is looking at their actual pipeline, or an honest empty state.

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Search, MapPin, Loader2, Briefcase } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/utils";

interface JobRow {
  id: string;
  title: string;
  department: string | null;
  location: string | null;
  employment_type: string | null;
  status: string;
  created_at: string;
}

const STATUS_MAP: Record<string, { label: string; variant: "success"|"warning"|"neutral"|"danger" }> = {
  active:   { label: "פעיל",    variant: "success" },
  paused:   { label: "מושהה",   variant: "warning" },
  draft:    { label: "טיוטה",   variant: "neutral" },
  closed:   { label: "סגור",    variant: "danger" },
  archived: { label: "ארכיון",  variant: "neutral" },
};

const TYPE_MAP: Record<string, string> = {
  full_time:  "משרה מלאה",
  part_time:  "משרה חלקית",
  contract:   "פרילנס",
  internship: "התמחות",
};

const FILTERS = [
  { label: "הכל",    value: "" },
  { label: "פעיל",   value: "active" },
  { label: "מושהה",  value: "paused" },
  { label: "טיוטה",  value: "draft" },
  { label: "סגור",   value: "closed" },
];

export default function JobsPage() {
  const [jobs, setJobs]       = useState<JobRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [search, setSearch]   = useState("");
  const [status, setStatus]   = useState("");

  useEffect(() => {
    setLoading(true);
    const qs = status ? `?status=${status}&limit=100` : "?limit=100";
    fetch(`/api/jobs${qs}`)
      .then(r => r.json())
      .then(d => {
        if (d.success) { setJobs(d.data.jobs ?? []); setError(""); }
        else setError(d.error ?? "שגיאה בטעינת משרות");
      })
      .catch(() => setError("שגיאת רשת — נסה לרענן"))
      .finally(() => setLoading(false));
  }, [status]);

  const visible = search.trim()
    ? jobs.filter(j => j.title.includes(search.trim()))
    : jobs;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">משרות</h1>
          <p className="text-neutral-500 mt-0.5">{loading ? "…" : `${visible.length} משרות`}</p>
        </div>
        <Link href="/jobs/new">
          <Button size="md">
            <Plus className="w-4 h-4" />
            משרה חדשה
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card padding="sm">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="חיפוש משרה..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-neutral-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          {FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setStatus(f.value)}
              className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                f.value === status
                  ? "bg-primary-600 text-white border-primary-600"
                  : "bg-white text-neutral-600 border-neutral-200 hover:border-primary-300"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </Card>

      {/* Jobs table */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 text-primary-600 animate-spin" />
        </div>
      ) : error ? (
        <Card>
          <p className="text-sm text-red-600 text-center py-8">{error}</p>
        </Card>
      ) : visible.length === 0 ? (
        <Card>
          <div className="py-12 flex flex-col items-center gap-3 text-center">
            <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-neutral-400" />
            </div>
            <p className="text-neutral-600 font-medium">
              {jobs.length === 0 ? "אין משרות עדיין" : "אין תוצאות לחיפוש"}
            </p>
            {jobs.length === 0 && (
              <Link href="/jobs/new">
                <Button size="sm"><Plus className="w-4 h-4" />צור משרה ראשונה</Button>
              </Link>
            )}
          </div>
        </Card>
      ) : (
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50">
                  <th className="text-right font-medium text-neutral-500 px-6 py-3">תפקיד</th>
                  <th className="text-right font-medium text-neutral-500 px-4 py-3">מיקום</th>
                  <th className="text-right font-medium text-neutral-500 px-4 py-3">סוג</th>
                  <th className="text-right font-medium text-neutral-500 px-4 py-3">סטטוס</th>
                  <th className="text-right font-medium text-neutral-500 px-4 py-3">נוצר</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {visible.map(job => {
                  const s = STATUS_MAP[job.status] ?? { label: job.status, variant: "neutral" as const };
                  return (
                    <tr key={job.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="px-6 py-4">
                        <Link href={`/jobs/${job.id}`} className="font-medium text-neutral-900 hover:text-primary-700">
                          {job.title}
                        </Link>
                      </td>
                      <td className="px-4 py-4 text-neutral-600">
                        {job.location ? (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-neutral-400" />{job.location}
                          </span>
                        ) : "—"}
                      </td>
                      <td className="px-4 py-4 text-neutral-600">
                        {TYPE_MAP[job.employment_type ?? ""] ?? "—"}
                      </td>
                      <td className="px-4 py-4"><Badge variant={s.variant}>{s.label}</Badge></td>
                      <td className="px-4 py-4 text-neutral-500">{formatDate(job.created_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
