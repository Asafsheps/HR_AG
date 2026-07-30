"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Users, Briefcase, TrendingUp, Star, MessageSquare,
  CheckCircle, Clock, Award, Loader2
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Overview {
  candidates:      { total: number; active: number; hired: number; rejected: number; shortlisted: number };
  jobs:            { total: number; active: number };
  ai:              { avg_score: number | null; scored_count: number; whatsapp_interviews: number; assignments_sent: number };
  conversion_rate: number;
}
interface PipelineStage { stage: string; label: string; count: number }
interface ScoreBucket   { range: string; min: number; max: number; count: number }
interface TimelinePoint { date: string; count: number }
interface PipelineData  { pipeline: PipelineStage[]; score_distribution: ScoreBucket[]; timeline: TimelinePoint[] }
interface JobStat {
  id: string; title: string; status: string; department: string | null;
  total: number; shortlisted: number; hired: number; rejected: number; avg_score: number | null;
}

// ─── KPI Card ────────────────────────────────────────────────────────────────

function KPICard({
  icon: Icon, label, value, sub, color = "text-neutral-900",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string; value: string | number; sub?: string; color?: string;
}) {
  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-neutral-500 mb-1">{label}</p>
          <p className={`text-3xl font-bold ${color}`}>{value}</p>
          {sub && <p className="text-xs text-neutral-400 mt-1">{sub}</p>}
        </div>
        <div className="p-2.5 bg-neutral-100 rounded-lg">
          <Icon className="w-5 h-5 text-neutral-500" />
        </div>
      </div>
    </Card>
  );
}

// ─── Horizontal Bar Chart ─────────────────────────────────────────────────────

