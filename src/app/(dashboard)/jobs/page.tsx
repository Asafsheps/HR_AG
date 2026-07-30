import { Plus, Search, MapPin, Clock, Share2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "משרות" };

// Demo data — יוחלף ב-Supabase query ב-Phase 5
const JOBS = [
  { id: "job-1", slug: "senior-fullstack-dev", title: "מפתח Full Stack בכיר", department: "Engineering", location: "תל אביב",    type: "full_time",  status: "active",  candidates: 14, created_at: "2026-05-01" },
  { id: "job-2", slug: "ux-ui-designer",       title: "מעצב UX/UI",           department: "Design",      location: "תל אביב",    type: "full_time",  status: "active",  candidates: 9,  created_at: "2026-05-03" },
  { id: "job-3", slug: "product-manager",      title: "מנהל מוצר",            department: "Product",     location: "תל אביב",    type: "full_time",  status: "active",  candidates: 18, created_at: "2026-04-28" },
  { id: "job-4", slug: "data-scientist",       title: "Data Scientist",        department: "Data",        location: "תל אביב",    type: "full_time",  status: "active",  candidates: 6,  created_at: "2026-04-20" },
  { id: "5",     slug: "",                     title: "Backend Engineer",      department: "Engineering", location: "Remote",      type: "contract",   status: "draft",   candidates: 0,  created_at: "2026-05-10" },
  { id: "6",     slug: "",                     title: "Marketing Manager",     department: "Marketing",   location: "תל אביב",    type: "full_time",  status: "closed",  candidates: 31, created_at: "2026-03-15" },
];

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

export default function JobsPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">משרות</h1>
          <p className="text-neutral-500 mt-0.5">{JOBS.length} משרות סה״כ</p>
        </div>
        <a href="/jobs/new">
          <Button size="md">
            <Plus className="w-4 h-4" />
            משרה חדשה
          </Button>
        </a>
      </div>

      {/* Filters */}
      <Card padding="sm">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              placeholder="חיפוש משרה..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-neutral-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          {["הכל", "פעיל", "מושהה", "טיוטה", "סגור"].map((f) => (
            <button
              key={f}
              className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                f === "הכל"
                  ? "bg-primary-600 text-white border-primary-600"
                  : "bg-white text-neutral-600 border-neutral-200 hover:border-primary-300"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </Card>

      {/* Jobs table */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50">
                <th className="text-right font-medium text-neutral-500 px-6 py-3">תפקיד</th>
                <th className="text-right font-medium text-neutral-500 px-4 py-3">מחלקה</th>
                <th className="text-right font-medium text-neutral-500 px-4 py-3">מיקום</th>
                <th className="text-right font-medium text-neutral-500 px-4 py-3">סוג</th>
                <th className="text-right font-medium text-neutral-500 px-4 py-3">סטטוס</th>
                <th className="text-right font-medium text-neutral-500 px-4 py-3">מועמדים</th>
                <th className="text-right font-medium text-neutral-500 px-4 py-3">נוצר</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {JOBS.map((job) => {
                const status = STATUS_MAP[job.status] ?? { label: job.status, variant: "neutral" as const };
                return (
                  <tr key={job.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-6 py-4">
                      <a href={`/jobs/${job.id}`} className="font-medium text-neutral-900 hover:text-primary-600 transition-colors">
                        {job.title}
                      </a>
                    </td>
                    <td className="px-4 py-4 text-neutral-600">{job.department}</td>
                    <td className="px-4 py-4">
                      <span className="flex items-center gap-1 text-neutral-600">
                        <MapPin className="w-3.5 h-3.5" />
                        {job.location}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-neutral-600">{TYPE_MAP[job.type]}</td>
                    <td className="px-4 py-4">
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </td>
                    <td className="px-4 py-4 text-neutral-600">{job.candidates}</td>
                    <td className="px-4 py-4">
                      <span className="flex items-center gap-1 text-neutral-500 text-xs">
                        <Clock className="w-3.5 h-3.5" />
                        {formatDate(job.created_at)}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        {job.slug && job.status === "active" && (
                          <a href={`/jobs/${job.id}/distribute`}>
                            <Button variant="ghost" size="sm">
                              <Share2 className="w-3.5 h-3.5" />
                              הפץ
                            </Button>
                          </a>
                        )}
                        <a href={`/jobs/${job.id}`}>
                          <Button variant="ghost" size="sm">פתח</Button>
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
