"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  Share2, Copy, Check, ExternalLink, QrCode,
  Linkedin, Facebook, MessageCircle, Link2,
  Eye, MousePointer, FileText, TrendingUp,
  ArrowLeft, ChevronRight,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface DistributeData {
  job_id: string; slug: string; title: string;
  apply_views: number; apply_starts: number; apply_submissions: number;
  conversion_rate: number;
  channels: { name: string; clicks: number; submissions: number; icon: string }[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function buildApplyUrl(slug: string) {
  const base = typeof window !== "undefined" ? window.location.origin : "https://hr-project.vercel.app";
  return `${base}/apply/${slug}`;
}

function buildLinkedInUrl(applyUrl: string, title: string) {
  const text = encodeURIComponent(`🚀 אנחנו מגייסים! ${title}\n\nהגש/י מועמדות:`);
  return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(applyUrl)}&summary=${text}`;
}

function buildFacebookUrl(applyUrl: string) {
  return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(applyUrl)}`;
}

function buildWhatsAppShareUrl(applyUrl: string, title: string) {
  const text = encodeURIComponent(`🚀 משרה פתוחה: *${title}*\n\nלהגשת מועמדות: ${applyUrl}`);
  return `https://wa.me/?text=${text}`;
}

function buildTwitterUrl(applyUrl: string, title: string) {
  const text = encodeURIComponent(`🚀 אנחנו מגייסים ${title}! הגש/י מועמדות:`);
  return `https://twitter.com/intent/tweet?url=${encodeURIComponent(applyUrl)}&text=${text}`;
}

// ─── QR Code (using external API — no npm needed) ────────────────────────────
function QRCodeDisplay({ url }: { url: string }) {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(url)}&color=1d4ed8&bgcolor=ffffff`;
  return (
    <div className="flex flex-col items-center gap-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={qrUrl} alt="QR code" width={160} height={160} className="rounded-lg border border-neutral-200" />
      <p className="text-xs text-neutral-500">סרוק כדי להגיש מועמדות</p>
    </div>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon, sub, color }: {
  label: string; value: number | string; icon: React.ReactNode; sub?: string; color: string;
}) {
  return (
    <div className="bg-white border border-neutral-200 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
          {icon}
        </div>
        <span className="text-xs font-medium text-neutral-500">{label}</span>
      </div>
      <p className="text-2xl font-bold text-neutral-900">{value}</p>
      {sub && <p className="text-xs text-neutral-400 mt-0.5">{sub}</p>}
    </div>
  );
}

// ─── Channel icon ─────────────────────────────────────────────────────────────
function ChannelIcon({ icon, size = "md" }: { icon: string; size?: "sm" | "md" }) {
  const cls = size === "sm" ? "w-5 h-5" : "w-6 h-6";
  switch (icon) {
    case "linkedin":  return <Linkedin  className={`${cls} text-[#0A66C2]`} />;
    case "facebook":  return <Facebook  className={`${cls} text-[#1877F2]`} />;
    case "whatsapp":  return <MessageCircle className={`${cls} text-[#25D366]`} />;
    default:          return <Link2     className={`${cls} text-neutral-500`} />;
  }
}

