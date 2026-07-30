"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search, MessageSquare, Loader2, ChevronRight,
  Clock, CheckCircle
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { formatDate } from "@/lib/utils";
import type { Metadata } from "next";

// Fix: metadata can't be exported from client component — move to layout if needed

interface Job          { id: string; title: string }
interface LastMessage  { body: string; direction: string; created_at: string }
interface Conversation {
  id: string; full_name: string; phone: string;
  whatsapp_number: string | null; status: string;
  ai_score: number | null; updated_at: string;
  job: Job | null;
  last_message: LastMessage[] | null;
}
interface Message {
  id: string; direction: string; sender: string; body: string; created_at: string;
}
interface CandidateDetail {
  id: string; full_name: string; status: string;
  ai_score: number | null; ai_summary: string | null;
  job: Job | null;
}

const STATUS_VARIANT: Record<string, "neutral"|"info"|"success"|"danger"|"warning"|"primary"> = {
  new:                  "neutral",
  screening:            "info",
  whatsapp_interview:   "info",
  assignment_sent:      "warning",
  under_review:         "warning",
  shortlisted:          "success",
  rejected:             "danger",
  hired:                "success",
};
const STATUS_LABEL: Record<string, string> = {
  new: "חדש", screening: "סינון", whatsapp_interview: "ריאיון WA",
  assignment_sent: "מטלה", under_review: "בבחינה",
  shortlisted: "מועדף", rejected: "נדחה", hired: "התקבל",
};

function MessageBubble({ msg }: { msg: Message }) {
  const isInbound = msg.direction === "inbound";
  return (
    <div className={`flex ${isInbound ? "justify-start" : "justify-end"} mb-2`}>
      <div className={`max-w-xs lg:max-w-sm px-3.5 py-2 rounded-2xl text-sm ${
        isInbound
          ? "bg-neutral-100 text-neutral-800 rounded-tl-sm"
          : "bg-primary-600 text-white rounded-tr-sm"
      }`}>
        <p className="leading-relaxed">{msg.body}</p>
        <p className={`text-xs mt-1 ${isInbound ? "text-neutral-400" : "text-primary-200"}`}>
          {new Date(msg.created_at).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })}
          {!isInbound && <span className="mr-1">{msg.sender === "ai" ? "• AI" : "• מגייס"}</span>}
        </p>
      </div>
    </div>
  );
}

