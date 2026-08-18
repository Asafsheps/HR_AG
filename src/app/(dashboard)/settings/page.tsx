"use client";

import { useState, useEffect } from "react";
import {
  Building2, MessageCircle, Bell, Bot, Check, Copy,
  Eye, EyeOff, ExternalLink, AlertCircle, CheckCircle2,
  Wifi, WifiOff, ChevronRight, Info,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type Tab = "general" | "whatsapp" | "notifications" | "agent" | "ai";
type Provider = "twilio" | "meta";

// ─── Helpers ─────────────────────────────────────────────────────────────────
function CopyBox({ value, label }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(value).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <div className="space-y-1">
      {label && <p className="text-xs font-medium text-neutral-500">{label}</p>}
      <div className="flex items-center gap-2 bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2">
        <code className="flex-1 text-xs text-neutral-700 font-mono truncate">{value}</code>
        <button onClick={copy} className="flex-shrink-0 text-neutral-400 hover:text-primary-600 transition-colors">
          {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

function SecretInput({ value, onChange, placeholder }: {
  value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 pr-10 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono placeholder:font-sans"
      />
      <button
        type="button"
        onClick={() => setShow(s => !s)}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────
function Section({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-neutral-200 rounded-xl p-6 space-y-4">
      <div>
        <h3 className="font-semibold text-neutral-900">{title}</h3>
        {desc && <p className="text-sm text-neutral-500 mt-0.5">{desc}</p>}
      </div>
      {children}
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-neutral-700">{label}</label>
      {children}
      {hint && <p className="text-xs text-neutral-400">{hint}</p>}
    </div>
  );
}

// ─── Tab: General ─────────────────────────────────────────────────────────────
function GeneralTab() {
  const [org, setOrg] = useState({ name: "TechCorp HR", website: "https://techcorp.example.com", industry: "טכנולוגיה", size: "50-200" });
  const [saved, setSaved] = useState(false);

  function save() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="space-y-5">
      <Section title="פרטי הארגון" desc="שם ומידע בסיסי שמופיע בפרסומי המשרות">
        <div className="grid grid-cols-2 gap-4">
          <Field label="שם הארגון">
            <input value={org.name} onChange={e => setOrg({ ...org, name: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </Field>
          <Field label="אתר אינטרנט">
            <input value={org.website} onChange={e => setOrg({ ...org, website: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </Field>
          <Field label="תעשייה">
            <select value={org.industry} onChange={e => setOrg({ ...org, industry: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white">
              {["טכנולוגיה","פינטק","בריאות","חינוך","פרסום","תקשורת","אחר"].map(i => (
                <option key={i}>{i}</option>
              ))}
            </select>
          </Field>
          <Field label="גודל הארגון">
            <select value={org.size} onChange={e => setOrg({ ...org, size: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white">
              {["1-10","11-50","50-200","200-1000","1000+"].map(s => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </Field>
        </div>
        <div className="flex justify-end pt-2">
          <button onClick={save}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors">
            {saved ? <><Check className="w-4 h-4" /> נשמר!</> : "שמור שינויים"}
          </button>
        </div>
      </Section>
    </div>
  );
}

// ─── Tab: WhatsApp ────────────────────────────────────────────────────────────
function WhatsAppTab() {
  const [provider, setProvider]   = useState<Provider>("twilio");
  const [testing,  setTesting]    = useState(false);
  const [testResult, setTestResult] = useState<"idle" | "ok" | "fail">("idle");
  const [saved, setSaved]         = useState(false);

  // Twilio fields
  const [twilio, setTwilio] = useState({ account_sid: "", auth_token: "", number: "" });
  // Meta fields
  const [meta, setMeta]     = useState({ phone_id: "", access_token: "", verify_token: "hr_verify_" + Math.random().toString(36).slice(2, 10) });

  const webhookBase = typeof window !== "undefined" ? window.location.origin : "https://your-domain.com";
  const webhookUrl  = provider === "twilio"
    ? `${webhookBase}/api/webhooks/whatsapp/twilio`
    : `${webhookBase}/api/webhooks/whatsapp/meta`;

  const isConfigured = provider === "twilio"
    ? !!(twilio.account_sid && twilio.auth_token && twilio.number)
    : !!(meta.phone_id && meta.access_token);

  async function testConnection() {
    setTesting(true);
    setTestResult("idle");
    // Demo: simulate test
    await new Promise(r => setTimeout(r, 1800));
    setTestResult(isConfigured ? "ok" : "fail");
    setTesting(false);
  }

  function save() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="space-y-5">

      {/* Status banner */}
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm ${
        isConfigured
          ? "bg-emerald-50 border-emerald-200 text-emerald-800"
          : "bg-amber-50 border-amber-200 text-amber-800"
      }`}>
        {isConfigured
          ? <Wifi className="w-4 h-4 flex-shrink-0" />
          : <WifiOff className="w-4 h-4 flex-shrink-0" />}
        <span>
          {isConfigured
            ? "WhatsApp מוגדר ומוכן — הבוט ישיב לפניות מועמדים"
            : "WhatsApp לא מוגדר — מלא את הפרטים למטה כדי לחבר את הבוט"}
        </span>
      </div>

      {/* Provider selection */}
      <Section title="ספק WhatsApp" desc="בחר את ספק ה-API דרכו הבוט ישלח ויקבל הודעות">
        <div className="grid grid-cols-2 gap-4">
          {[
            {
              id: "twilio" as Provider,
              name: "Twilio",
              desc: "הכי פשוט לפיתוח. חשבון חינמי זמין.",
              href: "https://console.twilio.com",
              badge: "מומלץ לפיתוח",
              badgeColor: "bg-primary-100 text-primary-700",
            },
            {
              id: "meta" as Provider,
              name: "Meta (WhatsApp Business API)",
              desc: "ישיר מ-Meta. מתאים לפרודקשן בסקייל.",
              href: "https://developers.facebook.com/docs/whatsapp",
              badge: "לפרודקשן",
              badgeColor: "bg-violet-100 text-violet-700",
            },
          ].map(p => (
            <button key={p.id} onClick={() => setProvider(p.id)}
              className={`text-right p-4 rounded-xl border-2 transition-all ${
                provider === p.id
                  ? "border-primary-600 bg-primary-50"
                  : "border-neutral-200 hover:border-neutral-300 bg-white"
              }`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.badgeColor}`}>{p.badge}</span>
                <div className={`w-4 h-4 rounded-full border-2 ${
                  provider === p.id ? "border-primary-600 bg-primary-600" : "border-neutral-300"
                }`}>
                  {provider === p.id && <div className="w-2 h-2 bg-white rounded-full m-auto mt-0.5" />}
                </div>
              </div>
              <p className="font-semibold text-neutral-900 text-sm">{p.name}</p>
              <p className="text-xs text-neutral-500 mt-1">{p.desc}</p>
              <a href={p.href} target="_blank" rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                className="inline-flex items-center gap-1 text-xs text-primary-600 hover:underline mt-2">
                מדריך הגדרה <ExternalLink className="w-3 h-3" />
              </a>
            </button>
          ))}
        </div>
      </Section>

      {/* Credentials */}
      <Section
        title={provider === "twilio" ? "פרטי Twilio" : "פרטי Meta WhatsApp API"}
        desc={provider === "twilio"
          ? "מצא ב-Twilio Console → Account Info"
          : "מצא ב-Meta for Developers → WhatsApp → API Setup"}>

        {provider === "twilio" ? (
          <div className="space-y-4">
            <Field label="Account SID" hint="מתחיל ב-AC...">
              <input value={twilio.account_sid}
                onChange={e => setTwilio({ ...twilio, account_sid: e.target.value })}
                placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono placeholder:font-sans" />
            </Field>
            <Field label="Auth Token">
              <SecretInput value={twilio.auth_token}
                onChange={v => setTwilio({ ...twilio, auth_token: v })}
                placeholder="••••••••••••••••••••••••••••••••" />
            </Field>
            <Field label="מספר WhatsApp" hint="בפורמט: whatsapp:+972XXXXXXXXX">
              <input value={twilio.number}
                onChange={e => setTwilio({ ...twilio, number: e.target.value })}
                placeholder="whatsapp:+972501234567"
                className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono placeholder:font-sans" />
            </Field>
          </div>
        ) : (
          <div className="space-y-4">
            <Field label="Phone Number ID" hint="מסוף Meta for Developers">
              <input value={meta.phone_id}
                onChange={e => setMeta({ ...meta, phone_id: e.target.value })}
                placeholder="123456789012345"
                className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono placeholder:font-sans" />
            </Field>
            <Field label="Access Token">
              <SecretInput value={meta.access_token}
                onChange={v => setMeta({ ...meta, access_token: v })}
                placeholder="EAAxxxxxxx..." />
            </Field>
            <Field label="Verify Token" hint="הטוקן שאתה מגדיר ב-Meta Webhook">
              <input value={meta.verify_token}
                onChange={e => setMeta({ ...meta, verify_token: e.target.value })}
                placeholder="my_verify_token"
                className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono placeholder:font-sans" />
            </Field>
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <button
            onClick={testConnection}
            disabled={testing}
            className="flex items-center gap-2 px-4 py-2 border border-neutral-300 rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors disabled:opacity-50"
          >
            {testing ? (
              <><span className="w-4 h-4 border-2 border-neutral-400 border-t-transparent rounded-full animate-spin" /> בודק חיבור...</>
            ) : testResult === "ok" ? (
              <><CheckCircle2 className="w-4 h-4 text-emerald-500" /> חיבור תקין</>
            ) : testResult === "fail" ? (
              <><AlertCircle className="w-4 h-4 text-red-500" /> חיבור נכשל</>
            ) : (
              <><Wifi className="w-4 h-4" /> בדוק חיבור</>
            )}
          </button>
          <button onClick={save}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors">
            {saved ? <><Check className="w-4 h-4" /> נשמר!</> : "שמור הגדרות"}
          </button>
        </div>
      </Section>

      {/* Webhook URL */}
      <Section title="Webhook URL" desc="הדבק את הכתובת הזאת בהגדרות ספק ה-WhatsApp שלך">
        <CopyBox value={webhookUrl} label="Webhook Endpoint" />
        {provider === "meta" && (
          <CopyBox value={meta.verify_token || "hr_verify_token"} label="Verify Token (להדביק ב-Meta)" />
        )}
        <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-700">
          <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
          <span>
            {provider === "twilio"
              ? "ב-Twilio Console: Messaging → Sandbox → Webhook URL — הדבק את הכתובת ובחר HTTP POST"
              : "ב-Meta for Developers: WhatsApp → Configuration → Webhook — הדבק את הכתובת ואת ה-Verify Token"}
          </span>
        </div>
      </Section>

      {/* Flow explanation */}
      <Section title="איך הבוט עובד" desc="תהליך שלם מהגשת מועמדות עד ריאיון WhatsApp">
        <div className="space-y-3">
          {[
            { step: "1", title: "מועמד ממלא טופס", desc: "בדף /apply/[slug] — שם, מייל, טלפון, קורות חיים", color: "bg-primary-100 text-primary-700" },
            { step: "2", title: "הפנייה לוואטסאפ", desc: "לאחר שליחה, המועמד מועבר לשיחת WhatsApp עם הבוט", color: "bg-green-100 text-green-700" },
            { step: "3", title: "סוכן AI מנהל ריאיון", desc: "שואל שאלות מוגדרות, מנקד תשובות ב-real time", color: "bg-violet-100 text-violet-700" },
            { step: "4", title: "ציון ≥ סף → שלב הבא", desc: "שולח מטלה אוטומטית, או מעביר למגייס בהתאם לציון", color: "bg-amber-100 text-amber-700" },
            { step: "5", title: "המגייס מקבל סיכום", desc: "הכל מסונתז בדף המועמד — ציון, שיחה, הגשת מטלה", color: "bg-emerald-100 text-emerald-700" },
          ].map(s => (
            <div key={s.step} className="flex items-start gap-3">
              <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5 ${s.color}`}>{s.step}</span>
              <div>
                <p className="text-sm font-medium text-neutral-800">{s.title}</p>
                <p className="text-xs text-neutral-500">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

// ─── Tab: Notifications ───────────────────────────────────────────────────────
function NotificationsTab() {
  const [prefs, setPrefs] = useState({
    new_candidate:        { label: "מועמד חדש הגיש מועמדות",          email: true,  browser: false },
    high_score:           { label: "מועמד קיבל ציון AI גבוה (80+)",    email: true,  browser: true  },
    escalation:           { label: "שיחה הועברה לטיפול אנושי",         email: true,  browser: true  },
    assignment_submitted: { label: "מועמד הגיש מטלה",                  email: true,  browser: false },
    daily_summary:        { label: "סיכום יומי של גיוסים",             email: true,  browser: false },
  });
  const [saved, setSaved] = useState(false);

  type PrefKey = keyof typeof prefs;

  function toggle(key: PrefKey, field: "email" | "browser") {
    setPrefs(p => ({ ...p, [key]: { ...p[key], [field]: !p[key][field] } }));
  }

  function save() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="space-y-5">
      <Section title="העדפות התראות" desc="בחר אילו אירועים ישלחו לך התראה ובאיזה ערוץ">
        <div className="space-y-0 divide-y divide-neutral-100">
          <div className="grid grid-cols-3 px-2 pb-2 text-xs font-medium text-neutral-400 uppercase tracking-wide">
            <span>אירוע</span>
            <span className="text-center">מייל</span>
            <span className="text-center">דפדפן</span>
          </div>
          {(Object.entries(prefs) as [PrefKey, typeof prefs[PrefKey]][]).map(([key, pref]) => (
            <div key={key} className="grid grid-cols-3 items-center py-3 px-2">
              <span className="text-sm text-neutral-700">{pref.label}</span>
              <div className="flex justify-center">
                <button onClick={() => toggle(key, "email")}
                  className={`w-10 h-5 rounded-full transition-colors relative ${pref.email ? "bg-primary-600" : "bg-neutral-200"}`}>
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${pref.email ? "right-0.5" : "left-0.5"}`} />
                </button>
              </div>
              <div className="flex justify-center">
                <button onClick={() => toggle(key, "browser")}
                  className={`w-10 h-5 rounded-full transition-colors relative ${pref.browser ? "bg-primary-600" : "bg-neutral-200"}`}>
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${pref.browser ? "right-0.5" : "left-0.5"}`} />
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-end pt-2">
          <button onClick={save}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors">
            {saved ? <><Check className="w-4 h-4" /> נשמר!</> : "שמור"}
          </button>
        </div>
      </Section>
    </div>
  );
}

// ─── Tab: Agent shortcuts ─────────────────────────────────────────────────────
function AgentTab() {
  return (
    <div className="space-y-5">
      <Section title="הגדרות סוכן AI" desc="הגדרות מפורטות של הסוכן נמצאות בדף הייעודי">
        <div className="flex items-center justify-between p-4 border border-neutral-200 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
              <Bot className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <p className="font-medium text-neutral-900">סוכן HR</p>
              <p className="text-sm text-neutral-500">מצב: פעיל · טון: מקצועי-ידידותי</p>
            </div>
          </div>
          <a href="/agent"
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition-colors">
            עבור להגדרות סוכן
            <ChevronRight className="w-4 h-4" />
          </a>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "שאלות מוגדרות",   value: "6",  color: "text-primary-600 bg-primary-50"  },
            { label: "שלבי ריאיון",      value: "3",  color: "text-violet-600 bg-violet-50"    },
            { label: "קריטריוני ניקוד", value: "5",  color: "text-emerald-600 bg-emerald-50"  },
          ].map(s => (
            <div key={s.label} className={`rounded-xl p-4 ${s.color}`}>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs font-medium mt-0.5 opacity-70">{s.label}</p>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

// ─── AI connection tab ───────────────────────────────────────────────────────
// Which provider/model runs the interview vs the scoring. Reads and writes
// /api/settings/ai; a save takes effect within a minute (resolver cache),
// no redeploy. Keys stay in env — this screen only chooses among providers
// that already have one.

const PROVIDER_LABELS: Record<string, string> = {
  openrouter: "OpenRouter",
  gemini:     "Google Gemini",
  anthropic:  "Anthropic (Claude)",
  openai:     "OpenAI",
  ollama:     "Ollama (מקומי)",
};

const MODEL_HINTS: Record<string, string> = {
  openrouter: "למשל anthropic/claude-sonnet-5 או google/gemini-3.6-flash",
  gemini:     "למשל gemini-3.6-flash",
  anthropic:  "למשל claude-sonnet-5",
  openai:     "למשל gpt-4o-mini",
  ollama:     "למשל qwen2.5-coder:7b",
};

interface AiRole { provider: string | null; model: string | null; source: string }
interface AiConfig {
  configured: string[];
  overrides: Record<string, string | null> | null;
  effective: { interview: AiRole; scoring: AiRole };
}

function AiTab() {
  const [config, setConfig]   = useState<AiConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [error, setError]     = useState("");

  const [form, setForm] = useState({
    interview_provider: "", interview_model: "",
    scoring_provider: "",   scoring_model: "",
  });

  const load = () => {
    fetch("/api/settings/ai")
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setConfig(d.data);
          const o = d.data.overrides ?? {};
          setForm({
            interview_provider: o.interview_provider ?? "",
            interview_model:    o.interview_model ?? "",
            scoring_provider:   o.scoring_provider ?? "",
            scoring_model:      o.scoring_model ?? "",
          });
        } else setError(d.error ?? "שגיאה בטעינה");
      })
      .catch(() => setError("שגיאת רשת"))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  async function save() {
    setSaving(true); setError(""); setSaved(false);
    try {
      const r = await fetch("/api/settings/ai", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interview_provider: form.interview_provider || null,
          interview_model:    form.interview_model || null,
          scoring_provider:   form.scoring_provider || null,
          scoring_model:      form.scoring_model || null,
        }),
      });
      const d = await r.json();
      if (d.success) { setSaved(true); setTimeout(() => setSaved(false), 3000); load(); }
      else setError(d.error ?? "השמירה נכשלה");
    } catch {
      setError("שגיאת רשת — נסה שוב");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-sm text-neutral-400 py-8 text-center">טוען…</p>;
  if (!config)  return <p className="text-sm text-red-600 py-8 text-center">{error || "שגיאה"}</p>;

  const roleBlock = (roleKey: "interview" | "scoring", title: string, desc: string) => {
    const eff = config.effective[roleKey];
    const providerField = `${roleKey}_provider` as keyof typeof form;
    const modelField    = `${roleKey}_model` as keyof typeof form;
    return (
      <Section title={title} desc={desc}>
        <p className="text-xs text-neutral-500 mb-3">
          פעיל כרגע: <span className="font-medium text-neutral-700">
            {PROVIDER_LABELS[eff.provider ?? ""] ?? eff.provider ?? "ברירת מחדל"}
            {eff.model ? ` · ${eff.model}` : ""}
          </span>
          <span className="text-neutral-400"> ({eff.source === "settings" ? "מהמסך הזה" : "מהגדרות השרת"})</span>
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          <select
            value={form[providerField]}
            onChange={e => setForm(p => ({ ...p, [providerField]: e.target.value }))}
            className="px-3 py-2 text-sm border border-neutral-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">ברירת מחדל של השרת</option>
            {config.configured.map(p => (
              <option key={p} value={p}>{PROVIDER_LABELS[p] ?? p}</option>
            ))}
          </select>
          <input
            value={form[modelField]}
            onChange={e => setForm(p => ({ ...p, [modelField]: e.target.value }))}
            className="px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono placeholder:font-sans"
            placeholder={MODEL_HINTS[form[providerField]] ?? "שם מודל (ריק = ברירת מחדל)"}
            dir="ltr"
          />
        </div>
      </Section>
    );
  };

  return (
    <div className="space-y-6">
      {/* Connected providers */}
      <Section title="ספקים מחוברים" desc="ספק נחשב מחובר כשמפתח API אמיתי מוגדר בשרת. המפתחות עצמם אינם מוצגים כאן.">
        <div className="flex flex-wrap gap-2">
          {Object.entries(PROVIDER_LABELS).map(([key, label]) => {
            const on = config.configured.includes(key);
            return (
              <span key={key} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border ${
                on ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                   : "bg-neutral-50 border-neutral-200 text-neutral-400"
              }`}>
                {on ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
                {label}
              </span>
            );
          })}
        </div>
      </Section>

      {roleBlock("interview", "מודל הריאיון", "מנהל את השיחה עם המועמד — 7 קריאות לריאיון, איכות תחקור חשובה")}
      {roleBlock("scoring",   "מודל הניקוד",  "קורא את התמליל וקובע את הציון — קריאה אחת לריאיון, כדאי החזק ביותר")}

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
      )}

      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {saved ? <CheckCircle2 className="w-4 h-4" /> : null}
          {saving ? "שומר…" : saved ? "נשמר ✓" : "שמור"}
        </button>
        <span className="text-xs text-neutral-400">שינוי נכנס לתוקף תוך דקה, בלי פריסה מחדש</span>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "general",       label: "כללי",       icon: <Building2     className="w-4 h-4" /> },
  { id: "ai",            label: "חיבור AI",   icon: <Wifi          className="w-4 h-4" /> },
  { id: "whatsapp",      label: "WhatsApp",   icon: <MessageCircle className="w-4 h-4" /> },
  { id: "notifications", label: "התראות",     icon: <Bell          className="w-4 h-4" /> },
  { id: "agent",         label: "סוכן AI",    icon: <Bot           className="w-4 h-4" /> },
];

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>("general");

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">הגדרות</h1>
        <p className="text-sm text-neutral-500 mt-0.5">ניהול הארגון, חיבור WhatsApp, והתראות</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-neutral-200">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === t.id
                ? "border-primary-600 text-primary-600"
                : "border-transparent text-neutral-500 hover:text-neutral-700"
            }`}>
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === "general"       && <GeneralTab />}
      {tab === "ai"            && <AiTab />}
      {tab === "whatsapp"      && <WhatsAppTab />}
      {tab === "notifications" && <NotificationsTab />}
      {tab === "agent"         && <AgentTab />}
    </div>
  );
}
