"use client";

// ==================================================
// Campaigns — list, create, pause
// ==================================================
// A campaign is a shareable link: job + channel + unique code. Creating
// one here yields a landing URL ready to paste into an ad; the counters
// show which channel actually delivers candidates, per code.

import { useState, useEffect, useCallback } from "react";
import {
  Megaphone, Plus, Loader2, Copy, Check, Link2, Power,
} from "lucide-react";

interface CampaignRow {
  id: string;
  code: string;
  channel: string;
  ad_copy: string;
  landing_url: string;
  is_active: boolean;
  clicks: number;
  conversations: number;
  qualified: number;
  created_at: string;
  jobs: { id: string; title: string } | null;
}

interface JobOption { id: string; title: string; }

const CHANNEL_LABELS: Record<string, string> = {
  facebook:  "פייסבוק",
  linkedin:  "לינקדאין",
  instagram: "אינסטגרם",
  whatsapp:  "וואטסאפ",
  telegram:  "טלגרם",
  print:     "מודעה מודפסת",
  other:     "אחר",
};

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
  const [jobs, setJobs]           = useState<JobOption[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);

  const [form, setForm] = useState({ job_id: "", channel: "facebook", ad_copy: "" });
  const [creating, setCreating]   = useState(false);
  const [error, setError]         = useState("");
  const [copiedId, setCopiedId]   = useState("");

  const load = useCallback(() => {
    fetch("/api/campaigns")
      .then(r => r.json())
      .then(d => { if (d.success) setCampaigns(d.data.campaigns); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
    fetch("/api/jobs?status=active&limit=100")
      .then(r => r.json())
      .then(d => { if (d.success) setJobs(d.data.jobs ?? []); });
  }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.job_id) { setError("נא לבחור משרה"); return; }

    setCreating(true);
    setError("");
    try {
      const r = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await r.json();
      if (d.success) {
        setShowForm(false);
        setForm({ job_id: "", channel: "facebook", ad_copy: "" });
        load();
      } else {
        setError(d.error ?? "שגיאה ביצירת הקמפיין");
      }
    } catch {
      setError("שגיאת רשת — נסה שוב");
    } finally {
      setCreating(false);
    }
  }

  async function toggleActive(c: CampaignRow) {
    // Optimistic: the row flips immediately, and flips back if the server
    // disagrees. Waiting on a round-trip for a toggle feels broken.
    setCampaigns(p => p.map(x => x.id === c.id ? { ...x, is_active: !c.is_active } : x));
    const r = await fetch(`/api/campaigns/${c.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !c.is_active }),
    });
    if (!r.ok) {
      setCampaigns(p => p.map(x => x.id === c.id ? { ...x, is_active: c.is_active } : x));
    }
  }

  function copyLink(c: CampaignRow) {
    navigator.clipboard.writeText(c.landing_url).then(() => {
      setCopiedId(c.id);
      setTimeout(() => setCopiedId(""), 2000);
    });
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">קמפיינים</h1>
          <p className="text-sm text-neutral-500 mt-1">
            כל קמפיין הוא לינק ייחודי למשרה — פרסם אותו בערוץ, והמערכת סופרת כמה מועמדים הגיעו ממנו
          </p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg px-4 py-2.5 transition-colors"
        >
          <Plus className="w-4 h-4" />
          קמפיין חדש
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-xl border border-neutral-200 p-5 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">משרה</label>
              <select
                value={form.job_id}
                onChange={e => setForm(p => ({ ...p, job_id: e.target.value }))}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
              >
                <option value="">בחר משרה…</option>
                {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">ערוץ פרסום</label>
              <select
                value={form.channel}
                onChange={e => setForm(p => ({ ...p, channel: e.target.value }))}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
              >
                {Object.entries(CHANNEL_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">
              טקסט מודעה <span className="text-neutral-400 font-normal">(אופציונלי — יוצג בעמוד הנחיתה במקום תיאור המשרה)</span>
            </label>
            <textarea
              value={form.ad_copy}
              onChange={e => setForm(p => ({ ...p, ad_copy: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="למשל: מחפשים רכז/ת שירות עם ראש גדול…"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-sm text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              ביטול
            </button>
            <button
              type="submit"
              disabled={creating}
              className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg px-4 py-2 transition-colors"
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Megaphone className="w-4 h-4" />}
              צור קמפיין
            </button>
          </div>
        </form>
      )}

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 text-primary-600 animate-spin" />
        </div>
      ) : campaigns.length === 0 ? (
        <div className="bg-white rounded-xl border border-neutral-200 py-16 flex flex-col items-center gap-3 text-center">
          <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center">
            <Megaphone className="w-6 h-6 text-neutral-400" />
          </div>
          <p className="text-neutral-600 font-medium">אין קמפיינים עדיין</p>
          <p className="text-sm text-neutral-400">צור קמפיין ראשון וקבל לינק לפרסום</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-neutral-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-right text-neutral-500">
                <th className="px-4 py-3 font-medium">קוד</th>
                <th className="px-4 py-3 font-medium">משרה</th>
                <th className="px-4 py-3 font-medium">ערוץ</th>
                <th className="px-4 py-3 font-medium text-center">קליקים</th>
                <th className="px-4 py-3 font-medium text-center">שיחות</th>
                <th className="px-4 py-3 font-medium text-center">מוסמכים</th>
                <th className="px-4 py-3 font-medium">לינק</th>
                <th className="px-4 py-3 font-medium">פעיל</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map(c => (
                <tr key={c.id} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50">
                  <td className="px-4 py-3 font-mono font-semibold text-primary-700">{c.code}</td>
                  <td className="px-4 py-3 text-neutral-900">{c.jobs?.title ?? "—"}</td>
                  <td className="px-4 py-3 text-neutral-600">{CHANNEL_LABELS[c.channel] ?? c.channel}</td>
                  <td className="px-4 py-3 text-center text-neutral-600">{c.clicks}</td>
                  <td className="px-4 py-3 text-center text-neutral-600">{c.conversations}</td>
                  <td className="px-4 py-3 text-center text-neutral-600">{c.qualified}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => copyLink(c)}
                      className="flex items-center gap-1.5 text-primary-600 hover:text-primary-800 transition-colors"
                      title={c.landing_url}
                    >
                      {copiedId === c.id
                        ? <><Check className="w-4 h-4" />הועתק</>
                        : <><Copy className="w-4 h-4" />העתק</>}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleActive(c)}
                      className={c.is_active
                        ? "flex items-center gap-1.5 text-green-600 hover:text-green-800"
                        : "flex items-center gap-1.5 text-neutral-400 hover:text-neutral-600"}
                      title={c.is_active ? "לחץ להשהיה" : "לחץ להפעלה"}
                    >
                      <Power className="w-4 h-4" />
                      {c.is_active ? "פעיל" : "מושהה"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-neutral-400 flex items-center gap-1.5">
        <Link2 className="w-3.5 h-3.5" />
        קמפיין מושהה מפסיק לקבל מועמדים מיד — הלינק מציג &quot;המשרה לא נמצאה&quot;. הנתונים נשמרים.
      </p>
    </div>
  );
}
