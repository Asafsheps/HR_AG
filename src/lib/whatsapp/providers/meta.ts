// ==================================================
// WhatsApp Provider — Meta Business API
// ==================================================
// Official Meta WhatsApp Cloud API (v20.0).
// Requires: META_WHATSAPP_TOKEN, META_WHATSAPP_PHONE_ID
// ==================================================

export interface MetaSendOptions {
  to: string;   // E.164 without +: 972501234567
  body: string;
}

export interface MetaWebhookEntry {
  id: string;
  changes: Array<{
    value: {
      messaging_product: string;
      messages?: Array<{
        id: string;
        from: string;
        timestamp: string;
        type: string;
        text?: { body: string };
        image?: { id: string; mime_type: string };
      }>;
    };
  }>;
}

export async function sendMetaMessage(options: MetaSendOptions): Promise<string> {
  const token = process.env.META_WHATSAPP_TOKEN;
  const phoneId = process.env.META_WHATSAPP_PHONE_ID;

  if (!token || !phoneId) {
    throw new Error("Meta WhatsApp credentials not configured");
  }

  // Remove leading + if present
  const to = options.to.replace(/^\+/, "");

  const response = await fetch(
    `https://graph.facebook.com/v20.0/${phoneId}/messages`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: options.body },
      }),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Meta API error: ${response.status} — ${err}`);
  }

  const data = await response.json();
  return data.messages?.[0]?.id as string;
}

// Parse an inbound Meta webhook notification
export function parseMetaWebhook(entry: MetaWebhookEntry) {
  const message = entry.changes?.[0]?.value?.messages?.[0];
  if (!message) return null;

  return {
    from: `+${message.from}`,
    messageId: message.id,
    body: message.text?.body ?? "",
    timestamp: message.timestamp,
    type: message.type,
  };
}
