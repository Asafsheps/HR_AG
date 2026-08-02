// ==================================================
// Environment Variable Validator
// Phase 12: Production Hardening
// ==================================================
// Call validateEnv() once at startup (e.g., in instrumentation.ts)
// to catch missing/malformed vars before they cause runtime errors.
// ==================================================

interface EnvVar {
  name:        string;
  required:    boolean;
  description: string;
  validator?:  (v: string) => boolean;
}

const ENV_SCHEMA: EnvVar[] = [
  // Supabase
  // Hosted Supabase is always https. A local stack (supabase start) serves plain
  // http on 127.0.0.1/localhost, so allow that too — otherwise local dev can never
  // pass validation.
  { name: "NEXT_PUBLIC_SUPABASE_URL",      required: true,  description: "Supabase project URL",        validator: (v) => v.startsWith("https://") || /^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?/.test(v) },
  { name: "NEXT_PUBLIC_SUPABASE_ANON_KEY", required: true,  description: "Supabase anon key" },
  { name: "SUPABASE_SERVICE_ROLE_KEY",     required: true,  description: "Supabase service role key" },

  // AI
  { name: "ANTHROPIC_API_KEY",             required: true,  description: "Anthropic API key",            validator: (v) => v.startsWith("sk-ant-") },
  { name: "OPENAI_API_KEY",                required: false, description: "OpenAI API key (fallback)",    validator: (v) => v.startsWith("sk-") },

  // WhatsApp
  { name: "TWILIO_ACCOUNT_SID",            required: false, description: "Twilio Account SID",           validator: (v) => v.startsWith("AC") },
  { name: "TWILIO_AUTH_TOKEN",             required: false, description: "Twilio Auth Token" },
  { name: "TWILIO_WHATSAPP_FROM",          required: false, description: "Twilio WhatsApp sender number" },
  { name: "META_ACCESS_TOKEN",             required: false, description: "Meta WhatsApp Business token" },
  { name: "META_PHONE_NUMBER_ID",          required: false, description: "Meta phone number ID" },
  { name: "META_WEBHOOK_VERIFY_TOKEN",     required: false, description: "Meta webhook verify token" },

  // Telegram (notifications)
  { name: "TELEGRAM_BOT_TOKEN",            required: false, description: "Telegram bot token" },
  { name: "TELEGRAM_CHAT_ID",              required: false, description: "Telegram chat ID" },

  // App
  { name: "NEXT_PUBLIC_APP_URL",           required: false, description: "Public app URL",               validator: (v) => v.startsWith("http") },
  { name: "AI_DEFAULT_PROVIDER",           required: false, description: "Default AI provider (anthropic|openai)" },
];

export interface EnvValidationResult {
  valid:    boolean;
  errors:   string[];
  warnings: string[];
}

export function validateEnv(): EnvValidationResult {
  const errors:   string[] = [];
  const warnings: string[] = [];

  for (const schema of ENV_SCHEMA) {
    const rawValue = process.env[schema.name];

    if (!rawValue || rawValue.trim() === "") {
      if (schema.required) {
        errors.push(`Missing required env var: ${schema.name} (${schema.description})`);
      } else {
        warnings.push(`Optional env var not set: ${schema.name} (${schema.description})`);
      }
      continue;
    }

    const value = rawValue.trim();

    if (schema.validator && !schema.validator(value)) {
      const msg = `Invalid value for ${schema.name}: format check failed`;
      if (schema.required) errors.push(msg);
      else                  warnings.push(msg);
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

// Throws in production if required vars are missing
export function assertEnv(): void {
  const result = validateEnv();

  if (result.warnings.length > 0 && process.env.NODE_ENV !== "production") {
    result.warnings.forEach((w) => console.warn(`[ENV] ⚠️  ${w}`));
  }

  if (!result.valid) {
    const msg = [
      "❌ Missing required environment variables:",
      ...result.errors.map((e) => `  • ${e}`),
      "",
      "Copy .env.example → .env.local and fill in the required values.",
    ].join("\n");

    if (process.env.NODE_ENV === "production") {
      throw new Error(msg);
    } else {
      console.error(`[ENV] ${msg}`);
    }
  }
}
