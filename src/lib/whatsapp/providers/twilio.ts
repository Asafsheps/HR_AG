// ==================================================
// WhatsApp Provider — Twilio
// ==================================================
// Sends and receives WhatsApp messages via Twilio's WhatsApp sandbox / business API.
// Requires: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_NUMBER
// ==================================================

export interface TwilioSendOptions {
  to: string;   // E.164: +972501234567
  body: string;
  mediaUrl?: string;
}

export interface TwilioWebhookPayload {
  From: string;
  To: string;
  Body: string;
  MessageSid: string;
  NumMedia?: string;
  MediaUrl0?: string;
}

export async function sendTwilioMessage(options: TwilioSendOptions): Promise<string> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_NUMBER;

  if (!accountSid || !authToken || !from) {
    throw new Error("Twilio credentials not configured");
  }

  const to = options.to.startsWith("whatsapp:") ? options.to : `whatsapp:${options.to}`;

  const body = new URLSearchParams({
    From: from,
    To: to,
    Body: options.body,
    ...(options.mediaUrl ? { MediaUrl: options.mediaUrl } : {}),
  });

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
      },
      body: body.toString(),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Twilio API error: ${response.status} — ${err}`);
  }

  const data = await response.json();
  return data.sid as string;
}

// Parse and normalize an inbound Twilio webhook payload
export function parseTwilioWebhook(payload: TwilioWebhookPayload) {
  return {
    from: payload.From.replace("whatsapp:", ""),
    to: payload.To.replace("whatsapp:", ""),
    body: payload.Body,
    messageId: payload.MessageSid,
    mediaUrl: payload.MediaUrl0,
  };
}
