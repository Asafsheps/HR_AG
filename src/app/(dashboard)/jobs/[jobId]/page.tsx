"use client";

// ==================================================
// Job detail — real data
// ==================================================
// Replaces a hardcoded fixture that rendered the same invented "Data
// Analyst (Tableau/Power BI)" for every jobId — which meant a recruiter
// who just created a job saw someone else's text on the very next screen.
// Everything here now comes from /api/jobs/[id], plus the job's campaigns
// so the landing link is one click away.

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  MapPin, Users, Calendar, Edit, Loader2, Megaphone, Copy, Check,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface ScreeningQuestion { question: string; type?: string; weight?: number; }

interface JobDetail {
  id: string;
  title: string;
  department: string | null;
  location: string | null;
  status: string;
  employment_type: string | null;
  description: string;
  requirements: string[] | null;
  screening_questions: ScreeningQuestion[] | null;
  ai_instructions: string | null;
  created_at: string;
}

interface CampaignRow {
  id: string;
  code: string;
  channel: string;
  landing_url: string;
  is_active: boolean;
  conversations: number;
  jobs: { id: string } | null;
}

const STATUS_MAP: Record<string, { label: string; variant: "success"|"warning"|"neutral"|"danger" }> = {
  active: { label: "פעיל", variant: "success" }, draft: { label: "טיוטה", variant: "neutral" },
  paused: { label: "מושהה", variant: "warning" }, closed: { label: "סגור", variant: "danger" },
  archived: { label: "ארכיון", variant: "neutral" },
};

export default function JobDetailPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = use(params);

  const [job, setJob]             = useState<JobDetail | null>(null);
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [copied, setCopied]       = useState("");

  useEffect(() => {
    fetch(`/api/jobs/${jobId}`)
      .then(r => r.json())
      .then(d => {
        if (d.success) setJob(d.data);
        else setError(d.error ?? "המשרה לא נמצאה");
      })
      .catch(() => setError("שגיאת רשת — נסה לרענן"))
      .finally(() => setLoading(false));

    fetch("/api/campaigns")
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setCampaigns((d.data.campaigns as CampaignRow[]).filter(c => c.jobs?.id === jobId));
        }
      })
      .catch(() => {});
  }, [jobId]);

  function copyLink(c: CampaignRow) {
    navigator.clipboard.writeText(c.landing_url).then(() => {
      setCopied(c.id);
      setTimeout(() => setCopied(""), 2000);
    });
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="w-6 h-6 text-primary-600 animate-spin" />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <p className="text-sm text-red-600 text-center py-8">{error || "המשרה לא נמצאה"}</p>
        </Card>
      </div>
    );
  }

  const status = STATUS_MAP[job.status] ?? { label: job.status, variant: "neutral" as const };
  const questions = job.screening_questions ?? [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-semibold text-neutral-900">{job.title}</h1>
            <Badge variant={status.variant}>{status.label}</Badge>
          </div>
          <div className="flex items-center gap-4 text-sm text-neutral-500">
            {job.location && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{job.location}</span>}
            {job.department && <span>{job.department}</span>}
            <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{formatDate(job.created_at)}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/jobs/${job.id}/edit`}>
            <Button variant="secondary" size="sm"><Edit className="w-4 h-4" />עריכה</Button>
          </Link>
          <Link href={`/candidates?job=${job.id}`}>
            <Button size="sm"><Users className="w-4 h-4" />מועמדים</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-5">

          {/* Description */}
          <Card>
            <h2 className="font-semibold text-neutral-900 mb-3">תיאור המשרה</h2>
            <p className="text-sm text-neutral-700 whitespace-pre-line leading-relaxed">{job.description}</p>
          </Card>

          {/* Requirements */}
          <Card>
            <h2 className="font-semibold text-neutral-900 mb-3">דרישות</h2>
            {(job.requirements?.length ?? 0) === 0 ? (
              <p className="text-sm text-neutral-400">לא הוגדרו דרישות</p>
            ) : (
              <ul className="space-y-2">
                {job.requirements!.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-neutral-700">
                    <span className="w-1.5 h-1.5 bg-primary-500 rounded-full mt-2 flex-shrink-0" />
                    {r}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Screening questions */}
          <Card>
            <h2 className="font-semibold text-neutral-900 mb-3">שאלות סינון ({questions.length})</h2>
            {questions.length === 0 ? (
              <p className="text-sm text-neutral-400">לא הוגדרו שאלות — הסוכן ישאל לפי הדרישות</p>
            ) : (
              <div className="space-y-3">
                {questions.map((q, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                    <p className="text-sm text-neutral-700">{q.question}</p>
                    {typeof q.weight === "number" && (
                      <span className="text-xs text-neutral-400 flex-shrink-0 mr-4">משקל: {q.weight}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Recruiter guidance for the agent */}
          {job.ai_instructions && (
            <Card>
              <h2 className="font-semibold text-neutral-900 mb-3">דגשים לסוכן</h2>
              <p className="text-sm text-neutral-700 whitespace-pre-line">{job.ai_instructions}</p>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          <Card>
            <h3 className="font-semibold text-neutral-900 mb-3 text-sm flex items-center gap-1.5">
              <Megaphone className="w-4 h-4" />
              קמפיינים ({campaigns.length})
            </h3>
            {campaigns.length === 0 ? (
              <div className="space-y-3">
                <p className="text-xs text-neutral-500">
                  אין עדיין קמפיין למשרה — צור אחד כדי לקבל לינק לפרסום.
                </p>
                <Link href="/campaigns">
                  <Button variant="secondary" size="sm" className="w-full">צור קמפיין</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {campaigns.map(c => (
                  <div key={c.id} className="p-2.5 bg-neutral-50 rounded-lg space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm font-semibold text-primary-700">{c.code}</span>
                      <Badge variant={c.is_active ? "success" : "neutral"}>
                        {c.is_active ? "פעיל" : "מושהה"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs text-neutral-500">
                      <span>{c.conversations} שיחות</span>
                      <button
                        onClick={() => copyLink(c)}
                        className="flex items-center gap-1 text-primary-600 hover:text-primary-800"
                      >
                        {copied === c.id
                          ? <><Check className="w-3.5 h-3.5" />הועתק</>
                          : <><Copy className="w-3.5 h-3.5" />העתק לינק</>}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
