// ==================================================
// Telegram Notifications
// ==================================================
// Sends messages to a Telegram chat via Bot API.
// Used for:
//   1. Developer approvals during project build
//   2. Recruiter alerts (new candidate, AI complete, etc.)
//
// Setup:
//   1. Open @BotFather on Telegram → /newbot → copy token
//   2. Start a chat with your bot
//   3. Visit: https://api.telegram.org/bot<TOKEN>/getUpdates
//      to find your chat_id
//   4. Add to .env.local:
//      TELEGRAM_BOT_TOKEN=123456789:ABCdef...
//      TELEGRAM_CHAT_ID=987654321
// ==================================================

const TELEGRAM_API = "https://api.telegram.org";

export interface TelegramMessageOptions {
  chatId?: string;   // override default TELEGRAM_CHAT_ID
  parseMode?: "HTML" | "Markdown";
  disableNotification?: boolean;
}

// --------------------------------------------------
// Send a plain text or HTML message
// --------------------------------------------------
export async function sendTelegramMessage(
  text: string,
  options: TelegramMessageOptions = {}
): Promise<boolean> {
  const token  = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = options.chatId ?? process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.warn("[Telegram] TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not configured");
    return false;
  }

  try {
    const res = await fetch(`${TELEGRAM_API}/bot${token}/sendMessage`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id:              chatId,
        text,
        parse_mode:           options.parseMode ?? "HTML",
        disable_notification: options.disableNotification ?? false,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("[Telegram] Send failed:", err);
      return false;
    }
    return true;
  } catch (e) {
    console.error("[Telegram] Network error:", e);
    return false;
  }
}

// --------------------------------------------------
// Pre-built notification templates
// --------------------------------------------------

export async function notifyNewCandidate(
  candidateName: string,
  jobTitle: string,
  candidateId: string
) {
  return sendTelegramMessage(
    `🧑‍💼 <b>מועמד חדש</b>\n\n` +
    `<b>שם:</b> ${candidateName}\n` +
    `<b>תפקיד:</b> ${jobTitle}\n` +
    `<b>ID:</b> <code>${candidateId}</code>`
  );
}

export async function notifyAIInterviewComplete(
  candidateName: string,
  jobTitle: string,
  score: number,
  recommendation: "proceed" | "borderline" | "reject"
) {
  const emoji = recommendation === "proceed" ? "✅" : recommendation === "borderline" ? "⚠️" : "❌";
  return sendTelegramMessage(
    `${emoji} <b>ראיון AI הושלם</b>\n\n` +
    `<b>מועמד:</b> ${candidateName}\n` +
    `<b>תפקיד:</b> ${jobTitle}\n` +
    `<b>ציון:</b> ${score}/100\n` +
    `<b>המלצה:</b> ${recommendation}`
  );
}

export async function notifyAssignmentSubmitted(
  candidateName: string,
  jobTitle: string,
  candidateId: string
) {
  return sendTelegramMessage(
    `📝 <b>מטלה הוגשה</b>\n\n` +
    `<b>מועמד:</b> ${candidateName}\n` +
    `<b>תפקיד:</b> ${jobTitle}\n` +
    `<b>ID:</b> <code>${candidateId}</code>`
  );
}

// --------------------------------------------------
// Dev approval request
// --------------------------------------------------
// Used during development to request human approval
// before performing a sensitive action.
export async function requestApproval(action: string, details: string): Promise<void> {
  await sendTelegramMessage(
    `🔐 <b>בקשת אישור</b>\n\n` +
    `<b>פעולה:</b> ${action}\n` +
    `<b>סיבה:</b> ${details}\n\n` +
    `השב <b>המשך</b> ✅ כאן בטלגרם כדי לאשר\n` +
    `השב <b>עצור</b> ❌ כדי לדחות`
  );
}
