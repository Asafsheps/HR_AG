// ==================================================
// Webhook — Twilio WhatsApp inbound
// POST /api/webhooks/whatsapp/twilio
// ==================================================
// Twilio sends a form-encoded POST for every inbound message.
// We verify the X-Twilio-Signature header (when TWILIO_AUTH_TOKEN is set),
// run the AI agent, then reply with TwiML.
// ==================================================

import { NextRequest, NextResponse } from "next/server";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import { parseTwilioWebhook } from "@/lib/whatsapp/providers/twilio";
import { processInboundMessage } from "@/lib/ai/agents/recruiter-agent";

// Twilio expects a 200 + TwiML (or empty) — never a 4xx, or it retries.
function twimlResponse(body?: string): NextResponse {
  const xml = body
    ? `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${body}</Message></Response>`
    : `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`;
  return new NextResponse(xml, {
    status:  200,
    headers: { "Content-Type": "text/xml" },
  });
}

export async function POST(request: NextRequest) {
  // Parse form-encoded body
  const text = await request.text();
  const params = Object.fromEntries(new URLSearchParams(text));

  // Basic signature check — skip if env var not set (dev mode)
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (authToken) {
    const signature  = request.headers.get("X-Twilio-Signature") ?? "";
    const requestUrl = process.env.TWILIO_WEBHOOK_URL ?? request.url;

    // Simple HMAC validation
    const { createHmac } = await import("crypto");
    const sortedParams   = Object.keys(params).sort().reduce((acc, k) => acc + k + params[k], requestUrl);
    const expected       = createHmac("sha1", authToken).update(sortedParams).digest("base64");

    if (signature !== expected) {
      console.warn("[Twilio] Invalid signature");
      return twimlResponse(); // 200 but empty — don't expose error
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const parsed = parseTwilioWebhook(params as any);

  if (!parsed.body) return twimlResponse();

  try {
    const result = await processInboundMessage({
      phoneNumber: parsed.from,
      messageBody: parsed.body,
      providerId:  parsed.messageId,
      mediaUrl:    parsed.mediaUrl,
    });

    if (result.sent) {
      // Send reply via Twilio (sendWhatsAppMessage handles provider routing)
      await sendWhatsAppMessage({ to: parsed.from, body: result.reply });
    }
  } catch (err) {
    console.error("[Twilio webhook]", err);
  }

  return twimlResponse(); // Always 200 to Twilio
}
