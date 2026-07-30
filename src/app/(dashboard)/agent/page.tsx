"use client";

import { useState, useEffect, useCallback } from "react";
import { Bot, MessageSquare, Settings2, ChevronRight, Circle,
         Pause, Play, UserCheck, AlertCircle, Clock, Star,
         Plus, Trash2, GripVertical, Save, ToggleLeft, ToggleRight,
         TrendingUp, Users, Zap } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type SessionStatus = "active" | "waiting" | "completed" | "escalated";
type ThreadItemType = "message" | "agent_action";

interface Session {
  id: string;
  candidate_id: string;
  candidate_name: string;
  job_title: string;
  status: SessionStatus;
  stage: string;
  last_message_at: string;
  messages_count: number;
  ai_score: number;
  next_action: string;
  whatsapp_number: string;
}

interface ThreadItem {
  id: string;
  type: ThreadItemType;
  direction?: "inbound" | "outbound";
  action?: string;
  body: string;
  score_delta?: number;
  timestamp: string;
  agent_note: string | null;
}

interface Question {
  id: string;
  stage: string;
  text: string;
  required: boolean;
  weight: number;
}

interface ScoringCriteria {
  id: string;
  label: string;
  weight: number;
  description: string;
}

interface Stage {
  id: string;
  label: string;
  enabled: boolean;
}

