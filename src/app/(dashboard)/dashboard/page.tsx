import Link from "next/link";
import { Briefcase, Users, MessageSquare, TrendingUp } from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { formatDate } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "דשבורד" };

// Demo data — יוחלף בנתוני Supabase ב-Phase 10
const STATS = [
  { title: "משרות פעילות",   value: 8,   subtitle: "מתוך 12 סה״כ",    icon: <Briefcase className="w-5 h-5" />, trend: { value: 2, label: "מהחודש שעבר" } },
  { title: "מועמדים חדשים",  value: 47,  subtitle: "השבוע",           icon: <Users className="w-5 h-5" />,     trend: { value: 18, label: "מהשבוע שעבר" } },
  { title: "ריאיונות WhatsApp", value: 23, subtitle: "בתהליך",        icon: <MessageSquare className="w-5 h-5" />, trend: { value: 5, label: "מאתמול" } },
  { title: "שיעור המרה",     value: "34%", subtitle: "מועמד → ריאיון", icon: <TrendingUp className="w-5 h-5" />, trend: { value: -3, label: "מהחודש שעבר" } },
];

const RECENT_CANDIDATES = [
  { id: "1", name: "דניאל כהן",    job: "Data Analyst",      status: "screening",          score: 82, time: new Date().toISOString() },
  { id: "2", name: "מיכל לוי",     job: "Frontend Developer", status: "whatsapp_interview", score: 75, time: new Date().toISOString() },
  { id: "3", name: "אמיר שפירא",   job: "Product Manager",   status: "shortlisted",         score: 91, time: new Date().toISOString() },
  { id: "4", name: "שירה גולדברג",  job: "UX Designer",       status: "new",                score: null, time: new Date().toISOString() },
  { id: "5", name: "יוסי אברהם",   job: "Data Analyst",      status: "rejected",            score: 38, time: new Date().toISOString() },
];

const ACTIVE_JOBS = [
  { id: "1", title: "Data Analyst",       candidates: 14, new: 3, status: "active" },
  { id: "2", title: "Frontend Developer", candidates: 9,  new: 1, status: "active" },
  { id: "3", title: "Product Manager",    candidates: 18, new: 5, status: "active" },
  { id: "4", title: "UX Designer",        candidates: 6,  new: 0, status: "paused" },
];

const STATUS_BADGES: Record<string, { label: string; variant: "neutral"|"info"|"success"|"danger"|"warning" }> = {
  new:                 { label: "חדש",            variant: "neutral" },
  screening:           { label: "סינון",           variant: "info" },
  whatsapp_interview:  { label: "ריאיון WA",       variant: "info" },
  shortlisted:         { label: "מועדף",           variant: "success" },
  rejected:            { label: "נדחה",            variant: "danger" },
  under_review:        { label: "בבחינה",          variant: "warning" },
};

const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export default function DashboardPage() {
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "בוקר טוב" : hour < 17 ? "צהריים טובים" : "ערב טוב";

  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      {/* Demo banner */}
      {isDemo && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-center gap-3 text-sm">
          <span className="text-lg">🎭</span>
          <div>
            <span className="font-medium text-amber-800">מצב Demo — </span>
            <span className="text-amber-700">מוצגים נתונים לדוגמה. כדי לראות נתונים אמיתיים, חבר Supabase ב-<code className="font-mono text-xs bg-amber-100 px-1 rounded">.env.local</code></span>
          </div>
        </div>
      )}

      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">{greeting} 👋</h1>
        <p className="text-neutral-500 mt-1">{formatDate(now)} · הנה מה שקורה היום</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {STATS.map((s) => (
          <StatCard key={s.title} {...s} />
        ))}
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Recent candidates */}
        <div className="lg:col-span-2">
          <Card padding="none">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
              <h2 className="font-semibold text-neutral-900">מועמדים אחרונים</h2>
              <Link href="/candidates" className="text-sm text-primary-600 hover:text-primary-700">
                הצג הכל
              </Link>
            </div>
            <div className="divide-y divide-neutral-100">
              {RECENT_CANDIDATES.map((c) => {
                const badge = STATUS_BADGES[c.status] ?? { label: c.status, variant: "neutral" as const };
                return (
                  <div key={c.id} className="flex items-center gap-4 px-6 py-3 hover:bg-neutral-50 transition-colors">
                    <Avatar name={c.name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-900 truncate">{c.name}</p>
                      <p className="text-xs text-neutral-500 truncate">{c.job}</p>
                    </div>
                    <Badge variant={badge.variant}>{badge.label}</Badge>
                    {c.score !== null ? (
                      <span className={`text-sm font-semibold w-10 text-right ${
                        c.score >= 80 ? "text-green-600" : c.score >= 55 ? "text-amber-600" : "text-red-600"
                      }`}>
                        {c.score}
                      </span>
                    ) : (
                      <span className="w-10 text-right text-xs text-neutral-400">—</span>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Active jobs */}
        <div>
          <Card padding="none">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
              <h2 className="font-semibold text-neutral-900">משרות פעילות</h2>
              <Link href="/jobs" className="text-sm text-primary-600 hover:text-primary-700">
                הצג הכל
              </Link>
            </div>
            <div className="divide-y divide-neutral-100">
              {ACTIVE_JOBS.map((j) => (
                <div key={j.id} className="flex items-center gap-3 px-6 py-3 hover:bg-neutral-50 transition-colors">
                  <div className="w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Briefcase className="w-4 h-4 text-primary-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-900 truncate">{j.title}</p>
                    <p className="text-xs text-neutral-500">
                      {j.candidates} מועמדים
                      {j.new > 0 && <span className="text-primary-600 ml-1">· {j.new} חדשים</span>}
                    </p>
                  </div>
                  <Badge variant={j.status === "active" ? "success" : "warning"}>
                    {j.status === "active" ? "פעיל" : "מושהה"}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
