"use client";

// ==================================================
// /jobs/[jobId]/edit
// ==================================================
// This route did not exist. The "עריכה" button on the job page linked
// here and produced a hard 404 — the first thing Asaf hit when trying to
// change a job.
//
// It renders the same JobWizard used for creation rather than a second
// form, so the two can never drift apart. The agent guidance step is part
// of the wizard, which is what makes a job's interview editable at all.

import { useEffect, useState, use } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import JobWizard, { type JobWizardInitial } from "@/components/jobs/JobWizard";

export default function EditJobPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = use(params);

  const [initial, setInitial] = useState<JobWizardInitial | null>(null);
  const [error, setError]     = useState("");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res  = await fetch(`/api/jobs/${jobId}`);
        const data = await res.json();
        if (cancelled) return;

        if (!data.success) {
          setError(data.error ?? "לא ניתן לטעון את המשרה");
          return;
        }

        const job = data.data;
        setInitial({
          id:                       job.id,
          title:                    job.title,
          department:               job.department,
          location:                 job.location,
          employment_type:          job.employment_type,
          description:              job.description,
          requirements:             job.requirements,
          culture_fit_expectations: job.culture_fit_expectations,
          screening_questions:      job.screening_questions,
          rejection_rules:          job.rejection_rules,
          ai_instructions:          job.ai_instructions,
          // The job may carry a joined agent_profiles row. Absent is fine:
          // the wizard falls back to its defaults.
          agent:                    job.agent_profiles ?? null,
        });
      } catch {
        if (!cancelled) setError("שגיאת רשת בטעינת המשרה");
      }
    })();

    return () => { cancelled = true; };
  }, [jobId]);

  if (error) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (!initial) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-primary-600 animate-spin" />
      </div>
    );
  }

  return <JobWizard initial={initial} />;
}
