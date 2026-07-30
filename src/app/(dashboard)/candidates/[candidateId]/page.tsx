"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowRight, Mail, Phone, Linkedin, Globe, MessageSquare,
  FileText, Star, ChevronDown, Plus, Trash2, Loader2,
  CheckCircle, XCircle, Clock, ClipboardList, Send,
  ExternalLink, AlertCircle, CheckCircle2, X,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { formatDate } from "@/lib/utils";

// ─── Types ──────────────────────────────────────────────────────────────────

interface Job       { id: string; title: string; department?: string; location?: string }
interface Candidate {
  id: string; full_name: string; email: string; phone: string;
  whatsapp_number: string | null; linkedin_url: string | null;
  portfolio_url: string | null; cover_letter: string | null;
  cv_url: string | null; cv_parsed_data: Record<string, unknown> | null;
  status: string; ai_score: number | null; ai_summary: string | null;
  whatsapp_consent: boolean; screening_answers: Record<string, unknown>;
  source: string | null; created_at: string; job: Job;
}
interface Message { id: string; direction: string; sender: string; body: string; created_at: string }
interface Note    {
  id: string; content: string; created_at: string; updated_at: string;
  recruiter: { full_name: string; avatar_url: string | null }
}
interface AssignmentSubmission {
  type: string; content: string; submitted_at: string;
  evaluation_score: number | null; evaluation_feedback: string | null; evaluated_at: string | null;
}
interface Assignment {
  id: string; candidate_id: string; title: string; description: string;
  instructions: string; deadline_hours: number; status: string;
  sent_at: string | null; submission: AssignmentSubmission | null;
  whatsapp_message: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: "new",                  label: "חדש" },
  { value: "screening",            label: "סינון" },
  { value: "whatsapp_interview",   label: "ריאיון WhatsApp" },
  { value: "assignment_sent",      label: "מטלה נשלחה" },
  { value: "assignment_submitted", label: "מטלה הוגשה" },
  { value: "under_review",         label: "בבחינה" },
  { value: "shortlisted",          label: "מועדף" },
  { value: "rejected",             label: "נדחה" },
  { value: "hired",                label: "התקבל" },
  { value: "withdrawn",            label: "נסוג" },
];

const STATUS_VARIANT: Record<string, "neutral"|"info"|"success"|"danger"|"warning"|"primary"> = {
  new:                  "neutral",
  screening:            "info",
  whatsapp_interview:   "info",
  assignment_sent:      "warning",
  assignment_submitted: "warning",
  under_review:         "warning",
  shortlisted:          "success",
  rejected:             "danger",
  hired:                "success",
  withdrawn:            "neutral",
};

// ─── Score Bar ────────────────────────────────────────────────────────────────

