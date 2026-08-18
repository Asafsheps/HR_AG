"use client";

// ==================================================
// Dashboard — real data
// ==================================================
// Replaces the last hardcoded Phase-4 screen: the stat cards claimed
// "47 new candidates" on an account with one. Everything here now comes
// from the analytics and candidates APIs — an empty pipeline shows
// honest zeros, which is what makes the numbers trustworthy when they
// finally aren't zero.

import { useState, useEffect } from "react";
import Link from "next/link";
import { Briefcase, Users, Bot, TrendingUp, Loader2, ArrowLeft } from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";

interface Overview {
  candidates: { total: number; active: number; hired: number; rejected: number; shortlisted: number };
  jobs:       { total: number; active: number };
  ai:         { avg_score: number | null; scored_count: number; assignments_sent: number };
  conversion_rate: number;
}

interface RecentCandidate {
  id: string; full_name: string; status: string; ai_score: number | null;
  created_at: string; job: { id: string; title: string } | null;
}

interface JobStat {
  id: string; title: string; status: string;
  total: number; shortlisted: number; avg_score: number | null;
}

const STATUS_BADGES: Record<string, { label: string; variant: "neutral"|"info"|"success"|"danger"|"warning" }> = {
  new:                  { label: "חדש",        variant: "neutral" },
  screening:            { label: "סינון",       variant: "info" },
  whatsapp_interview:   { label: "ריאיון",      variant: "info" },
  assignment_sent:      { label: "מטלה נשלחה",  variant: "warning" },
  assignment_submitted: { label: "מטלה הוגשה",  variant: "warning" },
  under_review:         { label: "בבחינה",      variant: "warning" },
  shortlisted:          { label: "מועדף",       variant: "success" },
  rejected:             { label: "נדחה",        variant: "danger" },
  hired:                { label: "התקבל",       variant: "success" },
  withdrawn:            { label: "נסוג",        variant: "neutral" },
};

export default function DashboardPage() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [recent, setRecent]     = useState<RecentCandidate[]>([]);
  const [jobStats, setJobStats] = useState<JobStat[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/analytics/overview").then(r => r.json()),
      fetch("/api/candidates/list?limit=5").then(r => r.json()),
      fetch("/api/analytics/jobs").then(r => r.json()),
    ]).then(([ov, cand, jobs]) => {
      if (ov.success)   setOverview(ov.data);
      if (cand.success) setRecent(cand.data.candidates ?? []);
      if (jobs.success) setJobStats((jobs.data ?? []).filter((j: JobStat) => j.status === "active").slice(0, 5));
    }).finally(() => setLoading(false));
  }, []);

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "בוקר טוב" : hour < 17 ? "צהריים טובים" : "ערב טוב";

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="w-6 h-6 text-primary-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">{greeting} 👋</h1>
        <p className="text-neutral-500 mt-0.5">{formatDate(now.toISOString())} · הנה מה שקורה היום</p>
      </div>

      {/* Stats — live numbers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="משרות פעילות"
          value={overview?.jobs.active ?? 0}
          subtitle={`מתוך ${overview?.jobs.total ?? 0} סה״כ`}
          icon={<Briefcase className="w-5 h-5" />}
        />
        <StatCard
          title="מועמדים בתהליך"
          value={overview?.candidates.active ?? 0}
          subtitle={`מתוך ${overview?.candidates.total ?? 0} סה״כ`}
          icon={<Users className="w-5 h-5" />}
        />
        <StatCard
          title="נוקדו על ידי AI"
          value={overview?.ai.scored_count ?? 0}
          subtitle={overview?.ai.avg_score != null ? `ציון ממוצע ${overview.ai.avg_score}` : "אין ציונים עדיין"}
          icon={<Bot className="w-5 h-5" />}
        />
        <StatCard
          title="מועדפים"
          value={overview?.candidates.shortlisted ?? 0}
          subtitle={`${overview?.ai.assignments_sent ?? 0} מטלות נשלחו`}
          icon={<TrendingUp className="w-5 h-5" />}
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent candidates */}
        <Card padding="none">
          <div className="flex items-center justify-between px-5 pt-4 pb-2">
            <h2 className="font-semibold text-neutral-900">מועמדים אחרונים</h2>
            <Link href="/candidates" className="text-xs text-primary-600 hover:text-primary-800 flex items-center gap-1">
              כל המועמדים <ArrowLeft className="w-3 h-3" />
            </Link>
          </div>
          {recent.length === 0 ? (
            <p className="text-sm text-neutral-400 text-center py-10">אין מועמדים עדיין — שתף לינק קמפיין כדי להתחיל</p>
          ) : (
            <div className="divide-y divide-neutral-100">
              {recent.map(c => {
                const badge = STATUS_BADGES[c.status] ?? { label: c.status, variant: "neutral" as const };
                return (
                  <Link key={c.id} href={`/candidates/${c.id}`}
                    className="flex items-center justify-between px-5 py-3 hover:bg-neutral-50 transition-colors">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-neutral-900 truncate">{c.full_name}</p>
                      <p className="text-xs text-neutral-500 truncate">{c.job?.title ?? "—"}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {c.ai_score != null && (
                        <span className={`text-sm font-semibold ${
                          c.ai_score >= 75 ? "text-emerald-600" : c.ai_score >= 50 ? "text-amber-600" : "text-red-500"
                        }`}>{c.ai_score}</span>
                      )}
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </Card>

        {/* Active jobs */}
        <Card padding="none">
          <div className="flex items-center justify-between px-5 pt-4 pb-2">
            <h2 className="font-semibold text-neutral-900">משרות פעילות</h2>
            <Link href="/jobs" className="text-xs text-primary-600 hover:text-primary-800 flex items-center gap-1">
              כל המשרות <ArrowLeft className="w-3 h-3" />
            </Link>
          </div>
          {jobStats.length === 0 ? (
            <p className="text-sm text-neutral-400 text-center py-10">אין משרות פעילות</p>
          ) : (
            <div className="divide-y divide-neutral-100">
              {jobStats.map(j => (
                <Link key={j.id} href={`/jobs/${j.id}`}
                  className="flex items-center justify-between px-5 py-3 hover:bg-neutral-50 transition-colors">
                  <p className="text-sm font-medium text-neutral-900 truncate">{j.title}</p>
                  <div className="flex items-center gap-4 shrink-0 text-xs text-neutral-500">
                    <span>{j.total} מועמדים</span>
                    <span>{j.shortlisted} מועדפים</span>
                    {j.avg_score != null && <span>ממוצע {j.avg_score}</span>}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
