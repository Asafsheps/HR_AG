"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { formatDate } from "@/lib/utils";

interface Job       { id: string; title: string }
interface Candidate {
  id: string; full_name: string; email: string; phone: string;
  status: string; ai_score: number | null; created_at: string;
  job: Job | null;
}

const STATUS_MAP: Record<string, { label: string; variant: "neutral"|"info"|"success"|"danger"|"warning"|"primary" }> = {
  new:                  { label: "חדש",          variant: "neutral"  },
  screening:            { label: "סינון",         variant: "info"     },
  whatsapp_interview:   { label: "ריאיון WA",     variant: "info"     },
  assignment_sent:      { label: "מטלה נשלחה",    variant: "warning"  },
  assignment_submitted: { label: "מטלה הוגשה",    variant: "warning"  },
  under_review:         { label: "בבחינה",        variant: "warning"  },
  shortlisted:          { label: "מועדף",         variant: "success"  },
  rejected:             { label: "נדחה",          variant: "danger"   },
  hired:                { label: "התקבל",         variant: "success"  },
  withdrawn:            { label: "נסוג",          variant: "neutral"  },
};

const STAGES = [
  { key: "",                   label: "הכל" },
  { key: "new",                label: "חדש" },
  { key: "screening",          label: "סינון" },
  { key: "whatsapp_interview", label: "ריאיון" },
  { key: "under_review",       label: "בבחינה" },
  { key: "shortlisted",        label: "מועדף" },
  { key: "rejected",           label: "נדחה" },
];

function ScorePill({ score }: { score: number | null }) {
  if (score === null) return <span className="text-neutral-400 text-xs">—</span>;
  const color = score >= 80 ? "bg-green-100 text-green-700" : score >= 55 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700";
  return (
    <span className={`inline-flex items-center justify-center w-10 h-6 rounded-full text-xs font-semibold ${color}`}>
      {score}
    </span>
  );
}

export default function CandidatesPage() {
  const router = useRouter();

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [total,      setTotal]      = useState(0);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState("");
  const [status,     setStatus]     = useState("");
  const [page,       setPage]       = useState(1);

  const LIMIT = 20;

  const load = useCallback(async (q: string, st: string, pg: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        q: q, status: st, page: String(pg), limit: String(LIMIT),
      });
      const res  = await fetch(`/api/candidates/list?${params}`);
      const json = await res.json();
      if (json.success) {
        setCandidates(json.data.candidates ?? []);
        setTotal(json.data.total ?? 0);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => load(search, status, page), 300);
    return () => clearTimeout(t);
  }, [search, status, page, load]);

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">מועמדים</h1>
          <p className="text-neutral-500 mt-0.5">{total} מועמדים סה״כ</p>
        </div>
      </div>

      {/* Filters */}
      <Card padding="sm">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="חיפוש לפי שם, מייל..."
              className="w-full pr-9 pl-3 py-2 text-sm border border-neutral-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {STAGES.map((s) => (
              <button
                key={s.key}
                onClick={() => { setStatus(s.key); setPage(1); }}
                className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${
                  status === s.key
                    ? "bg-primary-600 text-white border-primary-600"
                    : "bg-white text-neutral-600 border-neutral-200 hover:border-primary-300"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card padding="none">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
          </div>
        ) : candidates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-neutral-400">
            <p className="text-sm">לא נמצאו מועמדים</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50">
                  <th className="text-right font-medium text-neutral-500 px-6 py-3">מועמד</th>
                  <th className="text-right font-medium text-neutral-500 px-4 py-3">משרה</th>
                  <th className="text-right font-medium text-neutral-500 px-4 py-3">שלב</th>
                  <th className="text-right font-medium text-neutral-500 px-4 py-3">ציון AI</th>
                  <th className="text-right font-medium text-neutral-500 px-4 py-3">הגיש</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {candidates.map((c) => {
                  const st = STATUS_MAP[c.status] ?? { label: c.status, variant: "neutral" as const };
                  return (
                    <tr key={c.id} className="hover:bg-neutral-50 transition-colors cursor-pointer"
                      onClick={() => router.push(`/candidates/${c.id}`)}>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={c.full_name} size="sm" />
                          <div>
                            <p className="font-medium text-neutral-900 hover:text-primary-600 transition-colors">{c.full_name}</p>
                            <p className="text-xs text-neutral-500">{c.phone ?? c.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-neutral-600">{c.job?.title ?? "—"}</td>
                      <td className="px-4 py-3">
                        <Badge variant={st.variant}>{st.label}</Badge>
                      </td>
                      <td className="px-4 py-3"><ScorePill score={c.ai_score} /></td>
                      <td className="px-4 py-3 text-neutral-500 text-xs">{formatDate(c.created_at)}</td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" onClick={() => router.push(`/candidates/${c.id}`)}>פרופיל</Button>
                          <Button variant="secondary" size="sm" onClick={() => router.push(`/conversations?candidate=${c.id}`)}>שיחה</Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-neutral-100">
          <p className="text-sm text-neutral-500">
            מציג {Math.min((page - 1) * LIMIT + 1, total)}–{Math.min(page * LIMIT, total)} מתוך {total}
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>הקודם</Button>
            <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>הבא</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