function HBarChart({ data, maxValue }: { data: { label: string; value: number; color: string }[]; maxValue: number }) {
  return (
    <div className="space-y-2.5">
      {data.map((item) => (
        <div key={item.label} className="flex items-center gap-3 text-sm">
          <span className="w-24 text-right text-neutral-600 flex-shrink-0 text-xs truncate">{item.label}</span>
          <div className="flex-1 bg-neutral-100 rounded-full h-6 overflow-hidden">
            <div
              className={`${item.color} h-6 rounded-full flex items-center justify-end pr-2 transition-all duration-700`}
              style={{ width: maxValue > 0 ? `${(item.value / maxValue) * 100}%` : "0%" }}
            >
              {item.value > 0 && <span className="text-white text-xs font-medium">{item.value}</span>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Score Distribution ───────────────────────────────────────────────────────

function ScoreDistChart({ buckets }: { buckets: ScoreBucket[] }) {
  const max    = Math.max(...buckets.map((b) => b.count), 1);
  const colors = ["bg-red-400", "bg-orange-400", "bg-amber-400", "bg-lime-500", "bg-green-500"];
  return (
    <div className="flex items-end justify-around gap-2 h-28 pt-4">
      {buckets.map((b, i) => (
        <div key={b.range} className="flex flex-col items-center gap-1 flex-1">
          <span className="text-xs font-semibold text-neutral-600">{b.count || ""}</span>
          <div
            className={`w-full rounded-t-sm transition-all duration-700 ${b.count > 0 ? colors[i] : "bg-neutral-100"}`}
            style={{ height: `${(b.count / max) * 80}px`, minHeight: b.count > 0 ? "4px" : "0" }}
          />
          <span className="text-xs text-neutral-400 leading-tight text-center">{b.range}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Sparkline ────────────────────────────────────────────────────────────────

function Sparkline({ points }: { points: TimelinePoint[] }) {
  if (points.length < 2) return null;
  const max     = Math.max(...points.map((p) => p.count), 1);
  const W       = 100;
  const H       = 60;
  const stepX   = W / (points.length - 1);

  const coords = points.map((p, i) => ({
    x: i * stepX,
    y: H - (p.count / max) * (H - 6) - 3,
  }));

  const pathD = coords.map((pt, i) => `${i === 0 ? "M" : "L"}${pt.x.toFixed(1)},${pt.y.toFixed(1)}`).join(" ");
  const areaD = [
    `M${coords[0].x.toFixed(1)},${H}`,
    ...coords.map((pt) => `L${pt.x.toFixed(1)},${pt.y.toFixed(1)}`),
    `L${coords[coords.length - 1].x.toFixed(1)},${H}`,
    "Z",
  ].join(" ");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="none" style={{ height: 80 }}>
      <defs>
        <linearGradient id="spGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={areaD} fill="url(#spGrad)" />
      <path d={pathD} fill="none" stroke="#3b82f6" strokeWidth="1.2" />
    </svg>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [pl,       setPl]       = useState<PipelineData | null>(null);
  const [jobs,     setJobs]     = useState<JobStat[]>([]);
  const [loading,  setLoading]  = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [ovRes, plRes, jobRes] = await Promise.all([
        fetch("/api/analytics/overview"),
        fetch("/api/analytics/pipeline"),
        fetch("/api/analytics/jobs"),
      ]);
      const [ov, plData, jb] = await Promise.all([ovRes.json(), plRes.json(), jobRes.json()]);
      if (ov.success)     setOverview(ov.data);
      if (plData.success) setPl(plData.data);
      if (jb.success)     setJobs(jb.data ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
      </div>
    );
  }

  const ov = overview;

  const funnelData = (pl?.pipeline ?? []).map((s) => ({
    label: s.label,
    value: s.count,
    color: s.stage === "hired"       ? "bg-green-500"
         : s.stage === "rejected"    ? "bg-red-400"
         : s.stage === "shortlisted" ? "bg-primary-500"
         : "bg-neutral-400",
  }));
  const funnelMax    = Math.max(...(pl?.pipeline ?? []).map((s) => s.count), 1);
  const recentCount  = (pl?.timeline ?? []).slice(-7).reduce((s, p) => s + p.count, 0);
  const noScores     = (pl?.score_distribution ?? []).every((b) => b.count === 0);
  const noTimeline   = (pl?.timeline ?? []).every((p) => p.count === 0);

  return (
    <div className="max-w-7xl mx-auto space-y-6">

      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">אנליטיקס</h1>
        <p className="text-neutral-500 mt-0.5 text-sm">סקירת ביצועים וצינור גיוס</p>
      </div>

      {/* Main KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard icon={Users}     label="מועמדים סה״כ"  value={ov?.candidates.total ?? 0} sub={`${ov?.candidates.active ?? 0} פעילים`} />
        <KPICard icon={Briefcase} label="משרות פעילות"  value={ov?.jobs.active ?? 0}      sub={`${ov?.jobs.total ?? 0} סה״כ`} />
        <KPICard
          icon={TrendingUp} label="שיעור המרה" value={`${ov?.conversion_rate ?? 0}%`}
          sub={`${ov?.candidates.hired ?? 0} התקבלו`}
          color={(ov?.conversion_rate ?? 0) >= 10 ? "text-green-600" : (ov?.conversion_rate ?? 0) >= 5 ? "text-amber-600" : "text-neutral-900"}
        />
        <KPICard
          icon={Star} label="ציון AI ממוצע" value={ov?.ai.avg_score != null ? `${ov.ai.avg_score}/100` : "—"}
          sub={ov?.ai.scored_count ? `${ov.ai.scored_count} מועמדים` : "אין ניתוח"}
          color={(ov?.ai.avg_score ?? 0) >= 70 ? "text-green-600" : (ov?.ai.avg_score ?? 0) >= 50 ? "text-amber-600" : "text-neutral-900"}
        />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: MessageSquare, color: "text-blue-500",   value: ov?.ai.whatsapp_interviews ?? 0, label: "ריאיונות WhatsApp" },
          { icon: Award,         color: "text-purple-500", value: ov?.ai.assignments_sent ?? 0,   label: "מטלות נשלחו" },
          { icon: CheckCircle,   color: "text-green-500",  value: ov?.candidates.shortlisted ?? 0, label: "מועמדים מועדפים" },
          { icon: Clock,         color: "text-amber-500",  value: recentCount,                     label: "הגשות ב-7 ימים" },
        ].map(({ icon: Icon, color, value, label }) => (
          <Card padding="sm" key={label}>
            <div className="flex items-center gap-3">
              <Icon className={`w-5 h-5 flex-shrink-0 ${color}`} />
              <div>
                <p className="text-lg font-bold text-neutral-900">{value}</p>
                <p className="text-xs text-neutral-500">{label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <h3 className="text-sm font-semibold text-neutral-700 mb-4">צינור גיוס</h3>
          {funnelData.length === 0
            ? <p className="text-neutral-400 text-sm text-center py-8">אין נתונים</p>
            : <HBarChart data={funnelData} maxValue={funnelMax} />
          }
        </Card>

        <Card>
          <h3 className="text-sm font-semibold text-neutral-700 mb-2">התפלגות ציון AI</h3>
          {noScores
            ? <p className="text-neutral-400 text-sm text-center py-8">אין ציונים עדיין</p>
            : <ScoreDistChart buckets={pl?.score_distribution ?? []} />
          }
          {!noScores && <p className="text-xs text-neutral-400 mt-2 text-center">ציון 0–100</p>}
        </Card>

        <Card>
          <h3 className="text-sm font-semibold text-neutral-700 mb-1">הגשות — 30 ימים</h3>
          {noTimeline
            ? <p className="text-neutral-400 text-sm text-center py-8">אין הגשות</p>
            : (
              <>
                <Sparkline points={pl?.timeline ?? []} />
                <div className="flex justify-between text-xs text-neutral-400 mt-1">
                  <span>{(pl?.timeline ?? [])[0]?.date?.slice(5) ?? ""}</span>
                  <span>{(pl?.timeline ?? []).at(-1)?.date?.slice(5) ?? ""}</span>
                </div>
              </>
            )
          }
        </Card>
      </div>

      {/* Jobs table */}
      <Card padding="none">
        <div className="px-5 py-4 border-b border-neutral-100">
          <h3 className="text-sm font-semibold text-neutral-700">ביצועים לפי משרה</h3>
        </div>
        {jobs.length === 0 ? (
          <p className="text-neutral-400 text-sm text-center py-8">אין משרות</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50">
                  <th className="text-right font-medium text-neutral-500 px-5 py-3">משרה</th>
                  <th className="text-right font-medium text-neutral-500 px-4 py-3">מחלקה</th>
                  <th className="text-right font-medium text-neutral-500 px-4 py-3">סטטוס</th>
                  <th className="text-center font-medium text-neutral-500 px-4 py-3">מועמדים</th>
                  <th className="text-center font-medium text-neutral-500 px-4 py-3">מועדפים</th>
                  <th className="text-center font-medium text-neutral-500 px-4 py-3">התקבלו</th>
                  <th className="text-center font-medium text-neutral-500 px-4 py-3">ציון ממוצע</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-5 py-3 font-medium text-neutral-900">{job.title}</td>
                    <td className="px-4 py-3 text-neutral-500 text-xs">{job.department ?? "—"}</td>
                    <td className="px-4 py-3">
                      <Badge variant={job.status === "active" ? "success" : "neutral"}>
                        {job.status === "active" ? "פעיל" : job.status === "paused" ? "מושהה" : "סגור"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-center font-medium">{job.total}</td>
                    <td className="px-4 py-3 text-center text-primary-600 font-medium">{job.shortlisted}</td>
                    <td className="px-4 py-3 text-center text-green-600 font-medium">{job.hired}</td>
                    <td className="px-4 py-3 text-center">
                      {job.avg_score != null ? (
                        <span className={`font-semibold ${
                          job.avg_score >= 70 ? "text-green-600"
                          : job.avg_score >= 50 ? "text-amber-600"
                          : "text-red-500"
                        }`}>{job.avg_score}</span>
                      ) : (
                        <span className="text-neutral-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
