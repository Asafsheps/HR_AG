import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { MapPin, Users, Calendar, Edit } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "פרטי משרה" };

// Demo — יוחלף ב-Supabase fetch ב-Phase 10
const DEMO_JOB = {
  id: "1", title: "Data Analyst", department: "BI", location: "תל אביב",
  status: "active", employment_type: "full_time", description:
    "אנחנו מחפשים Data Analyst מוכשר להצטרף לצוות ה-BI שלנו.\n\nהתפקיד כולל עבודה עם נתונים גדולים, בניית דשבורדים ב-Tableau ו-Power BI, וחיבור עם צוותי המוצר והפיתוח.",
  requirements: ["3+ שנות ניסיון בניתוח נתונים", "Python / SQL ברמה גבוהה", "ניסיון עם Tableau או Power BI", "יכולת הצגה בפני הנהלה"],
  candidates: 14, created_at: "2026-05-01",
  screening_questions: [
    { question: "כמה שנות ניסיון יש לך בSQL?", type: "numeric", weight: 9 },
    { question: "האם עבדת עם Tableau?", type: "yes_no", weight: 7 },
  ],
  rejection_rules: [
    { field: "experience_years", operator: "less_than", value: 2, reason: "ניסיון מינימלי נדרש: 2 שנים" },
  ],
};

const STATUS_MAP: Record<string, { label: string; variant: "success"|"warning"|"neutral"|"danger" }> = {
  active: { label: "פעיל", variant: "success" }, draft: { label: "טיוטה", variant: "neutral" },
  paused: { label: "מושהה", variant: "warning" }, closed: { label: "סגור", variant: "danger" },
};

export default function JobDetailPage() {
  const job    = DEMO_JOB;
  const status = STATUS_MAP[job.status] ?? { label: job.status, variant: "neutral" as const };

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
            <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{job.location}</span>
            <span>{job.department}</span>
            <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{job.candidates} מועמדים</span>
            <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{job.created_at}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <a href={`/jobs/${job.id}/edit`}>
            <Button variant="secondary" size="sm"><Edit className="w-4 h-4" />עריכה</Button>
          </a>
          <a href={`/candidates?job=${job.id}`}>
            <Button size="sm"><Users className="w-4 h-4" />מועמדים</Button>
          </a>
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
            <ul className="space-y-2">
              {job.requirements.map((r, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-neutral-700">
                  <span className="w-1.5 h-1.5 bg-primary-500 rounded-full mt-2 flex-shrink-0" />
                  {r}
                </li>
              ))}
            </ul>
          </Card>

          {/* Screening questions */}
          <Card>
            <h2 className="font-semibold text-neutral-900 mb-3">שאלות סינון ({job.screening_questions.length})</h2>
            <div className="space-y-3">
              {job.screening_questions.map((q, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                  <p className="text-sm text-neutral-700">{q.question}</p>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                    <Badge variant="info">{q.type === "numeric" ? "מספרי" : q.type === "yes_no" ? "כן/לא" : "פתוחה"}</Badge>
                    <span className="text-xs text-neutral-400">משקל: {q.weight}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          <Card>
            <h3 className="font-semibold text-neutral-900 mb-3 text-sm">סטטיסטיקות</h3>
            <div className="space-y-3">
              {[
                { label: "סה״כ מועמדים", value: job.candidates },
                { label: "בסינון", value: 4 },
                { label: "בריאיון WA", value: 3 },
                { label: "מועדפים", value: 2 },
              ].map(s => (
                <div key={s.label} className="flex justify-between text-sm">
                  <span className="text-neutral-500">{s.label}</span>
                  <span className="font-semibold text-neutral-900">{s.value}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h3 className="font-semibold text-neutral-900 mb-3 text-sm">חוקי דחייה ({job.rejection_rules.length})</h3>
            {job.rejection_rules.map((r, i) => (
              <div key={i} className="p-2 bg-red-50 rounded text-xs text-red-700">
                {r.reason}
              </div>
            ))}
          </Card>

          <Card>
            <h3 className="font-semibold text-neutral-900 mb-3 text-sm">קישור למועמדים</h3>
            <p className="text-xs text-neutral-500 mb-2">שתף קישור זה עם המועמדים:</p>
            <code className="block text-xs bg-neutral-50 border border-neutral-200 rounded p-2 break-all text-neutral-600">
              {`/candidate/${job.id}`}
            </code>
            <Button variant="secondary" size="sm" className="w-full mt-3">העתק קישור</Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
