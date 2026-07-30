// ==================================================
// WhatsApp — Abstraction Router
// ==================================================
// Single entry point for all WhatsApp operations.
// Provider is selected from WHATSAPP_PROVIDER env var.
// Supports: twilio | meta
// ==================================================

import type { WhatsAppProvider } from "@/types";
import { sendTwilioMessage } from "./providers/twilio";
import { sendMetaMessage } from "./providers/meta";

export interface SendMessageOptions {
  to: string;
  body: string;
  mediaUrl?: string;
}

export async function sendWhatsAppMessage(options: SendMessageOptions): Promise<string> {
  const provider: WhatsAppProvider =
    (process.env.WHATSAPP_PROVIDER as WhatsAppProvider) ?? "twilio";

  switch (provider) {
    case "twilio":
      return sendTwilioMessage({ to: options.to, body: options.body, mediaUrl: options.mediaUrl });

    case "meta":
      return sendMetaMessage({ to: options.to, body: options.body });

    default:
      throw new Error(`Unknown WhatsApp provider: ${provider}`);
  }
}
