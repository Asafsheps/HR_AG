"use client";

// ==================================================
// /chat/[token] — the candidate's interview
// ==================================================
// Public, no login. The token in the URL is the whole credential, which is
// why it is 24 random bytes rather than a sequential id.
//
// Deliberately plain: no score, no progress bar, no "you are 60% through".
// The candidate is being interviewed, not gamified, and showing progress
// invites gaming the remaining questions.

import { useEffect, useRef, useState, use } from "react";
import { Send, Loader2, Bot, CheckCircle2, AlertCircle } from "lucide-react";

interface Turn {
  role: "user" | "assistant";
  content: string;
  at: string;
}

interface SessionInfo {
  job_title:  string;
  agent_name: string;
  candidate:  string;
  turns:      Turn[];
  ended:      boolean;
}

export default function InterviewChatPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);

  const [info, setInfo]       = useState<SessionInfo | null>(null);
  const [turns, setTurns]     = useState<Turn[]>([]);
  const [draft, setDraft]     = useState("");
  const [sending, setSending] = useState(false);
  const [ended, setEnded]     = useState(false);
  const [error, setError]     = useState("");
  const [loadFailed, setLoadFailed] = useState("");

  const bottomRef = useRef<HTMLDivElement>(null);
  const openedRef = useRef(false);

  // Load the session, then ask for the opening greeting if it is fresh.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res  = await fetch(`/api/interview/${token}/message`);
        const data = await res.json();
        if (cancelled) return;

        if (!data.success) {
          setLoadFailed(data.error ?? "השיחה לא נמצאה");
          return;
        }

        setInfo(data.data);
        setTurns(data.data.turns);
        setEnded(data.data.ended);

        // A ref rather than state: React 18 mounts effects twice in dev and
        // without this the agent greets the candidate twice.
        if (data.data.turns.length === 0 && !data.data.ended && !openedRef.current) {
          openedRef.current = true;
          void send("");
        }
      } catch {
        if (!cancelled) setLoadFailed("שגיאת רשת");
      }
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns, sending]);

  async function send(message: string) {
    setSending(true);
    setError("");

    // Show the candidate's own message immediately; waiting for the round
    // trip makes the input feel broken.
    if (message.trim()) {
      setTurns(t => [...t, { role: "user", content: message, at: new Date().toISOString() }]);
      setDraft("");
    }

    try {
      const res  = await fetch(`/api/interview/${token}/message`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ message }),
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.error ?? "שגיאה בשליחה");
        return;
      }

      setTurns(t => [...t, { role: "assistant", content: data.data.reply, at: new Date().toISOString() }]);
      if (data.data.ended) setEnded(true);
    } catch {
      setError("שגיאת רשת. נסה לשלוח שוב.");
    } finally {
      setSending(false);
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const m = draft.trim();
    if (!m || sending || ended) return;
    void send(m);
  }

  if (loadFailed) {
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center gap-3 px-4 text-center" dir="rtl">
        <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center">
          <AlertCircle className="w-6 h-6 text-neutral-400" />
        </div>
        <h1 className="text-lg font-semibold text-neutral-800">{loadFailed}</h1>
        <p className="text-sm text-neutral-500">ייתכן שהקישור פג. אפשר להתחיל מחדש מדף המשרה.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col" dir="rtl">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 shrink-0">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="w-9 h-9 bg-primary-600 rounded-full flex items-center justify-center shrink-0">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-neutral-900 text-sm truncate">
              {info?.agent_name ?? "הסוכן"}
            </p>
            <p className="text-xs text-neutral-500 truncate">
              {info?.job_title ? `ריאיון לתפקיד ${info.job_title}` : "טוען…"}
            </p>
          </div>
        </div>
      </header>

      {/* Transcript */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
          {turns.map((t, i) => (
            <div key={i} className={t.role === "user" ? "flex justify-start" : "flex justify-end"}>
              <div
                className={
                  t.role === "user"
                    ? "max-w-[85%] bg-primary-600 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm leading-relaxed whitespace-pre-line"
                    : "max-w-[85%] bg-white border border-neutral-200 text-neutral-800 rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm leading-relaxed whitespace-pre-line"
                }
              >
                {t.content}
              </div>
            </div>
          ))}

          {sending && (
            <div className="flex justify-end">
              <div className="bg-white border border-neutral-200 rounded-2xl rounded-tl-sm px-4 py-3">
                <Loader2 className="w-4 h-4 text-neutral-400 animate-spin" />
              </div>
            </div>
          )}

          {ended && (
            <div className="flex flex-col items-center gap-2 pt-6 text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              <p className="font-medium text-neutral-800">תודה, נחזור אליך</p>
              <p className="text-sm text-neutral-500 max-w-sm">
                הפרטים שלך נשמרו. אם יש התאמה לתפקיד ניצור קשר בהמשך.
              </p>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </main>

      {/* Composer */}
      {!ended && (
        <footer className="bg-white border-t border-neutral-200 shrink-0">
          <div className="max-w-2xl mx-auto px-4 py-3">
            {error && (
              <p className="text-xs text-red-600 mb-2">{error}</p>
            )}
            <form onSubmit={onSubmit} className="flex items-end gap-2">
              <textarea
                value={draft}
                onChange={e => setDraft(e.target.value)}
                onKeyDown={e => {
                  // Enter sends, Shift+Enter breaks the line — what people
                  // expect from a chat, not from a form.
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    onSubmit(e);
                  }
                }}
                rows={1}
                disabled={sending}
                placeholder="כתוב את תשובתך…"
                className="flex-1 resize-none px-3 py-2.5 border border-neutral-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-neutral-50 max-h-32"
              />
              <button
                type="submit"
                disabled={!draft.trim() || sending}
                className="shrink-0 w-10 h-10 flex items-center justify-center bg-primary-600 hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl transition-colors"
                aria-label="שלח"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </footer>
      )}
    </div>
  );
}
