// ==================================================
// API — POST /api/interview/start
// ==================================================
// Called by the landing page when a candidate submits their details and CV.
// Creates a session and returns its token; the browser then navigates to
// /chat/<token>.
//
// Public and unauthenticated by necessity — candidates have no account.
// That makes it the most exposed write path in the system, so: rate
// limited, size capped, and every piece of candidate text sanitised before
// it can reach a model.

import { NextRequest, NextResponse } from "next/server";
import { apiSuccess, apiError } from "@/lib/utils";
import { checkRateLimit } from "@/lib/security/rate-limiter";
import { sanitizeCvText } from "@/lib/security/prompt-safety";
import { extractCvText } from "@/lib/interview/cv-text";
import {
  newSessionToken, saveDemoSession, type InterviewSession,
} from "@/lib/interview/session";

const MAX_CV_BYTES = 5 * 1024 * 1024;

function isDemo(req: NextRequest) {
  return process.env.NEXT_PUBLIC_DEMO_MODE?.trim() === "true" || req.cookies.has("hr-demo");
}

function getIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim()
    ?? req.headers.get("x-real-ip")
    ?? "unknown";
}

export async function POST(req: NextRequest) {
  // Starting an interview costs money — every session runs model calls —
  // so the limit is deliberately tight.
  const rl = checkRateLimit({ key: "interview-start", id: getIp(req), limit: 5, windowSec: 3600 });
  if (!rl.allowed) {
    return NextResponse.json(
      apiError("יותר מדי בקשות. נסה שוב בעוד שעה."),
      { status: 429 }
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json(apiError("בקשה לא תקינה"), { status: 400 });
  }

  const code      = String(form.get("code") ?? "").trim().toUpperCase();
  const full_name = String(form.get("full_name") ?? "").trim();
  const phone     = String(form.get("phone") ?? "").trim();
  const email     = String(form.get("email") ?? "").trim();
  const cv        = form.get("cv");

  if (!/^[A-Z0-9]{3,12}$/.test(code)) return NextResponse.json(apiError("קוד קמפיין לא תקין"), { status: 400 });
  if (full_name.length < 2)           return NextResponse.json(apiError("נא להזין שם מלא"), { status: 400 });
  if (phone.replace(/\D/g, "").length < 9) return NextResponse.json(apiError("מספר טלפון לא תקין"), { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json(apiError("כתובת מייל לא תקינה"), { status: 400 });

  if (!(cv instanceof File)) return NextResponse.json(apiError("נא לצרף קורות חיים"), { status: 400 });
  if (cv.size > MAX_CV_BYTES) return NextResponse.json(apiError("הקובץ גדול מ-5MB"), { status: 400 });

  // ── CV text ────────────────────────────────────────────────────────
  // A failure to read the file must not block the interview: the agent can
  // still ask about experience, it just cannot cite specifics.
  let cvText = "";
  let cvWarning: string | null = null;
  try {
    cvText = await extractCvText(cv);
  } catch {
    cvWarning = "לא הצלחנו לקרוא את הקובץ. הסוכן ישאל על הניסיון בשיחה.";
  }

  const sanitized = sanitizeCvText(cvText);

  // ── Job + agent config ─────────────────────────────────────────────
  const config = await loadConfig(req, code);
  if (!config) return NextResponse.json(apiError("הקמפיין לא נמצא או הסתיים"), { status: 404 });

  const token = newSessionToken();
  const session: InterviewSession = {
    token,
    campaignCode: code,
    jobId:        config.jobId,
    candidate:    { full_name, phone, email },
    cvText:       sanitized.text,
    cvFileName:   cv.name,
    agent:        config.agent,
    job:          config.job,
    turns:        [],
    // Signals from the CV are recorded at session start so a hidden
    // instruction is visible to a reviewer even if the chat looks normal.
    flags:        sanitized.signals.map(s => ({ ...s, at: new Date().toISOString() })),
    startedAt:    new Date().toISOString(),
    endedAt:      null,
  };

  if (isDemo(req)) {
    saveDemoSession(session);
  } else {
    // Real persistence lands with the Supabase wiring; refusing here is
    // better than silently dropping a real candidate's interview.
    return NextResponse.json(
      apiError("הריאיון זמין כרגע במצב דמו בלבד"),
      { status: 503 }
    );
  }

  return NextResponse.json(apiSuccess({
    session_token: token,
    cv_warning:    cvWarning,
  }), { status: 201 });
}

/**
 * Resolve the campaign code to the job and agent settings.
 *
 * The code is unused in the demo branch, which serves a single fixture
 * job. It becomes the lookup key once campaigns are read from the database.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function loadConfig(req: NextRequest, code: string) {
  if (isDemo(req)) {
    const { DEMO_JOBS } = await import("@/lib/demo/mock-data");
    const job = DEMO_JOBS[0];
    if (!job) return null;

    return {
      jobId: job.id,
      agent: {
        persona_name:  "עמי",
        tone:          "friendly",
        objective:     "לוודא שהמועמד באמת עבד עם הכלים שרשם, ולא רק שמע עליהם. לבדוק עומק אמיתי.",
        guidelines:    "אל תדון בשכר. אם המועמד שואל, אמור שזה ייסגר בשלב הבא.",
        max_questions: 6,
      },
      job: {
        title:               job.title,
        description:         job.description,
        requirements:        job.requirements ?? [],
        screening_questions: [],
        ai_instructions:     null,
      },
    };
  }
  return null;
}
