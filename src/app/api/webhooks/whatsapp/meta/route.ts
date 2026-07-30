// ==================================================
// Webhook — Meta WhatsApp Business API
// GET  /api/webhooks/whatsapp/meta  — verification challenge
// POST /api/webhooks/whatsapp/meta  — inbound messages
// ==================================================
// Meta sends a GET to verify the webhook URL when you first register it.
// Then POSTs a JSON payload for every inbound event.
// ==================================================

import { NextRequest, NextResponse } from "next/server";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import { parseMetaWebhook } from "@/lib/whatsapp/providers/meta";
import { processInboundMessage } from "@/lib/ai/agents/recruiter-agent";
import type { MetaWebhookEntry } from "@/lib/whatsapp/providers/meta";

// ── GET — webhook verification ────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode      = searchParams.get("hub.mode");
  const token     = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const verifyToken = process.env.META_WEBHOOK_VERIFY_TOKEN;

  if (mode === "subscribe" && token === verifyToken) {
    return new NextResponse(challenge, { status: 200 });
  }

  return new NextResponse("Forbidden", { status: 403 });
}

// ── POST — inbound message events ────────────────────────────────────────────
export async function POST(request: NextRequest) {
  let body: { object?: string; entry?: MetaWebhookEntry[] };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  // Meta sends non-whatsapp objects too — ignore them
  if (body.object !== "whatsapp_business_account") {
    return NextResponse.json({ ok: true });
  }

  // Process each entry (usually just one)
  for (const entry of body.entry ?? []) {
    const parsed = parseMetaWebhook(entry);
    if (!parsed || parsed.type !== "text" || !parsed.body) continue;

    try {
      const result = await processInboundMessage({
        phoneNumber: parsed.from,
        messageBody: parsed.body,
        providerId:  parsed.messageId,
      });

      if (result.sent) {
        await sendWhatsAppMessage({ to: parsed.from, body: result.reply });
      }
    } catch (err) {
      console.error("[Meta webhook]", err);
    }
  }

  // Meta requires a 200 within 20 seconds
  return NextResponse.json({ ok: true });
}