interface AgentConfig {
  name: string;
  tone: string;
  max_questions: number;
  auto_score: boolean;
  auto_escalate_score: number;
  reject_score: number;
  escalate_after_messages: number;
  stages: Stage[];
  questions: Question[];
  scoring_criteria: ScoringCriteria[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return "עכשיו";
  if (mins < 60) return `לפני ${mins} דק׳`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `לפני ${hrs} שע׳`;
  return `לפני ${Math.floor(hrs / 24)} ימים`;
}

function scoreColor(s: number) {
  if (s >= 80) return "text-emerald-600 bg-emerald-50";
  if (s >= 60) return "text-amber-600 bg-amber-50";
  return "text-red-500 bg-red-50";
}

const STATUS_META: Record<SessionStatus, { label: string; color: string; dot: string }> = {
  active:    { label: "פעיל",      color: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500 animate-pulse" },
  waiting:   { label: "ממתין",     color: "bg-amber-100  text-amber-700",    dot: "bg-amber-400" },
  completed: { label: "הסתיים",    color: "bg-neutral-100 text-neutral-600", dot: "bg-neutral-400" },
  escalated: { label: "הועבר לאדם", color: "bg-blue-100  text-blue-700",     dot: "bg-blue-500" },
};

const STAGE_LABELS: Record<string, string> = {
  intro:            "פתיחה",
  screening:        "סינון",
  technical_screen: "מסך טכני",
  assignment:       "מטלה",
  done:             "הסתיים",
};

const TONE_OPTIONS = [
  { value: "professional_friendly", label: "מקצועי-ידידותי (מומלץ)" },
  { value: "professional",          label: "מקצועי" },
  { value: "friendly",              label: "ידידותי" },
  { value: "formal",                label: "פורמלי" },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: SessionStatus }) {
  const m = STATUS_META[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${m.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  );
}

function ScoreBadge({ score }: { score: number }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${scoreColor(score)}`}>
      <Star className="w-3 h-3" />
      {score}
    </span>
  );
}

function ThreadMessage({ item }: { item: ThreadItem }) {
  const isInbound  = item.direction === "inbound";
  const isOutbound = item.direction === "outbound";
  const isAction   = item.type === "agent_action";

  if (isAction) {
    const isScore = item.action === "score_update";
    return (
      <div className="flex items-start gap-2 py-1 px-3 mx-2 my-1 bg-violet-50 border border-violet-100 rounded-lg text-xs text-violet-700">
        <Bot className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-violet-500" />
        <div className="flex-1 min-w-0">
          <span className="font-medium">🤖 סוכן: </span>
          {item.body}
          {isScore && item.score_delta !== undefined && item.score_delta !== 0 && (
            <span className={`ml-2 font-bold ${item.score_delta > 0 ? "text-emerald-600" : "text-red-500"}`}>
              {item.score_delta > 0 ? `+${item.score_delta}` : item.score_delta}
            </span>
          )}
        </div>
        <span className="text-violet-400 flex-shrink-0">{timeAgo(item.timestamp)}</span>
      </div>
    );
  }

  return (
    <div className={`flex ${isOutbound ? "justify-start" : "justify-end"} px-3 my-1`}>
      <div className="max-w-[75%]">
        {item.agent_note && (
          <p className={`text-[10px] mb-1 ${isOutbound ? "text-left text-neutral-400" : "text-right text-neutral-400"}`}>
            {isOutbound ? `🤖 ${item.agent_note}` : ""}
          </p>
        )}
        <div className={`px-3.5 py-2 rounded-2xl text-sm leading-relaxed ${
          isOutbound
            ? "bg-white border border-neutral-200 text-neutral-800 rounded-tl-sm"
            : "bg-[#DCF8C6] text-neutral-900 rounded-tr-sm"
        }`}>
          {item.body}
        </div>
        <p className={`text-[10px] mt-1 text-neutral-400 ${isOutbound ? "text-left" : "text-right"}`}>
          {timeAgo(item.timestamp)}
        </p>
      </div>
    </div>
  );
}

// ─── Tab: Conversations ───────────────────────────────────────────────────────

function ConversationsTab() {
  const [sessions, setSessions]   = useState<Session[]>([]);
  const [selected, setSelected]   = useState<string | null>(null);
  const [thread, setThread]       = useState<ThreadItem[]>([]);
  const [threadSession, setThreadSession] = useState<Session | null>(null);
  const [loading, setLoading]     = useState(true);
  const [threadLoading, setThreadLoading] = useState(false);

  useEffect(() => {
    fetch("/api/agent/sessions")
      .then(r => r.json())
      .then(d => { setSessions(d.data ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const loadThread = useCallback(async (sessionId: string) => {
    setThreadLoading(true);
    setSelected(sessionId);
    try {
      const r = await fetch(`/api/agent/sessions/${sessionId}`);
      const d = await r.json();
      setThread(d.data?.thread ?? []);
      setThreadSession(d.data?.session ?? null);
    } finally {
      setThreadLoading(false);
    }
  }, []);

  const active    = sessions.filter(s => s.status === "active");
  const waiting   = sessions.filter(s => s.status === "waiting");
  const escalated = sessions.filter(s => s.status === "escalated");

  return (
    <div className="flex h-[calc(100vh-13rem)] border border-neutral-200 rounded-xl overflow-hidden bg-white">

      {/* Left — Session List */}
      <div className="w-80 flex-shrink-0 border-r border-neutral-200 flex flex-col">
        <div className="px-4 py-3 border-b border-neutral-100 bg-neutral-50">
          <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">שיחות מנוהלות ע״י סוכן</p>
        </div>

        <div className="overflow-y-auto flex-1">
          {loading ? (
            <div className="p-4 text-sm text-neutral-400 text-center">טוען...</div>
          ) : (
            <>
              {/* Active */}
              {active.length > 0 && (
                <div>
                  <div className="px-3 py-2 text-[10px] font-semibold text-emerald-600 uppercase tracking-wider bg-emerald-50 border-b border-emerald-100">
                    ● פעיל ({active.length})
                  </div>
                  {active.map(s => <SessionRow key={s.id} session={s} selected={selected} onSelect={loadThread} />)}
                </div>
              )}
              {/* Waiting */}
              {waiting.length > 0 && (
                <div>
                  <div className="px-3 py-2 text-[10px] font-semibold text-amber-600 uppercase tracking-wider bg-amber-50 border-b border-amber-100">
                    ● ממתין ({waiting.length})
                  </div>
                  {waiting.map(s => <SessionRow key={s.id} session={s} selected={selected} onSelect={loadThread} />)}
                </div>
              )}
              {/* Escalated */}
              {escalated.length > 0 && (
                <div>
                  <div className="px-3 py-2 text-[10px] font-semibold text-blue-600 uppercase tracking-wider bg-blue-50 border-b border-blue-100">
                    ● הועבר לאדם ({escalated.length})
                  </div>
                  {escalated.map(s => <SessionRow key={s.id} session={s} selected={selected} onSelect={loadThread} />)}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Right — Thread */}
      <div className="flex-1 flex flex-col bg-[#f0f4f8]">
        {!selected ? (
          <div className="flex-1 flex flex-col items-center justify-center text-neutral-400 gap-3">
            <MessageSquare className="w-10 h-10 opacity-30" />
            <p className="text-sm">בחר שיחה לצפייה</p>
          </div>
        ) : (
          <>
            {/* Thread header */}
            {threadSession && (
              <div className="bg-white border-b border-neutral-200 px-4 py-3 flex items-center gap-3">
                <div className="w-9 h-9 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {threadSession.candidate_name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-neutral-900">{threadSession.candidate_name}</p>
                  <p className="text-xs text-neutral-500 truncate">{threadSession.job_title} · {STAGE_LABELS[threadSession.stage] ?? threadSession.stage}</p>
                </div>
                <ScoreBadge score={threadSession.ai_score} />
                <StatusBadge status={threadSession.status} />
              </div>
            )}

            {/* Next action bar */}
            {threadSession?.next_action && (
              <div className="bg-violet-50 border-b border-violet-100 px-4 py-2 flex items-center gap-2 text-xs text-violet-700">
                <Bot className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="font-medium">פעולה הבאה: </span>
                <span>{threadSession.next_action}</span>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto py-3">
              {threadLoading ? (
                <div className="flex items-center justify-center h-full text-neutral-400 text-sm">טוען שיחה...</div>
              ) : (
                thread.map(item => <ThreadMessage key={item.id} item={item} />)
              )}
            </div>

            {/* Footer note */}
            <div className="bg-white border-t border-neutral-200 px-4 py-2.5 flex items-center gap-2 text-xs text-neutral-500">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>הסוכן מנהל את השיחה. לקחת שליטה — לחץ &quot;העבר למגייס&quot;</span>
              <button className="mr-auto px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-medium transition-colors">
                העבר למגייס
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function SessionRow({ session, selected, onSelect }: {
  session: Session;
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <button
      onClick={() => onSelect(session.id)}
      className={`w-full text-right px-3 py-3 border-b border-neutral-100 hover:bg-neutral-50 transition-colors ${selected === session.id ? "bg-primary-50 border-r-2 border-r-primary-500" : ""}`}
    >
      <div className="flex items-start gap-2">
        <div className="w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
          {session.candidate_name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <p className="text-sm font-medium text-neutral-900 truncate">{session.candidate_name}</p>
            <ScoreBadge score={session.ai_score} />
          </div>
          <p className="text-xs text-neutral-500 truncate mt-0.5">{session.job_title}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] text-neutral-400">{timeAgo(session.last_message_at)}</span>
            <span className="text-[10px] text-neutral-400">· {session.messages_count} הודעות</span>
          </div>
          <p className="text-[10px] text-violet-600 mt-1 truncate">⚡ {session.next_action}</p>
        </div>
      </div>
    </button>
  );
}

// ─── Tab: Configuration ───────────────────────────────────────────────────────

function ConfigTab() {
  const [config, setConfig]   = useState<AgentConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [activeSection, setActiveSection] = useState<"general" | "questions" | "scoring" | "stages" | "preview">("general");

  useEffect(() => {
    fetch("/api/agent/config")
      .then(r => r.json())
      .then(d => { setConfig(d.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function handleSave() {
    if (!config) return;
    setSaving(true);
    await fetch("/api/agent/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  if (loading || !config) {
    return <div className="flex items-center justify-center h-48 text-neutral-400 text-sm">טוען הגדרות...</div>;
  }

  return (
    <div className="flex gap-6">

      {/* Sidebar nav */}
      <div className="w-52 flex-shrink-0">
        <nav className="space-y-1">
          {[
            { id: "general",   label: "כללי",             icon: <Settings2    className="w-4 h-4" /> },
            { id: "stages",    label: "שלבי ראיון",        icon: <ChevronRight className="w-4 h-4" /> },
            { id: "questions", label: "שאלות",             icon: <MessageSquare className="w-4 h-4" /> },
            { id: "scoring",   label: "קריטריוני ניקוד",   icon: <Star         className="w-4 h-4" /> },
            { id: "preview",   label: "תצוגת שיחה",        icon: <Bot          className="w-4 h-4" /> },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id as typeof activeSection)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeSection === item.id
                  ? "bg-primary-600 text-white"
                  : "text-neutral-600 hover:bg-neutral-100"
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="bg-white border border-neutral-200 rounded-xl p-6 space-y-5">

          {/* ── General ── */}
          {activeSection === "general" && (
            <>
              <h3 className="font-semibold text-neutral-900 border-b border-neutral-100 pb-3">הגדרות כלליות</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">שם הסוכן</label>
                  <input
                    value={config.name}
                    onChange={e => setConfig({ ...config, name: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">טון שיחה</label>
                  <select
                    value={config.tone}
                    onChange={e => setConfig({ ...config, tone: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {TONE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">מקס׳ שאלות</label>
                  <input
                    type="number" min={3} max={20}
                    value={config.max_questions}
                    onChange={e => setConfig({ ...config, max_questions: +e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">ציון להעברה לאדם</label>
                  <input
                    type="number" min={0} max={100}
                    value={config.auto_escalate_score}
                    onChange={e => setConfig({ ...config, auto_escalate_score: +e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <p className="text-xs text-neutral-400 mt-1">מעל ציון זה → מגייס</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">ציון לדחייה אוטומטית</label>
                  <input
                    type="number" min={0} max={100}
                    value={config.reject_score}
                    onChange={e => setConfig({ ...config, reject_score: +e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <p className="text-xs text-neutral-400 mt-1">מתחת לציון זה → דחייה</p>
                </div>
              </div>

              <div className="flex items-center justify-between py-3 px-4 bg-neutral-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-neutral-800">ניקוד אוטומטי</p>
                  <p className="text-xs text-neutral-500">הסוכן ינקד תגובות בזמן אמת</p>
                </div>
                <button
                  onClick={() => setConfig({ ...config, auto_score: !config.auto_score })}
                  className={`transition-colors ${config.auto_score ? "text-primary-600" : "text-neutral-400"}`}
                >
                  {config.auto_score
                    ? <ToggleRight className="w-8 h-8" />
                    : <ToggleLeft  className="w-8 h-8" />
                  }
                </button>
              </div>
            </>
          )}

          {/* ── Stages ── */}
          {activeSection === "stages" && (
            <>
              <h3 className="font-semibold text-neutral-900 border-b border-neutral-100 pb-3">שלבי הראיון</h3>
              <p className="text-sm text-neutral-500">הגדר אילו שלבים הסוכן יבצע עם כל מועמד</p>
              <div className="space-y-2">
                {config.stages.map((stage, idx) => (
                  <div key={stage.id} className="flex items-center gap-3 p-3 border border-neutral-200 rounded-lg">
                    <GripVertical className="w-4 h-4 text-neutral-300" />
                    <div className="w-7 h-7 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {idx + 1}
                    </div>
                    <span className="flex-1 text-sm font-medium text-neutral-800">{stage.label}</span>
                    <button
                      onClick={() => {
                        const stages = [...config.stages];
                        stages[idx] = { ...stage, enabled: !stage.enabled };
                        setConfig({ ...config, stages });
                      }}
                      className={`transition-colors ${stage.enabled ? "text-primary-600" : "text-neutral-300"}`}
                    >
                      {stage.enabled ? <ToggleRight className="w-7 h-7" /> : <ToggleLeft className="w-7 h-7" />}
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ── Questions ── */}
          {activeSection === "questions" && (
            <>
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                <h3 className="font-semibold text-neutral-900">שאלות הראיון</h3>
                <button
                  onClick={() => {
                    const newQ: Question = {
                      id: `q${Date.now()}`,
                      stage: "screening",
                      text: "שאלה חדשה...",
                      required: false,
                      weight: 10,
                    };
                    setConfig({ ...config, questions: [...config.questions, newQ] });
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 text-white text-xs font-medium rounded-md hover:bg-primary-700 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  הוסף שאלה
                </button>
              </div>

              <div className="space-y-2">
                {config.questions.map((q, idx) => (
                  <div key={q.id} className="group border border-neutral-200 rounded-lg p-3 hover:border-primary-300 transition-colors">
                    <div className="flex items-start gap-3">
                      <GripVertical className="w-4 h-4 text-neutral-300 mt-2 flex-shrink-0" />
                      <div className="flex-1 space-y-2">
                        <input
                          value={q.text}
                          onChange={e => {
                            const qs = [...config.questions];
                            qs[idx] = { ...q, text: e.target.value };
                            setConfig({ ...config, questions: qs });
                          }}
                          className="w-full text-sm text-neutral-800 border-0 bg-transparent focus:outline-none focus:bg-white focus:border focus:border-neutral-300 focus:rounded px-1 py-0.5"
                        />
                        <div className="flex items-center gap-3 flex-wrap">
                          <select
                            value={q.stage}
                            onChange={e => {
                              const qs = [...config.questions];
                              qs[idx] = { ...q, stage: e.target.value };
                              setConfig({ ...config, questions: qs });
                            }}
                            className="text-xs border border-neutral-200 rounded px-2 py-1 text-neutral-600 focus:outline-none"
                          >
                            {config.stages.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                          </select>
                          <label className="flex items-center gap-1 text-xs text-neutral-600 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={q.required}
                              onChange={e => {
                                const qs = [...config.questions];
                                qs[idx] = { ...q, required: e.target.checked };
                                setConfig({ ...config, questions: qs });
                              }}
                              className="rounded"
                            />
                            חובה
                          </label>
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-neutral-500">משקל:</span>
                            <input
                              type="number" min={1} max={50}
                              value={q.weight}
                              onChange={e => {
                                const qs = [...config.questions];
                                qs[idx] = { ...q, weight: +e.target.value };
                                setConfig({ ...config, questions: qs });
                              }}
                              className="w-14 text-xs border border-neutral-200 rounded px-2 py-1 focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => setConfig({ ...config, questions: config.questions.filter((_, i) => i !== idx) })}
                        className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all mt-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ── Scoring ── */}
          {activeSection === "scoring" && (
            <>
              <h3 className="font-semibold text-neutral-900 border-b border-neutral-100 pb-3">קריטריוני ניקוד</h3>
              <p className="text-sm text-neutral-500 mb-3">
                סך משקלים: <span className={`font-bold ${config.scoring_criteria.reduce((a, c) => a + c.weight, 0) === 100 ? "text-emerald-600" : "text-red-500"}`}>
                  {config.scoring_criteria.reduce((a, c) => a + c.weight, 0)}
                </span> / 100
              </p>

              <div className="space-y-3">
                {config.scoring_criteria.map((sc, idx) => (
                  <div key={sc.id} className="border border-neutral-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <input
                            value={sc.label}
                            onChange={e => {
                              const cr = [...config.scoring_criteria];
                              cr[idx] = { ...sc, label: e.target.value };
                              setConfig({ ...config, scoring_criteria: cr });
                            }}
                            className="text-sm font-medium text-neutral-800 border-0 bg-transparent focus:outline-none focus:bg-white focus:border focus:border-neutral-300 focus:rounded px-1 flex-1"
                          />
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-neutral-500">משקל %</span>
                            <input
                              type="number" min={0} max={100}
                              value={sc.weight}
                              onChange={e => {
                                const cr = [...config.scoring_criteria];
                                cr[idx] = { ...sc, weight: +e.target.value };
                                setConfig({ ...config, scoring_criteria: cr });
                              }}
                              className="w-16 text-sm font-bold text-center border border-neutral-200 rounded px-2 py-1 focus:outline-none"
                            />
                          </div>
                        </div>
                        <input
                          value={sc.description}
                          onChange={e => {
                            const cr = [...config.scoring_criteria];
                            cr[idx] = { ...sc, description: e.target.value };
                            setConfig({ ...config, scoring_criteria: cr });
                          }}
                          className="w-full text-xs text-neutral-500 border-0 bg-transparent focus:outline-none focus:bg-white focus:border focus:border-neutral-200 focus:rounded px-1"
                        />
                        <div className="mt-2 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary-500 rounded-full transition-all"
                            style={{ width: `${sc.weight}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

          {/* ── Preview ── */}
          {activeSection === "preview" && (
            <>
              <h3 className="font-semibold text-neutral-900 border-b border-neutral-100 pb-3">
                תצוגת שיחה — כך הבוט ישאל מועמד
              </h3>
              <p className="text-sm text-neutral-500">
                סימולציה של שיחת WhatsApp שהבוט מנהל עם מועמד, לפי השאלות והשלבים המוגדרים.
              </p>

              {/* WhatsApp simulation */}
              <div className="bg-[#e5ddd5] rounded-2xl overflow-hidden">
                {/* WA header */}
                <div className="bg-[#075e54] text-white px-4 py-3 flex items-center gap-3">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{config.name}</p>
                    <p className="text-xs opacity-75">מחובר · סוכן AI</p>
                  </div>
                </div>

                {/* Messages */}
                <div className="p-4 space-y-3 max-h-[520px] overflow-y-auto">

                  {/* System note */}
                  <div className="text-center">
                    <span className="bg-black/10 text-neutral-600 text-[11px] px-3 py-1 rounded-full">
                      מועמד פתח שיחה לאחר מילוי טופס
                    </span>
                  </div>

                  {/* Candidate first message */}
                  <div className="flex justify-end">
                    <div className="bg-[#dcf8c6] rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[75%] shadow-sm">
                      <p className="text-sm text-neutral-900">שלום! הגשתי מועמדות למשרת {config.name === "סוכן HR" ? "מפתח Full Stack בכיר" : "תפקיד"} ואני מוכן/ה לשיחה עם הבוט.</p>
                      <p className="text-[10px] text-neutral-500 mt-1 text-left">10:00 ✓✓</p>
                    </div>
                  </div>

                  {/* Bot intro */}
                  <div className="flex justify-start">
                    <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-[75%] shadow-sm">
                      <p className="text-[10px] text-emerald-700 font-semibold mb-1">🤖 {config.name}</p>
                      <p className="text-sm text-neutral-900">שלום! 👋 תודה על פנייתך. אני {config.name}, הסוכן האוטומטי שלנו. אנהל איתך שיחה קצרה לפני שנעביר אותך למגייס האנושי.</p>
                      <p className="text-sm text-neutral-900 mt-1">מוכן/ה להתחיל? 😊</p>
                      <p className="text-[10px] text-neutral-400 mt-1 text-right">10:00</p>
                    </div>
                  </div>

                  {/* Questions simulation */}
                  {config.questions
                    .filter(q => config.stages.find(s => s.id === q.stage)?.enabled)
                    .slice(0, 5)
                    .map((q, idx) => (
                    <div key={q.id}>
                      {/* Candidate answer placeholder */}
                      {idx > 0 && (
                        <div className="flex justify-end mb-3">
                          <div className="bg-[#dcf8c6] rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[75%] shadow-sm opacity-60">
                            <p className="text-xs text-neutral-500 italic">תשובת המועמד...</p>
                          </div>
                        </div>
                      )}
                      {/* Bot question */}
                      <div className="flex justify-start">
                        <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-[80%] shadow-sm">
                          <p className="text-[10px] text-emerald-700 font-semibold mb-1">🤖 {config.name}</p>
                          <div className="flex items-start gap-2">
                            <span className="text-xs text-neutral-400 mt-0.5 flex-shrink-0">שאלה {idx + 1}.</span>
                            <p className="text-sm text-neutral-900">{q.text}</p>
                          </div>
                          {q.required && (
                            <span className="inline-block mt-1 text-[10px] text-red-500 font-medium">* שאלת חובה</span>
                          )}
                          <p className="text-[10px] text-neutral-400 mt-1 text-right">10:0{idx + 1}</p>
                        </div>
                      </div>

                      {/* Agent annotation */}
                      <div className="flex items-center gap-2 py-1 px-2 mx-8 my-1 bg-violet-50 border border-violet-100 rounded-lg text-[11px] text-violet-600">
                        <Bot className="w-3 h-3 flex-shrink-0" />
                        <span>שלב: <strong>{STAGE_LABELS[q.stage] ?? q.stage}</strong> · משקל: {q.weight}%</span>
                      </div>
                    </div>
                  ))}

                  {/* Assignment trigger (if enabled) */}
                  {config.stages.find(s => s.id === "assignment")?.enabled && (
                    <div className="flex justify-start">
                      <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-[80%] shadow-sm border border-amber-200">
                        <p className="text-[10px] text-emerald-700 font-semibold mb-1">🤖 {config.name}</p>
                        <p className="text-sm text-neutral-900">
                          🎯 כל הכבוד! עברת את שלב הסינון בהצלחה.<br/>
                          השלב הבא הוא מטלה קצרה. קישור ישלח בהמשך.
                        </p>
                        <span className="inline-block mt-1.5 text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">שלב: מטלה</span>
                        <p className="text-[10px] text-neutral-400 mt-1 text-right">10:08</p>
                      </div>
                    </div>
                  )}

                  {/* Score threshold note */}
                  <div className="text-center mt-2">
                    <span className="bg-black/10 text-neutral-600 text-[11px] px-3 py-1 rounded-full">
                      ציון {config.auto_escalate_score}+ → הועבר למגייס אוטומטית
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-700">
                <Bot className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                <span>
                  זוהי סימולציה בלבד. השיחה האמיתית מותאמת דינמית לתשובות המועמד ולציון בזמן אמת.
                  שנה שאלות ושלבים בטאבים הקודמים ולחץ שמור כדי לעדכן.
                </span>
              </div>
            </>
          )}

        {/* Save button */}
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? "שומר..." : saved ? "✓ נשמר!" : "שמור הגדרות"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AgentPage() {
  const [tab, setTab] = useState<"conversations" | "config">("conversations");
  const [stats, setStats] = useState({ active: 0, waiting: 0, total: 0, avg_score: 0 });

  useEffect(() => {
    fetch("/api/agent/sessions")
      .then(r => r.json())
      .then(d => {
        const sessions: Session[] = d.data ?? [];
        setStats({
          active:    sessions.filter(s => s.status === "active").length,
          waiting:   sessions.filter(s => s.status === "waiting").length,
          total:     sessions.length,
          avg_score: sessions.length
            ? Math.round(sessions.reduce((a, s) => a + s.ai_score, 0) / sessions.length)
            : 0,
        });
      });
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
            <Bot className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-neutral-900">סוכן AI</h1>
            <p className="text-sm text-neutral-500">מנהל שיחות WhatsApp עם מועמדים בצורה אוטומטית</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full">
          <Circle className="w-2.5 h-2.5 text-emerald-500 fill-current animate-pulse" />
          <span className="text-sm font-medium text-emerald-700">פעיל</span>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "שיחות פעילות",   value: stats.active,    icon: <Zap className="w-4 h-4" />,      color: "text-emerald-600 bg-emerald-50" },
          { label: "ממתינים לתגובה", value: stats.waiting,   icon: <Clock className="w-4 h-4" />,     color: "text-amber-600 bg-amber-50" },
          { label: "סה״כ השבוע",     value: stats.total,     icon: <Users className="w-4 h-4" />,     color: "text-primary-600 bg-primary-50" },
          { label: "ציון ממוצע",     value: stats.avg_score, icon: <TrendingUp className="w-4 h-4" />, color: "text-violet-600 bg-violet-50" },
        ].map(k => (
          <div key={k.label} className="bg-white border border-neutral-200 rounded-xl p-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${k.color}`}>
              {k.icon}
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900">{k.value}</p>
              <p className="text-xs text-neutral-500">{k.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-lg w-fit">
        {[
          { id: "conversations", label: "שיחות",       icon: <MessageSquare className="w-4 h-4" /> },
          { id: "config",        label: "הגדרות סוכן", icon: <Settings2 className="w-4 h-4" /> },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as typeof tab)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              tab === t.id
                ? "bg-white text-neutral-900 shadow-sm"
                : "text-neutral-500 hover:text-neutral-700"
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "conversations" ? <ConversationsTab /> : <ConfigTab />}
    </div>
  );
}
