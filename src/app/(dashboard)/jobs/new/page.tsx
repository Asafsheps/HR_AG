"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import {
  Briefcase, FileText, HelpCircle, ShieldX,
  Sparkles, Plus, Trash2, ChevronRight, ChevronLeft, Check
} from "lucide-react";
import type { ScreeningQuestionInput, RejectionRuleInput } from "@/lib/validators/job";

// ── Wizard steps ────────────────────────────────
const STEPS = [
  { id: 1, label: "פרטי המשרה",    icon: Briefcase },
  { id: 2, label: "תיאור ודרישות",  icon: FileText },
  { id: 3, label: "שאלות סינון",   icon: HelpCircle },
  { id: 4, label: "חוקי דחייה",    icon: ShieldX },
];

// ── Default screening questions ─────────────────
const DEFAULT_QUESTIONS: ScreeningQuestionInput[] = [
  { id: "q1", question: "כמה שנות ניסיון יש לך בתחום?", type: "numeric",   required: true,  weight: 8 },
  { id: "q2", question: "האם יש לך ניסיון עם...",         type: "yes_no",    required: true,  weight: 7 },
  { id: "q3", question: "מדוע אתה מעוניין בתפקיד זה?",   type: "open",      required: true,  weight: 6 },
];

export default function NewJobPage() {
  const router = useRouter();
  const [step, setStep]       = useState(1);
  const [saving, setSaving]   = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  // Step 1 — basic info
  const [title, setTitle]           = useState("");
  const [department, setDepartment] = useState("");
  const [location, setLocation]     = useState("");
  const [empType, setEmpType]       = useState("full_time");
  const [aiInstructions, setAiInstructions] = useState("");

  // Step 2 — description
  const [description, setDescription] = useState("");
  const [requirements, setRequirements] = useState<string[]>([""]);
  const [cultureFit, setCultureFit]   = useState("");

  // Step 3 — questions
  const [questions, setQuestions] = useState<ScreeningQuestionInput[]>(DEFAULT_QUESTIONS);

  // Step 4 — rejection rules
  const [rules, setRules] = useState<RejectionRuleInput[]>([]);

  // ── AI: generate description ─────────────────
  async function generateDescription() {
    if (!title) return;
    setAiLoading(true);
    try {
      const res = await fetch("/api/ai/job-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, department, requirements: requirements.filter(Boolean).join(", ") }),
      });
      const data = await res.json();
      if (data.success) setDescription(data.data.description);
    } finally {
      setAiLoading(false);
    }
  }

  // ── Requirements helpers ─────────────────────
  function updateReq(i: number, v: string) {
    setRequirements(r => r.map((x, idx) => idx === i ? v : x));
  }
  function addReq() { setRequirements(r => [...r, ""]); }
  function removeReq(i: number) { setRequirements(r => r.filter((_, idx) => idx !== i)); }

  // ── Questions helpers ────────────────────────
  function addQuestion() {
    setQuestions(q => [...q, {
      id:       `q${Date.now()}`,
      question: "",
      type:     "open",
      required: true,
      weight:   5,
    }]);
  }
  function updateQuestion(id: string, field: string, value: unknown) {
    setQuestions(q => q.map(x => x.id === id ? { ...x, [field]: value } : x));
  }
  function removeQuestion(id: string) {
    setQuestions(q => q.filter(x => x.id !== id));
  }

  // ── Rules helpers ────────────────────────────
  function addRule() {
    setRules(r => [...r, {
      id:       `r${Date.now()}`,
      field:    "experience_years",
      operator: "less_than",
      value:    0,
      reason:   "",
    }]);
  }
  function updateRule(id: string, field: string, value: unknown) {
    setRules(r => r.map(x => x.id === id ? { ...x, [field]: value } : x));
  }
  function removeRule(id: string) {
    setRules(r => r.filter(x => x.id !== id));
  }

  // ── Save ─────────────────────────────────────
  async function handleSave(publish = false) {
    setSaving(true);
    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title, department, location,
          employment_type:          empType,
          description,
          requirements:             requirements.filter(Boolean),
          culture_fit_expectations: cultureFit,
          screening_questions:      questions,
          rejection_rules:          rules,
          ai_instructions:          aiInstructions,
          status:                   publish ? "active" : "draft",
        }),
      });
      const data = await res.json();
      if (data.success) {
        router.push(`/jobs/${data.data.id}`);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      {/* Page title */}
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">משרה חדשה</h1>
        <p className="text-neutral-500 mt-0.5">עוזר AI יעזור לך בכל שלב</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-0">
        {STEPS.map((s, i) => {
          const done    = step > s.id;
          const current = step === s.id;
          return (
            <div key={s.id} className="flex items-center flex-1 last:flex-none">
              <button
                onClick={() => done && setStep(s.id)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  current  && "bg-primary-600 text-white",
                  done     && "text-primary-600 hover:bg-primary-50 cursor-pointer",
                  !current && !done && "text-neutral-400 cursor-default"
                )}
              >
                {done
                  ? <Check className="w-4 h-4" />
                  : <s.icon className="w-4 h-4" />
                }
                <span className="hidden sm:inline">{s.label}</span>
              </button>
              {i < STEPS.length - 1 && (
                <div className={cn("flex-1 h-px mx-1", done ? "bg-primary-300" : "bg-neutral-200")} />
              )}
            </div>
          );
        })}
      </div>

      {/* ── STEP 1: Basic info ── */}
      {step === 1 && (
        <Card>
          <h2 className="font-semibold text-neutral-900 mb-5">פרטי המשרה</h2>
          <div className="space-y-4">
            <Input label="שם התפקיד" required value={title} onChange={e => setTitle(e.target.value)} placeholder="למשל: Data Analyst" />
            <div className="grid grid-cols-2 gap-4">
              <Input label="מחלקה" value={department} onChange={e => setDepartment(e.target.value)} placeholder="BI, Engineering..." />
              <Input label="מיקום" value={location} onChange={e => setLocation(e.target.value)} placeholder="תל אביב / Remote" />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">סוג משרה</label>
              <select value={empType} onChange={e => setEmpType(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                <option value="full_time">משרה מלאה</option>
                <option value="part_time">משרה חלקית</option>
                <option value="contract">פרילנס / קבלן</option>
                <option value="internship">התמחות</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                הנחיות לעוזר AI
                <span className="text-neutral-400 font-normal mr-1">(אופציונלי)</span>
              </label>
              <textarea value={aiInstructions} onChange={e => setAiInstructions(e.target.value)} rows={3}
                placeholder="לדוגמה: מועמד חייב להיות דובר אנגלית ברמת שפת אם, ניסיון בסטארטאפ מועדף..."
                className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none" />
            </div>
          </div>
        </Card>
      )}

      {/* ── STEP 2: Description & requirements ── */}
      {step === 2 && (
        <Card>
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-neutral-900">תיאור ודרישות</h2>
            <Button variant="secondary" size="sm" loading={aiLoading} onClick={generateDescription} disabled={!title}>
              <Sparkles className="w-4 h-4 text-primary-600" />
              כתוב עם AI
            </Button>
          </div>
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">תיאור המשרה</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={8}
                placeholder="תיאור התפקיד, אחריות, מה הצוות עושה..."
                className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-neutral-700">דרישות</label>
                <button onClick={addReq} className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1">
                  <Plus className="w-3 h-3" /> הוסף דרישה
                </button>
              </div>
              <div className="space-y-2">
                {requirements.map((req, i) => (
                  <div key={i} className="flex gap-2">
                    <input value={req} onChange={e => updateReq(i, e.target.value)}
                      placeholder={`דרישה ${i + 1}`}
                      className="flex-1 px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                    {requirements.length > 1 && (
                      <button onClick={() => removeReq(i)} className="p-2 text-neutral-400 hover:text-danger">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                התאמה תרבותית
                <span className="text-neutral-400 font-normal mr-1">(אופציונלי)</span>
              </label>
              <textarea value={cultureFit} onChange={e => setCultureFit(e.target.value)} rows={3}
                placeholder="מה חשוב לנו בצוות? איזה אדם יצליח כאן?"
                className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none" />
            </div>
          </div>
        </Card>
      )}

      {/* ── STEP 3: Screening questions ── */}
      {step === 3 && (
        <Card>
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-neutral-900">שאלות סינון</h2>
            <Button variant="secondary" size="sm" onClick={addQuestion}>
              <Plus className="w-4 h-4" /> הוסף שאלה
            </Button>
          </div>
          <div className="space-y-4">
            {questions.map((q, i) => (
              <div key={q.id} className="border border-neutral-200 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-neutral-500">שאלה {i + 1}</span>
                  <button onClick={() => removeQuestion(q.id)} className="text-neutral-400 hover:text-danger">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <input value={q.question} onChange={e => updateQuestion(q.id, "question", e.target.value)}
                  placeholder="כתוב את השאלה..."
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-neutral-500 mb-1">סוג</label>
                    <select value={q.type} onChange={e => updateQuestion(q.id, "type", e.target.value)}
                      className="w-full px-2 py-1.5 border border-neutral-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-primary-500">
                      <option value="open">פתוחה</option>
                      <option value="yes_no">כן / לא</option>
                      <option value="numeric">מספרי</option>
                      <option value="multiple_choice">רב-ברירה</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-500 mb-1">משקל (1-10)</label>
                    <input type="number" min={1} max={10} value={q.weight}
                      onChange={e => updateQuestion(q.id, "weight", parseInt(e.target.value))}
                      className="w-full px-2 py-1.5 border border-neutral-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-2 text-xs text-neutral-600 pb-1.5">
                      <input type="checkbox" checked={q.required}
                        onChange={e => updateQuestion(q.id, "required", e.target.checked)}
                        className="rounded" />
                      חובה
                    </label>
                  </div>
                </div>
              </div>
            ))}
            {questions.length === 0 && (
              <p className="text-center text-neutral-400 text-sm py-8">לא הוגדרו שאלות. לחץ "הוסף שאלה".</p>
            )}
          </div>
        </Card>
      )}

      {/* ── STEP 4: Rejection rules ── */}
      {step === 4 && (
        <Card>
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold text-neutral-900">חוקי דחייה אוטומטית</h2>
            <Button variant="secondary" size="sm" onClick={addRule}>
              <Plus className="w-4 h-4" /> הוסף חוק
            </Button>
          </div>
          <p className="text-sm text-neutral-500 mb-5">מועמד שעונה על אחד מהחוקים יידחה אוטומטית על ידי ה-AI.</p>
          <div className="space-y-4">
            {rules.map((r) => (
              <div key={r.id} className="border border-neutral-200 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="danger">חוק דחייה</Badge>
                  <button onClick={() => removeRule(r.id)} className="text-neutral-400 hover:text-danger">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-neutral-500 mb-1">שדה</label>
                    <select value={r.field} onChange={e => updateRule(r.id, "field", e.target.value)}
                      className="w-full px-2 py-1.5 border border-neutral-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-primary-500">
                      <option value="experience_years">שנות ניסיון</option>
                      <option value="location">מיקום</option>
                      <option value="availability">זמינות</option>
                      <option value="salary_expectation">ציפיות שכר</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-500 mb-1">תנאי</label>
                    <select value={r.operator} onChange={e => updateRule(r.id, "operator", e.target.value)}
                      className="w-full px-2 py-1.5 border border-neutral-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-primary-500">
                      <option value="less_than">פחות מ</option>
                      <option value="greater_than">יותר מ</option>
                      <option value="equals">שווה ל</option>
                      <option value="not_equals">שונה מ</option>
                      <option value="contains">מכיל</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-500 mb-1">ערך</label>
                    <input value={String(r.value)} onChange={e => updateRule(r.id, "value", e.target.value)}
                      placeholder="0"
                      className="w-full px-2 py-1.5 border border-neutral-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                </div>
                <input value={r.reason} onChange={e => updateRule(r.id, "reason", e.target.value)}
                  placeholder="סיבת הדחייה (תוצג למועמד)"
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
            ))}
            {rules.length === 0 && (
              <p className="text-center text-neutral-400 text-sm py-8">לא הוגדרו חוקי דחייה.</p>
            )}
          </div>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="secondary" onClick={() => step === 1 ? router.push("/jobs") : setStep(s => s - 1)}>
          <ChevronRight className="w-4 h-4" />
          {step === 1 ? "ביטול" : "חזור"}
        </Button>
        <div className="flex gap-3">
          {step === 4 && (
            <Button variant="secondary" loading={saving} onClick={() => handleSave(false)}>
              שמור כטיוטה
            </Button>
          )}
          {step < 4
            ? (
              <Button onClick={() => setStep(s => s + 1)} disabled={step === 1 && !title}>
                המשך
                <ChevronLeft className="w-4 h-4" />
              </Button>
            )
            : (
              <Button loading={saving} onClick={() => handleSave(true)}>
                <Check className="w-4 h-4" />
                פרסם משרה
              </Button>
            )
          }
        </div>
      </div>
    </div>
  );
}
