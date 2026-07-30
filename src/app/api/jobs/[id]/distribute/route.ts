// API Route — /api/jobs/[id]/distribute
// GET — distribution stats for a job

import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { DEMO_JOBS } = await import("@/lib/demo/mock-data");
  const job = DEMO_JOBS.find(j => j.id === id || j.slug === id);

  if (!job) {
    return NextResponse.json({ success: false, error: "לא נמצא" }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    data: {
      job_id:    job.id,
      slug:      job.slug,
      title:     job.title,
      apply_views:       job.apply_views,
      apply_starts:      job.apply_starts,
      apply_submissions: job.apply_submissions,
      conversion_rate: job.apply_views
        ? Math.round((job.apply_submissions / job.apply_views) * 100)
        : 0,
      channels: [
        { name: "LinkedIn",   clicks: 184, submissions: 28, icon: "linkedin"  },
        { name: "Facebook",   clicks: 73,  submissions: 11, icon: "facebook"  },
        { name: "WhatsApp",   clicks: 31,  submissions: 6,  icon: "whatsapp"  },
        { name: "קישור ישיר", clicks: 24,  submissions: 2,  icon: "link"      },
      ],
    },
  });
}
