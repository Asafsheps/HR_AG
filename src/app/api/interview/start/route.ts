// ==================================================
// API — POST /api/interview/start
// ==================================================
// Called by the landing page when a candidate submits their details and CV.
// Creates the candidate and the interview session, then returns an opaque
// token; the browser navigates to /chat/<token>.
//
// Public and unauthenticated by necessity — candidates have no account.
// That makes it the most exposed write path in the system, so: rate
// limited, size capped, every piece of candidate text sanitised before it
// can reach a model, and all database writes done here with the service
// role rather than by granting the public write access (migration 018).

import { NextRequest, NextResponse } from "next/server";
import { apiSuccess, apiError } from "@/lib/utils";
import { checkRateLimit } from "@/lib/security/rate-limiter";
import { sanitizeCvText } from "@/lib/security/prompt-safety";
import { extractCvText } from "@/lib/interview/cv-text";
import { newSessionToken } from "@/lib/interview/session";
import { loadCampaignConfig, createSession, bumpConversions } from "@/lib/interview/store";

const MAX_CV_BYTES = 5 * 1024 * 1024;

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
    return NextResponse.json(apiError("יותר מדי בקשות. נסה שוב בעוד שעה."), { status: 429 });
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

  if (!/^[A-Z0-9]{3,12}$/.test(code))            return NextResponse.json(apiError("קוד קמפיין לא תקין"), { status: 400 });
  if (full_name.length < 2)                      return NextResponse.json(apiError("נא להזין שם מלא"), { status: 400 });
  if (phone.replace(/\D/g, "").length < 9)       return NextResponse.json(apiError("מספר טלפון לא תקין"), { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json(apiError("כתובת מייל לא תקינה"), { status: 400 });
  if (!(cv instanceof File))                     return NextResponse.json(apiError("נא לצרף קורות חיים"), { status: 400 });
  if (cv.size > MAX_CV_BYTES)                    return NextResponse.json(apiError("הקובץ גדול מ-5MB"), { status: 400 });

  const config = await loadCampaignConfig(code);
  if (!config) return NextResponse.json(apiError("הקמפיין לא נמצא או הסתיים"), { status: 404 });

  // ── CV text ────────────────────────────────────────────────────────
  // A failure to read the file must not block the interview: a scanned PDF
  // has no text layer, which is innocent and common. The agent can still
  // ask about experience, it just cannot cite specifics.
  let cvText = "";
  let cvWarning: string | null = null;
  try {
    cvText = await extractCvText(cv);
  } catch {
    cvWarning = "לא הצלחנו לקרוא את הקובץ. הסוכן ישאל על הניסיון בשיחה.";
  }

  const sanitized = sanitizeCvText(cvText);
  const token = newSessionToken();

  try {
    await createSession({
      sessionToken:   token,
      campaignId:     config.campaignId,
      organizationId: config.organizationId,
      jobId:          config.jobId,
      fullName:       full_name,
      phone,
      email,
      cvText:         sanitized.text,
      // Signals from the CV are recorded at session start so a hidden
      // instruction is visible to a reviewer even if the chat looks normal.
      flags:          sanitized.signals,
    });
  } catch (e) {
    // Do not leak database detail to a candidate.
    console.error("[interview] createSession failed:", e);
    return NextResponse.json(apiError("תקלה בשמירת הפרטים. נסה שוב."), { status: 500 });
  }

  // Count the conversion in-process. An HTTP call back to our own server
  // would add a round trip and a failure mode for a counter bump.
  // A counter failure must never fail an interview, hence the catch.
  await bumpConversions(code).catch(() => {});

  return NextResponse.json(apiSuccess({
    session_token: token,
    cv_warning:    cvWarning,
  }), { status: 201 });
}