// ─── Channel Share Buttons ────────────────────────────────────────────────────
function ShareButtons({ applyUrl, title }: { applyUrl: string; title: string }) {
  const channels = [
    {
      name: "LinkedIn",
      desc: "פרסם ל-network המקצועי שלך",
      color: "bg-[#0A66C2] hover:bg-[#004182] text-white",
      icon: <Linkedin className="w-5 h-5" />,
      url: buildLinkedInUrl(applyUrl, title),
    },
    {
      name: "Facebook",
      desc: "שתף בפייסבוק ובקבוצות רלוונטיות",
      color: "bg-[#1877F2] hover:bg-[#0c5ec7] text-white",
      icon: <Facebook className="w-5 h-5" />,
      url: buildFacebookUrl(applyUrl),
    },
    {
      name: "WhatsApp",
      desc: "שלח לקבוצות וקשרים בוואטסאפ",
      color: "bg-[#25D366] hover:bg-[#1da851] text-white",
      icon: <MessageCircle className="w-5 h-5" />,
      url: buildWhatsAppShareUrl(applyUrl, title),
    },
    {
      name: "X (Twitter)",
      desc: "ציוץ לקהילת המפתחים",
      color: "bg-black hover:bg-neutral-800 text-white",
      icon: <span className="font-bold text-base leading-none">𝕏</span>,
      url: buildTwitterUrl(applyUrl, title),
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {channels.map(ch => (
        <a
          key={ch.name}
          href={ch.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all ${ch.color}`}
        >
          {ch.icon}
          <div className="text-right flex-1 min-w-0">
            <p className="font-semibold">{ch.name}</p>
            <p className="text-xs opacity-80 truncate">{ch.desc}</p>
          </div>
          <ExternalLink className="w-3.5 h-3.5 opacity-60 flex-shrink-0" />
        </a>
      ))}
    </div>
  );
}

// ─── Link Copy ────────────────────────────────────────────────────────────────
function CopyLinkBox({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(url).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex items-center gap-2 bg-neutral-50 border border-neutral-200 rounded-xl p-3">
      <Link2 className="w-4 h-4 text-neutral-400 flex-shrink-0" />
      <p className="flex-1 text-sm text-neutral-600 truncate font-mono">{url}</p>
      <button
        onClick={copy}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
          copied
            ? "bg-emerald-100 text-emerald-700"
            : "bg-primary-600 hover:bg-primary-700 text-white"
        }`}
      >
        {copied ? <><Check className="w-3.5 h-3.5" /> הועתק!</> : <><Copy className="w-3.5 h-3.5" /> העתק</>}
      </button>
    </div>
  );
}

// ─── Channels stats table ─────────────────────────────────────────────────────
function ChannelsTable({ channels }: { channels: DistributeData["channels"] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-neutral-50 border-b border-neutral-200">
            <th className="text-right px-4 py-3 font-medium text-neutral-500 text-xs">ערוץ</th>
            <th className="text-right px-4 py-3 font-medium text-neutral-500 text-xs">קליקים</th>
            <th className="text-right px-4 py-3 font-medium text-neutral-500 text-xs">הגשות</th>
            <th className="text-right px-4 py-3 font-medium text-neutral-500 text-xs">המרה</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {channels.map(ch => (
            <tr key={ch.name} className="hover:bg-neutral-50 transition-colors">
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <ChannelIcon icon={ch.icon} size="sm" />
                  <span className="font-medium text-neutral-800">{ch.name}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-neutral-600">{ch.clicks.toLocaleString()}</td>
              <td className="px-4 py-3 text-neutral-600">{ch.submissions}</td>
              <td className="px-4 py-3">
                <span className={`font-semibold ${
                  ch.submissions / ch.clicks > 0.15 ? "text-emerald-600" : "text-amber-600"
                }`}>
                  {ch.clicks > 0 ? Math.round((ch.submissions / ch.clicks) * 100) : 0}%
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function DistributePage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = use(params);
  const [data, setData]     = useState<DistributeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]       = useState<"share" | "stats">("share");
  const [applyUrl, setApplyUrl] = useState("");

  useEffect(() => {
    // Find the job slug by id (demo: map id → slug)
    const slugMap: Record<string, string> = {
      "job-1": "senior-fullstack-dev",
      "job-2": "ux-ui-designer",
      "job-3": "product-manager",
      "job-4": "data-scientist",
    };
    const slug = slugMap[jobId] ?? jobId;
    setApplyUrl(buildApplyUrl(slug));

    fetch(`/api/jobs/${jobId}/distribute`)
      .then(r => r.json())
      .then(d => { setData(d.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [jobId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-neutral-400 text-sm">
        טוען...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p className="text-neutral-500">משרה לא נמצאה</p>
        <Link href="/jobs" className="text-primary-600 text-sm hover:underline">חזור למשרות</Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-neutral-500">
        <Link href="/jobs" className="hover:text-neutral-700 transition-colors">משרות</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-neutral-900 font-medium">{data.title}</span>
        <ChevronRight className="w-4 h-4" />
        <span className="text-primary-600 font-medium">הפצה</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
            <Share2 className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-neutral-900">הפצת משרה</h1>
            <p className="text-sm text-neutral-500">{data.title}</p>
          </div>
        </div>
        <a
          href={applyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 border border-neutral-300 rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
        >
          <Eye className="w-4 h-4" />
          תצוגה מקדימה
          <ExternalLink className="w-3.5 h-3.5 opacity-60" />
        </a>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="צפיות בדף" value={data.apply_views.toLocaleString()} icon={<Eye className="w-4 h-4" />} color="text-primary-600 bg-primary-50" />
        <StatCard label="התחילו למלא" value={data.apply_starts.toLocaleString()} icon={<MousePointer className="w-4 h-4" />} color="text-amber-600 bg-amber-50" sub={`${Math.round((data.apply_starts / data.apply_views) * 100)}% מהצפיות`} />
        <StatCard label="הגישו מועמדות" value={data.apply_submissions.toLocaleString()} icon={<FileText className="w-4 h-4" />} color="text-emerald-600 bg-emerald-50" sub={`${Math.round((data.apply_submissions / data.apply_starts) * 100)}% סיימו`} />
        <StatCard label="המרה כוללת" value={`${data.conversion_rate}%`} icon={<TrendingUp className="w-4 h-4" />} color="text-violet-600 bg-violet-50" sub="צפייה → הגשה" />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-lg w-fit">
        {[
          { id: "share", label: "שיתוף והפצה" },
          { id: "stats", label: "סטטיסטיקות ערוצים" },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as typeof tab)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              tab === t.id ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500 hover:text-neutral-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Share */}
      {tab === "share" && (
        <div className="grid grid-cols-3 gap-6">

          {/* Left: Share + link */}
          <div className="col-span-2 space-y-5">

            <div className="bg-white border border-neutral-200 rounded-xl p-5 space-y-4">
              <h3 className="font-semibold text-neutral-900">פרסם ברשתות חברתיות</h3>
              <ShareButtons applyUrl={applyUrl} title={data.title} />
            </div>

            <div className="bg-white border border-neutral-200 rounded-xl p-5 space-y-3">
              <h3 className="font-semibold text-neutral-900">קישור ישיר למועמדים</h3>
              <p className="text-sm text-neutral-500">
                שלח את הקישור הזה ישירות למועמדים. הם ימלאו את הטופס ויועברו אוטומטית לשיחה עם הבוט.
              </p>
              <CopyLinkBox url={applyUrl} />

              {/* Flow diagram */}
              <div className="flex items-center gap-2 pt-2 text-xs text-neutral-500 flex-wrap">
                {[
                  { label: "מועמד לוחץ על קישור", color: "bg-primary-50 text-primary-700" },
                  { label: "ממלא טופס + CV", color: "bg-amber-50 text-amber-700" },
                  { label: "נשמר במערכת", color: "bg-emerald-50 text-emerald-700" },
                  { label: "עובר לוואטסאפ עם הבוט", color: "bg-green-50 text-green-700" },
                ].map((step, i, arr) => (
                  <span key={step.label} className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full font-medium ${step.color}`}>{step.label}</span>
                    {i < arr.length - 1 && <ArrowLeft className="w-3 h-3 text-neutral-300 rotate-180" />}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right: QR */}
          <div className="space-y-4">
            <div className="bg-white border border-neutral-200 rounded-xl p-5 flex flex-col items-center gap-4">
              <div className="flex items-center gap-2 self-start">
                <QrCode className="w-4 h-4 text-neutral-500" />
                <h3 className="font-semibold text-neutral-900 text-sm">QR Code</h3>
              </div>
              <QRCodeDisplay url={applyUrl} />
              <a
                href={`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(applyUrl)}&color=1d4ed8`}
                download="qr-apply.png"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full text-center px-4 py-2 border border-neutral-300 rounded-lg text-sm text-neutral-700 hover:bg-neutral-50 transition-colors font-medium"
              >
                הורד PNG
              </a>
            </div>

            {/* Preview card */}
            <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-xl p-4 text-white">
              <p className="text-xs font-medium opacity-75 mb-2">תצוגה מקדימה — פוסט רשת</p>
              <p className="font-bold text-sm mb-1">🚀 {data.title}</p>
              <p className="text-xs opacity-80 leading-relaxed">
                מחפשים את הכישרון הבא. הגש/י מועמדות ותתחיל/י שיחה עם הבוט שלנו ישירות בוואטסאפ!
              </p>
              <div className="mt-3 px-2 py-1.5 bg-white/20 rounded-lg text-[10px] font-mono opacity-70 truncate">
                {applyUrl}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Stats */}
      {tab === "stats" && (
        <div className="bg-white border border-neutral-200 rounded-xl p-5 space-y-4">
          <h3 className="font-semibold text-neutral-900">ביצועים לפי ערוץ הפצה</h3>
          <ChannelsTable channels={data.channels} />
        </div>
      )}
    </div>
  );
}