function ConversationsPageInner() {
  const router       = useSearchParams();
  const nav          = useRouter();
  const initialCid   = router.get("candidate") ?? "";

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading,        setLoading]       = useState(true);
  const [search,         setSearch]        = useState("");
  const [selectedId,     setSelectedId]    = useState<string>(initialCid);
  const [messages,       setMessages]      = useState<Message[]>([]);
  const [activeCandidate, setActiveCandidate] = useState<CandidateDetail | null>(null);
  const [threadLoading,  setThreadLoading] = useState(false);

  const loadConversations = useCallback(async (q = "") => {
    setLoading(true);
    try {
      const res  = await fetch(`/api/conversations?q=${encodeURIComponent(q)}`);
      const json = await res.json();
      if (json.success) setConversations(json.data.conversations ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  useEffect(() => {
    const t = setTimeout(() => loadConversations(search), 300);
    return () => clearTimeout(t);
  }, [search, loadConversations]);

  const loadThread = useCallback(async (candidateId: string) => {
    setSelectedId(candidateId);
    setThreadLoading(true);
    try {
      const res  = await fetch(`/api/conversations/${candidateId}`);
      const json = await res.json();
      if (json.success) {
        setMessages(json.data.messages ?? []);
        setActiveCandidate(json.data.candidate);
      }
    } finally {
      setThreadLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialCid) loadThread(initialCid);
  }, [initialCid, loadThread]);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">שיחות WhatsApp</h1>
          <p className="text-neutral-500 mt-0.5 text-sm">מרכז שיחות עם מועמדים</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-0 border border-neutral-200 rounded-xl overflow-hidden bg-white" style={{ height: "calc(100vh - 200px)", minHeight: 480 }}>

        {/* Conversations list */}
        <div className="lg:col-span-2 border-l border-neutral-200 flex flex-col">
          {/* Search */}
          <div className="p-3 border-b border-neutral-100">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="חיפוש מועמד..."
                className="w-full pr-9 pl-3 py-2 text-sm border border-neutral-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center items-center h-32">
                <Loader2 className="w-5 h-5 animate-spin text-neutral-400" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-neutral-400">
                <MessageSquare className="w-6 h-6 mb-2 opacity-40" />
                <p className="text-sm">אין שיחות</p>
              </div>
            ) : (
              conversations.map((conv) => {
                const last = Array.isArray(conv.last_message) && conv.last_message.length > 0
                  ? conv.last_message[0] : null;
                const isActive = selectedId === conv.id;
                return (
                  <button
                    key={conv.id}
                    onClick={() => loadThread(conv.id)}
                    className={`w-full text-right p-3 border-b border-neutral-100 hover:bg-neutral-50 transition-colors ${
                      isActive ? "bg-primary-50 border-r-2 border-r-primary-500" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar name={conv.full_name} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className={`text-sm font-medium truncate ${isActive ? "text-primary-700" : "text-neutral-900"}`}>
                            {conv.full_name}
                          </span>
                          <span className="text-xs text-neutral-400 flex-shrink-0">
                            {last ? formatDate(last.created_at) : formatDate(conv.updated_at)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Badge variant={STATUS_VARIANT[conv.status] ?? "neutral"} className="text-xs">
                            {STATUS_LABEL[conv.status] ?? conv.status}
                          </Badge>
                          {conv.job && <span className="text-xs text-neutral-400 truncate">{conv.job.title}</span>}
                        </div>
                        {last && (
                          <p className="text-xs text-neutral-400 mt-1 truncate">
                            {last.direction === "outbound" ? "אתה: " : ""}{last.body}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Thread panel */}
        <div className="lg:col-span-3 flex flex-col">
          {!selectedId ? (
            <div className="flex flex-col items-center justify-center h-full text-neutral-400">
              <MessageSquare className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm">בחר מועמד לצפייה בשיחה</p>
            </div>
          ) : (
            <>
              {/* Thread header */}
              {activeCandidate && (
                <div className="px-4 py-3 border-b border-neutral-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar name={activeCandidate.full_name} size="sm" />
                    <div>
                      <p className="text-sm font-medium text-neutral-900">{activeCandidate.full_name}</p>
                      <p className="text-xs text-neutral-400">{activeCandidate.job?.title}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {activeCandidate.ai_score != null && (
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                        activeCandidate.ai_score >= 80 ? "bg-green-100 text-green-700"
                        : activeCandidate.ai_score >= 55 ? "bg-amber-100 text-amber-700"
                        : "bg-red-100 text-red-700"
                      }`}>
                        {activeCandidate.ai_score}/100
                      </span>
                    )}
                    <button
                      onClick={() => nav.push(`/candidates/${activeCandidate.id}`)}
                      className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-medium transition-colors"
                    >
                      פרופיל מלא
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4">
                {threadLoading ? (
                  <div className="flex justify-center items-center h-32">
                    <Loader2 className="w-5 h-5 animate-spin text-neutral-400" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 text-neutral-400">
                    <Clock className="w-6 h-6 mb-2 opacity-40" />
                    <p className="text-sm">ריאיון WhatsApp טרם התחיל</p>
                  </div>
                ) : (
                  messages.map((msg) => <MessageBubble key={msg.id} msg={msg} />)
                )}
              </div>

              {/* Read-only notice */}
              <div className="px-4 py-2.5 border-t border-neutral-100 flex items-center gap-2 bg-neutral-50">
                <CheckCircle className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                <p className="text-xs text-neutral-500">תצוגה בלבד — ה-AI מנהל את השיחה אוטומטית</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ConversationsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64 text-neutral-400 text-sm">טוען...</div>}>
      <ConversationsPageInner />
    </Suspense>
  );
}