function ScoreBar({ score }: { score: number | null }) {
  if (score === null) return (
    <div className="flex items-center gap-2 text-neutral-400 text-sm">
      <Clock className="w-4 h-4" /> ממתין לניתוח
    </div>
  );
  const color = score >= 80 ? "bg-green-500" : score >= 55 ? "bg-amber-500" : "bg-red-500";
  const textColor = score >= 80 ? "text-green-700" : score >= 55 ? "text-amber-700" : "text-red-700";
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm font-medium">
        <span className={textColor}>ציון AI</span>
        <span className={`text-lg font-bold ${textColor}`}>{score}/100</span>
      </div>
      <div className="w-full bg-neutral-100 rounded-full h-2.5">
        <div className={`${color} h-2.5 rounded-full transition-all`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

// ─── Message Bubble ───────────────────────────────────────────────────────────

function MessageBubble({ msg }: { msg: Message }) {
  const isInbound = msg.direction === "inbound";
  return (
    <div className={`flex ${isInbound ? "justify-start" : "justify-end"} mb-2`}>
      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl text-sm ${
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

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CandidateProfilePage() {
  const params   = useParams();
  const router   = useRouter();
  const id       = params.candidateId as string;

  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [messages,  setMessages]  = useState<Message[]>([]);
  const [notes,     setNotes]     = useState<Note[]>([]);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [tab,       setTab]       = useState<"overview"|"conversation"|"notes"|"assignment">("overview");
  const [noteText,  setNoteText]  = useState("");
  const [saving,    setSaving]    = useState(false);
  const [statusChanging, setStatusChanging] = useState(false);
  // Assignment modal state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignForm, setAssignForm] = useState({ title: "", description: "", instructions: "", deadline_hours: 48 });
  const [assignGenerating, setAssignGenerating] = useState(false);
  const [assignSending, setAssignSending] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [candRes, assignRes] = await Promise.all([
        fetch(`/api/candidates/${id}`),
        fetch(`/api/assignments?candidate_id=${id}`),
      ]);
      const candJson   = await candRes.json();
      const assignJson = await assignRes.json();
      if (candJson.success) {
        setCandidate(candJson.data.candidate);
        setMessages(candJson.data.messages);
        setNotes(candJson.data.notes);
      }
      if (assignJson.success && assignJson.data?.length > 0) {
        setAssignment(assignJson.data[0]);
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Generate AI assignment
  const generateAssignment = async () => {
    setAssignGenerating(true);
    try {
      const res  = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidate_id: id, deadline_hours: assignForm.deadline_hours }),
      });
      const json = await res.json();
      if (json.success) {
        setAssignForm({
          title:         json.data.title,
          description:   json.data.description,
          instructions:  json.data.instructions,
          deadline_hours: json.data.deadline_hours,
        });
      }
    } finally {
      setAssignGenerating(false);
    }
  };

  // Send assignment (creates + marks sent)
  const sendAssignment = async () => {
    setAssignSending(true);
    try {
      const res  = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidate_id: id, ...assignForm }),
      });
      const json = await res.json();
      if (json.success) {
        setAssignment(json.data);
        setShowAssignModal(false);
        setTab("assignment");
        // Also update candidate status
        await fetch(`/api/candidates/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "assignment_sent" }),
        });
        setCandidate(prev => prev ? { ...prev, status: "assignment_sent" } : prev);
      }
    } finally {
      setAssignSending(false);
    }
  };

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (status: string) => {
    if (!candidate) return;
    setStatusChanging(true);
    try {
      await fetch(`/api/candidates/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      setCandidate((prev) => prev ? { ...prev, status } : prev);
    } finally {
      setStatusChanging(false);
    }
  };

  const addNote = async () => {
    if (!noteText.trim()) return;
    setSaving(true);
    try {
      const res  = await fetch(`/api/candidates/${id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: noteText.trim() }),
      });
      const json = await res.json();
      if (json.success) {
        setNotes((prev) => [json.data, ...prev]);
        setNoteText("");
      }
    } finally {
      setSaving(false);
    }
  };

  const deleteNote = async (noteId: string) => {
    await fetch(`/api/candidates/${id}/notes?note_id=${noteId}`, { method: "DELETE" });
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="text-center py-16">
        <p className="text-neutral-500">מועמד לא נמצא</p>
        <Button variant="secondary" onClick={() => router.back()} className="mt-4">חזור</Button>
      </div>
    );
  }

  const statusVariant = STATUS_VARIANT[candidate.status] ?? "neutral";
  const statusLabel   = STATUS_OPTIONS.find((s) => s.value === candidate.status)?.label ?? candidate.status;

  return (
    <div className="max-w-6xl mx-auto space-y-6">

      {/* Back + Header */}
      <div className="flex items-start gap-4">
        <button onClick={() => router.back()} className="mt-1 p-1.5 rounded-md hover:bg-neutral-100 transition-colors">
          <ArrowRight className="w-5 h-5 text-neutral-500" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <Avatar name={candidate.full_name} size="lg" />
            <div>
              <h1 className="text-2xl font-semibold text-neutral-900">{candidate.full_name}</h1>
              <p className="text-neutral-500 text-sm">{candidate.job?.title} · הגיש {formatDate(candidate.created_at)}</p>
            </div>
            <div className="flex items-center gap-2 mr-auto flex-wrap">
              <Badge variant={statusVariant}>{statusLabel}</Badge>
              {/* Send assignment button */}
              {!assignment && (
                <button
                  onClick={() => setShowAssignModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-amber-50 border border-amber-300 text-amber-700 rounded-md hover:bg-amber-100 transition-colors font-medium"
                >
                  <Send className="w-3 h-3" />
                  שלח מטלה
                </button>
              )}
              {/* Status dropdown */}
              <div className="relative group">
                <button
                  disabled={statusChanging}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs border border-neutral-200 rounded-md hover:bg-neutral-50 transition-colors disabled:opacity-50"
                >
                  {statusChanging ? <Loader2 className="w-3 h-3 animate-spin" /> : <ChevronDown className="w-3 h-3" />}
                  שנה שלב
                </button>
                <div className="absolute left-0 top-full mt-1 w-44 bg-white border border-neutral-200 rounded-lg shadow-lg z-10 hidden group-hover:block">
                  {STATUS_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => updateStatus(opt.value)}
                      className={`w-full text-right px-4 py-2 text-sm hover:bg-neutral-50 transition-colors ${
                        candidate.status === opt.value ? "text-primary-600 font-medium" : "text-neutral-700"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left: Contact + Score */}
        <div className="space-y-4">

          {/* Contact info */}
          <Card>
            <h3 className="text-sm font-semibold text-neutral-700 mb-3">פרטי קשר</h3>
            <div className="space-y-2.5">
              <a href={`mailto:${candidate.email}`} className="flex items-center gap-2 text-sm text-neutral-600 hover:text-primary-600 transition-colors">
                <Mail className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                {candidate.email}
              </a>
              <div className="flex items-center gap-2 text-sm text-neutral-600">
                <Phone className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                {candidate.phone}
              </div>
              {candidate.linkedin_url && (
                <a href={candidate.linkedin_url} target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 text-sm text-neutral-600 hover:text-primary-600 transition-colors">
                  <Linkedin className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                  LinkedIn
                </a>
              )}
              {candidate.portfolio_url && (
                <a href={candidate.portfolio_url} target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 text-sm text-neutral-600 hover:text-primary-600 transition-colors">
                  <Globe className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                  Portfolio
                </a>
              )}
              {candidate.cv_url && (
                <a href={candidate.cv_url} target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 transition-colors font-medium">
                  <FileText className="w-4 h-4 flex-shrink-0" />
                  הורד קורות חיים
                </a>
              )}
            </div>
          </Card>

          {/* AI Score */}
          <Card>
            <h3 className="text-sm font-semibold text-neutral-700 mb-3 flex items-center gap-1.5">
              <Star className="w-4 h-4 text-amber-500" /> ניתוח AI
            </h3>
            <ScoreBar score={candidate.ai_score} />
            {candidate.ai_summary && (
              <p className="text-sm text-neutral-600 mt-3 leading-relaxed">{candidate.ai_summary}</p>
            )}
          </Card>

          {/* WhatsApp status */}
          <Card>
            <h3 className="text-sm font-semibold text-neutral-700 mb-2">WhatsApp</h3>
            <div className="flex items-center gap-2 text-sm">
              {candidate.whatsapp_consent ? (
                <><CheckCircle className="w-4 h-4 text-green-500" /><span className="text-green-700">הסכמה לקבלת הודעות</span></>
              ) : (
                <><XCircle className="w-4 h-4 text-neutral-400" /><span className="text-neutral-500">ללא הסכמה</span></>
              )}
            </div>
            {candidate.whatsapp_number && (
              <p className="text-xs text-neutral-400 mt-1">{candidate.whatsapp_number}</p>
            )}
            {messages.length > 0 && (
              <button
                onClick={() => setTab("conversation")}
                className="mt-2 flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-medium transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                {messages.length} הודעות בשיחה
              </button>
            )}
          </Card>
        </div>

        {/* Right: Tabs */}
        <div className="lg:col-span-2 space-y-4">

          {/* Tab bar */}
          <div className="flex gap-1 border-b border-neutral-200">
            {(["overview", "conversation", "notes", "assignment"] as const).map((t) => {
              const labels: Record<string, string> = {
                overview:   "סקירה",
                conversation: `שיחה (${messages.length})`,
                notes:      `הערות (${notes.length})`,
                assignment: assignment ? `מטלה · ${
                  assignment.status === "evaluated" ? "הוערכה ✓" :
                  assignment.status === "submitted" ? "הוגשה ✓" :
                  assignment.status === "sent"      ? "ממתינה" : "טיוטה"
                }` : "מטלה",
              };
              return (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                    tab === t
                      ? "border-primary-600 text-primary-600"
                      : "border-transparent text-neutral-500 hover:text-neutral-700"
                  }`}
                >
                  {t === "assignment" && <ClipboardList className="w-3.5 h-3.5" />}
                  {labels[t]}
                </button>
              );
            })}
          </div>

          {/* Overview tab */}
          {tab === "overview" && (
            <div className="space-y-4">

              {/* Cover letter */}
              {candidate.cover_letter && (
                <Card>
                  <h3 className="text-sm font-semibold text-neutral-700 mb-2">מכתב מוטיבציה</h3>
                  <p className="text-sm text-neutral-600 leading-relaxed whitespace-pre-wrap">{candidate.cover_letter}</p>
                </Card>
              )}

              {/* Screening answers */}
              {Object.keys(candidate.screening_answers ?? {}).length > 0 && (
                <Card>
                  <h3 className="text-sm font-semibold text-neutral-700 mb-3">תשובות לשאלות סינון</h3>
                  <div className="space-y-3">
                    {Object.entries(candidate.screening_answers).map(([q, a]) => (
                      <div key={q} className="text-sm">
                        <p className="font-medium text-neutral-700">{q}</p>
                        <p className="text-neutral-500 mt-0.5">{String(a)}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* CV parsed data */}
              {candidate.cv_parsed_data && (
                <Card>
                  <h3 className="text-sm font-semibold text-neutral-700 mb-3">נתוני קורות חיים (AI)</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {(candidate.cv_parsed_data as Record<string, unknown>).experience_years != null && (
                      <div>
                        <p className="text-neutral-400 text-xs">ניסיון</p>
                        <p className="font-medium text-neutral-800">{String((candidate.cv_parsed_data as Record<string, unknown>).experience_years)} שנים</p>
                      </div>
                    )}
                    {Array.isArray((candidate.cv_parsed_data as Record<string, unknown>).skills) && (
                      <div className="col-span-2">
                        <p className="text-neutral-400 text-xs mb-1.5">כישורים</p>
                        <div className="flex flex-wrap gap-1.5">
                          {((candidate.cv_parsed_data as Record<string, unknown>).skills as string[]).slice(0, 15).map((s) => (
                            <span key={s} className="px-2 py-0.5 bg-neutral-100 rounded text-xs text-neutral-700">{s}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              )}

              {(!candidate.cover_letter && Object.keys(candidate.screening_answers ?? {}).length === 0 && !candidate.cv_parsed_data) && (
                <Card>
                  <p className="text-neutral-400 text-sm text-center py-4">אין מידע נוסף</p>
                </Card>
              )}
            </div>
          )}

          {/* Conversation tab */}
          {tab === "conversation" && (
            <Card padding="none">
              <div className="px-4 py-3 border-b border-neutral-100 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-neutral-400" />
                <span className="text-sm font-medium text-neutral-700">שיחת WhatsApp</span>
              </div>
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-neutral-400">
                  <MessageSquare className="w-8 h-8 mb-2 opacity-40" />
                  <p className="text-sm">אין הודעות עדיין</p>
                </div>
              ) : (
                <div className="p-4 space-y-1 max-h-[520px] overflow-y-auto">
                  {messages.map((msg) => (
                    <MessageBubble key={msg.id} msg={msg} />
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* Assignment tab */}
          {tab === "assignment" && (
            <div className="space-y-4">
              {!assignment ? (
                /* ── No assignment yet ── */
                <Card>
                  <div className="flex flex-col items-center py-10 gap-4">
                    <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center">
                      <ClipboardList className="w-7 h-7 text-amber-500" />
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-neutral-800">לא נשלחה מטלה עדיין</p>
                      <p className="text-sm text-neutral-500 mt-1 max-w-xs">
                        שלח מטלה למועמד דרך WhatsApp. הסוכן יצור מטלה מותאמת אישית לפי תיאור התפקיד ופרופיל המועמד.
                      </p>
                    </div>
                    <button
                      onClick={() => setShowAssignModal(true)}
                      className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      <Send className="w-4 h-4" />
                      שלח מטלה למועמד
                    </button>
                  </div>
                </Card>
              ) : (
                /* ── Assignment exists ── */
                <div className="space-y-4">

                  {/* Status banner */}
                  <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium ${
                    assignment.status === "evaluated" ? "bg-emerald-50 border-emerald-200 text-emerald-800" :
                    assignment.status === "submitted" ? "bg-blue-50 border-blue-200 text-blue-800" :
                    assignment.status === "sent"      ? "bg-amber-50 border-amber-200 text-amber-800" :
                                                        "bg-neutral-50 border-neutral-200 text-neutral-600"
                  }`}>
                    {assignment.status === "evaluated" ? <CheckCircle2 className="w-4 h-4" /> :
                     assignment.status === "submitted" ? <CheckCircle className="w-4 h-4" /> :
                     assignment.status === "sent"      ? <Clock className="w-4 h-4" /> :
                                                         <AlertCircle className="w-4 h-4" />}
                    <span>
                      {assignment.status === "evaluated" ? "המטלה הוגשה והוערכה" :
                       assignment.status === "submitted" ? "המטלה הוגשה — ממתינה להערכה" :
                       assignment.status === "sent"      ? `המטלה נשלחה — ממתין להגשה (${assignment.deadline_hours} שעות)` :
                                                           "טיוטה — לא נשלחה עדיין"}
                    </span>
                    {assignment.sent_at && (
                      <span className="mr-auto text-xs opacity-60">{formatDate(assignment.sent_at)}</span>
                    )}
                  </div>

                  {/* Assignment details */}
                  <Card>
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-neutral-900">{assignment.title}</h3>
                      <span className="text-xs text-neutral-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {assignment.deadline_hours} שעות
                      </span>
                    </div>
                    <p className="text-sm text-neutral-600 mb-3">{assignment.description}</p>
                    <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3">
                      <p className="text-xs font-medium text-neutral-500 mb-1.5">הוראות:</p>
                      <pre className="text-xs text-neutral-700 whitespace-pre-wrap font-sans leading-relaxed">{assignment.instructions}</pre>
                    </div>
                  </Card>

                  {/* WhatsApp message preview */}
                  <Card>
                    <h3 className="text-sm font-semibold text-neutral-700 mb-3 flex items-center gap-1.5">
                      <MessageSquare className="w-4 h-4 text-[#25D366]" />
                      הודעת WhatsApp שנשלחה
                    </h3>
                    <div className="bg-[#e5ddd5] rounded-xl p-3">
                      <div className="bg-white rounded-xl px-4 py-3 max-w-xs text-sm text-neutral-800 whitespace-pre-wrap leading-relaxed shadow-sm">
                        {assignment.whatsapp_message}
                      </div>
                    </div>
                  </Card>

                  {/* Submission */}
                  {assignment.submission && (
                    <Card>
                      <h3 className="text-sm font-semibold text-neutral-700 mb-3 flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-primary-500" />
                        הגשת המועמד
                        <span className="text-xs text-neutral-400 font-normal mr-auto">
                          {formatDate(assignment.submission.submitted_at)}
                        </span>
                      </h3>
                      {assignment.submission.type === "url" ? (
                        <a
                          href={assignment.submission.content}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 border border-primary-200 rounded-lg text-sm text-primary-700 hover:bg-primary-100 transition-colors font-medium"
                        >
                          <ExternalLink className="w-4 h-4" />
                          {assignment.submission.content}
                        </a>
                      ) : (
                        <p className="text-sm text-neutral-700 bg-neutral-50 border border-neutral-200 rounded-lg p-3 leading-relaxed whitespace-pre-wrap">
                          {assignment.submission.content}
                        </p>
                      )}

                      {/* Evaluation */}
                      {assignment.submission.evaluation_score !== null ? (
                        <div className="mt-4 space-y-2">
                          <div className="flex items-center gap-3">
                            <p className="text-sm font-medium text-neutral-700">ציון הערכה:</p>
                            <span className={`text-lg font-bold ${
                              (assignment.submission.evaluation_score ?? 0) >= 80 ? "text-emerald-600" :
                              (assignment.submission.evaluation_score ?? 0) >= 60 ? "text-amber-600" : "text-red-500"
                            }`}>
                              {assignment.submission.evaluation_score}/100
                            </span>
                          </div>
                          <div className="w-full bg-neutral-100 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                (assignment.submission.evaluation_score ?? 0) >= 80 ? "bg-emerald-500" :
                                (assignment.submission.evaluation_score ?? 0) >= 60 ? "bg-amber-500" : "bg-red-500"
                              }`}
                              style={{ width: `${assignment.submission.evaluation_score}%` }}
                            />
                          </div>
                          {assignment.submission.evaluation_feedback && (
                            <p className="text-sm text-neutral-600 bg-neutral-50 border border-neutral-100 rounded-lg p-3 leading-relaxed">
                              {assignment.submission.evaluation_feedback}
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="mt-3 flex items-center gap-2 text-sm text-neutral-500">
                          <AlertCircle className="w-4 h-4" />
                          טרם הוערכה — לחץ להעריך עם AI
                        </div>
                      )}
                    </Card>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Notes tab */}
          {tab === "notes" && (
            <div className="space-y-4">
              {/* Add note */}
              <Card>
                <h3 className="text-sm font-semibold text-neutral-700 mb-3 flex items-center gap-1.5">
                  <Plus className="w-4 h-4" /> הוסף הערה
                </h3>
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="רשום הערה, תיעוד שיחה, רושם כללי..."
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder-neutral-400"
                />
                <div className="flex justify-end mt-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={addNote}
                    disabled={!noteText.trim() || saving}
                  >
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                    שמור הערה
                  </Button>
                </div>
              </Card>

              {/* Notes list */}
              {notes.length === 0 ? (
                <Card>
                  <p className="text-neutral-400 text-sm text-center py-6">אין הערות עדיין</p>
                </Card>
              ) : (
                <div className="space-y-3">
                  {notes.map((note) => (
                    <Card key={note.id}>
                      <div className="flex items-start gap-3">
                        <Avatar name={note.recruiter.full_name} size="sm" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-neutral-700">{note.recruiter.full_name}</span>
                              <span className="text-xs text-neutral-400">{formatDate(note.created_at)}</span>
                            </div>
                            <button
                              onClick={() => deleteNote(note.id)}
                              className="p-1 rounded hover:bg-neutral-100 text-neutral-400 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <p className="text-sm text-neutral-700 leading-relaxed whitespace-pre-wrap">{note.content}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Send Assignment Modal ── */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                  <ClipboardList className="w-4 h-4 text-amber-600" />
                </div>
                <h2 className="font-semibold text-neutral-900">שלח מטלה ל{candidate?.full_name}</h2>
              </div>
              <button onClick={() => setShowAssignModal(false)} className="text-neutral-400 hover:text-neutral-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal body */}
            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
              {/* AI generate */}
              <button
                onClick={generateAssignment}
                disabled={assignGenerating}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-dashed border-primary-300 rounded-xl text-sm text-primary-700 hover:bg-primary-50 transition-colors font-medium disabled:opacity-50"
              >
                {assignGenerating
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> יוצר מטלה עם AI...</>
                  : <><Star className="w-4 h-4" /> צור מטלה אוטומטית עם AI</>}
              </button>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-neutral-700">כותרת המטלה</label>
                  <input
                    value={assignForm.title}
                    onChange={e => setAssignForm({ ...assignForm, title: e.target.value })}
                    placeholder="לדוגמה: מטלה טכנית — בניית REST API"
                    className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-neutral-700">תיאור קצר</label>
                  <textarea
                    value={assignForm.description}
                    onChange={e => setAssignForm({ ...assignForm, description: e.target.value })}
                    placeholder="תיאור קצר שיוצג למועמד"
                    rows={2}
                    className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-neutral-700">הוראות מפורטות</label>
                  <textarea
                    value={assignForm.instructions}
                    onChange={e => setAssignForm({ ...assignForm, instructions: e.target.value })}
                    placeholder="פרט את המשימה, מה לשלוח, איך להגיש..."
                    rows={5}
                    className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none font-mono text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-neutral-700">זמן להגשה</label>
                  <div className="flex gap-2">
                    {[24, 48, 72, 96].map(h => (
                      <button key={h} onClick={() => setAssignForm({ ...assignForm, deadline_hours: h })}
                        className={`flex-1 py-2 text-sm rounded-lg border font-medium transition-colors ${
                          assignForm.deadline_hours === h
                            ? "border-primary-600 bg-primary-50 text-primary-700"
                            : "border-neutral-200 text-neutral-600 hover:border-neutral-300"
                        }`}>
                        {h < 48 ? `${h}ש׳` : `${h / 24} ימים`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* WhatsApp preview */}
              <div className="bg-[#e5ddd5] rounded-xl p-3">
                <p className="text-xs font-medium text-neutral-500 mb-2">תצוגה מקדימה — הודעת WhatsApp</p>
                <div className="bg-white rounded-xl px-3 py-2.5 max-w-[85%] text-xs text-neutral-800 leading-relaxed shadow-sm whitespace-pre-wrap">
                  {`שלום ${candidate?.full_name}! 🎯\n\nעברת את שלב הסינון בהצלחה!\nהשלב הבא הוא מטלה — "${assignForm.title || "כותרת המטלה"}".\n\n⏰ זמן: ${assignForm.deadline_hours} שעות\n📎 קישור למטלה ישלח בהודעה הבאה\n\nבהצלחה! 💪`}
                </div>
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-200 bg-neutral-50 rounded-b-2xl">
              <p className="text-xs text-neutral-400">
                {candidate?.whatsapp_number
                  ? `ישלח ל: ${candidate.whatsapp_number}`
                  : "⚠ אין מספר WhatsApp — ישלח בלינק בלבד"}
              </p>
              <div className="flex items-center gap-2">
                <button onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 text-sm text-neutral-600 hover:text-neutral-800 transition-colors">
                  ביטול
                </button>
                <button onClick={sendAssignment} disabled={!assignForm.title || assignSending}
                  className="flex items-center gap-2 px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50">
                  {assignSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {assignSending ? "שולח..." : "שלח מטלה"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
