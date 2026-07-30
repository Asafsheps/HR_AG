// API — /api/apply/[slug]  (public — no auth, rate-limited)
// POST — submit candidate application

import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  // Parse body
  let body: Record<string, string> = {};
  try {
    const ct = request.headers.get("content-type") ?? "";
    if (ct.includes("application/json")) {
      body = await request.json();
    } else {
      const fd = await request.formData();
      fd.forEach((val, key) => { if (typeof val === "string") body[key] = val; });
    }
  } catch { /* empty */ }

  const { full_name, email, phone } = body;
  if (!full_name || !email || !phone) {
    return NextResponse.json({ success: false, error: "נא למלא שם, מייל וטלפון" }, { status: 400 });
  }

  const { DEMO_JOBS } = await import("@/lib/demo/mock-data");
  const job = DEMO_JOBS.find(j => j.slug === slug || j.id === slug);

  if (!job) {
    return NextResponse.json({ success: false, error: "משרה לא נמצאה" }, { status: 404 });
  }

  // Build WhatsApp deep-link
  const waNum = (job.whatsapp_bot_number ?? "").replace(/\D/g, "");
  const greeting = encodeURIComponent(
    `שלום! שמי ${full_name}. הגשתי מועמדות למשרת "${job.title}" ואני מוכן/ה לשיחה עם הבוט.`
  );
  const whatsapp_url = waNum ? `https://wa.me/${waNum}?text=${greeting}` : null;

  return NextResponse.json({
    success: true,
    data: {
      candidate_id: `demo-new-${Date.now()}`,
      job_title: job.title,
      whatsapp_url,
      message: "המועמדות התקבלה! שלב הבא — שיחה עם הבוט שלנו בוואטסאפ.",
    },
  });
}
