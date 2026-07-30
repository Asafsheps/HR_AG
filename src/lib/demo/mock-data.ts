// ============================================================
// Demo Mode — Mock Data
// Used when NEXT_PUBLIC_DEMO_MODE=true or cookie hr-demo=1
// ============================================================

export const DEMO_CANDIDATES = [
  {
    id: "demo-1",
    full_name: "דנה כהן",
    email: "dana.cohen@example.com",
    phone: "+972501234567",
    whatsapp_number: "+972501234567",
    status: "shortlisted",
    ai_score: 88,
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    job: { id: "job-1", title: "מפתח Full Stack בכיר", organization_id: "org-1" },
    cover_letter: "אני מועמדת עם ניסיון של 5 שנים בפיתוח Full Stack, התמחות ב-React ו-Node.js...",
    cv_url: null,
  },
  {
    id: "demo-2",
    full_name: "יוסי לוי",
    email: "yossi.levi@example.com",
    phone: "+972509876543",
    whatsapp_number: "+972509876543",
    status: "interviewing",
    ai_score: 75,
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    job: { id: "job-1", title: "מפתח Full Stack בכיר", organization_id: "org-1" },
    cover_letter: "בעל ניסיון של 3 שנים בפיתוח web עם דגש על ביצועים ו-scalability...",
    cv_url: null,
  },
  {
    id: "demo-3",
    full_name: "מיכל גולן",
    email: "michal.golan@example.com",
    phone: "+972521111222",
    whatsapp_number: "+972521111222",
    status: "applied",
    ai_score: 91,
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    job: { id: "job-2", title: "מעצב UX/UI", organization_id: "org-1" },
    cover_letter: "מעצבת UX/UI עם 4 שנות ניסיון, מתמחה ב-Figma ו-Design Systems...",
    cv_url: null,
  },
  {
    id: "demo-4",
    full_name: "אביב שמש",
    email: "aviv.shemesh@example.com",
    phone: "+972533334444",
    whatsapp_number: null,
    status: "hired",
    ai_score: 94,
    created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    job: { id: "job-3", title: "מנהל מוצר", organization_id: "org-1" },
    cover_letter: "PM בעל ניסיון של 6 שנים, עבדתי על מוצרים B2B ו-B2C בחברות Startups...",
    cv_url: null,
  },
  {
    id: "demo-5",
    full_name: "רותם ברק",
    email: "rotem.barak@example.com",
    phone: "+972555556666",
    whatsapp_number: "+972555556666",
    status: "rejected",
    ai_score: 42,
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    job: { id: "job-1", title: "מפתח Full Stack בכיר", organization_id: "org-1" },
    cover_letter: "מפתח junior עם שנה וחצי ניסיון, מחפש להתפתח...",
    cv_url: null,
  },
  {
    id: "demo-6",
    full_name: "תמר פרידמן",
    email: "tamar.friedman@example.com",
    phone: "+972577778888",
    whatsapp_number: "+972577778888",
    status: "shortlisted",
    ai_score: 83,
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    job: { id: "job-2", title: "מעצב UX/UI", organization_id: "org-1" },
    cover_letter: "מעצבת עם ניסיון בתחום הפינטק, מומחית ב-accessibility ו-mobile-first...",
    cv_url: null,
  },
  {
    id: "demo-7",
    full_name: "גל ניסים",
    email: "gal.nissim@example.com",
    phone: "+972511112222",
    whatsapp_number: "+972511112222",
    status: "applied",
    ai_score: 67,
    created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    job: { id: "job-4", title: "Data Scientist", organization_id: "org-1" },
    cover_letter: "Data Scientist עם רקע חזק ב-Python, ML ו-NLP. ניסיון בתעשיית הפינטק...",
    cv_url: null,
  },
  {
    id: "demo-8",
    full_name: "נועה אלון",
    email: "noa.alon@example.com",
    phone: "+972522223333",
    whatsapp_number: null,
    status: "applied",
    ai_score: 79,
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    job: { id: "job-1", title: "מפתח Full Stack בכיר", organization_id: "org-1" },
    cover_letter: "מפתחת עם ניסיון של 4 שנים, מתמחה ב-TypeScript ו-microservices...",
    cv_url: null,
  },
];

export const DEMO_JOBS = [
  {
    id: "job-1", slug: "senior-fullstack-dev", title: "מפתח Full Stack בכיר",
    status: "active", created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    total: 4, shortlisted: 2, hired: 0, rejected: 1, avg_score: 74,
    location: "תל אביב / היברידי", type: "משרה מלאה", salary_range: "25,000–35,000 ₪",
    description: "אנו מחפשים מפתח Full Stack בכיר להצטרף לצוות שלנו. תעבוד על מוצר SaaS בסקייל גבוה, עם טכנולוגיות מודרניות: React, Node.js, PostgreSQL, AWS.\n\nהזדמנות לעצב ארכיטקטורה, להוביל פיצ׳רים מקצה לקצה, ולעבוד בסביבה אג׳ילית.",
    requirements: ["5+ שנות ניסיון בפיתוח Full Stack", "שליטה ב-React ו-TypeScript", "ניסיון עם Node.js ו-PostgreSQL", "ניסיון עם AWS / GCP", "יכולת הובלת פיצ׳רים עצמאית"],
    nice_to_have: ["ניסיון עם Kubernetes", "ניסיון בסטארטאפ SaaS", "ניסיון עם Next.js"],
    whatsapp_bot_number: "972501234567",
    apply_views: 312, apply_starts: 87, apply_submissions: 47,
  },
  {
    id: "job-2", slug: "ux-ui-designer", title: "מעצב UX/UI",
    status: "active", created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    total: 2, shortlisted: 1, hired: 0, rejected: 0, avg_score: 87,
    location: "תל אביב", type: "משרה מלאה", salary_range: "20,000–28,000 ₪",
    description: "מחפשים מעצב UX/UI עם עין חזקה לפרטים ויכולת עבודה עצמאית על Design Systems.",
    requirements: ["3+ שנות ניסיון בעיצוב UX/UI", "שליטה ב-Figma", "ניסיון עם Design Systems", "ניסיון בעבודה עם מפתחים"],
    nice_to_have: ["ניסיון בפינטק", "ידע ב-CSS/HTML בסיסי"],
    whatsapp_bot_number: "972501234567",
    apply_views: 198, apply_starts: 52, apply_submissions: 23,
  },
  {
    id: "job-3", slug: "product-manager", title: "מנהל מוצר",
    status: "active", created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    total: 1, shortlisted: 0, hired: 1, rejected: 0, avg_score: 94,
    location: "תל אביב / ריחוק מלא", type: "משרה מלאה", salary_range: "30,000–45,000 ₪",
    description: "מחפשים PM בעל ניסיון ב-B2B SaaS להוביל את מפת הדרכים של המוצר.",
    requirements: ["5+ שנות ניסיון כ-PM", "ניסיון עם B2B SaaS", "יכולת ניתוח נתונים", "אנגלית ברמת שפת אם"],
    nice_to_have: ["ניסיון עם AI/ML products", "רקע טכני"],
    whatsapp_bot_number: "972501234567",
    apply_views: 445, apply_starts: 112, apply_submissions: 38,
  },
  {
    id: "job-4", slug: "data-scientist", title: "Data Scientist",
    status: "active", created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    total: 1, shortlisted: 0, hired: 0, rejected: 0, avg_score: 67,
    location: "תל אביב", type: "משרה מלאה", salary_range: "25,000–38,000 ₪",
    description: "Data Scientist להצטרף לצוות AI שלנו ולעבוד על מודלים של NLP ו-Recommendation.",
    requirements: ["3+ שנות ניסיון ב-Data Science", "Python מתקדם", "ניסיון עם ML frameworks (PyTorch/TensorFlow)", "ניסיון עם NLP"],
    nice_to_have: ["ניסיון עם LLMs", "ניסיון עם MLOps"],
    whatsapp_bot_number: "972501234567",
    apply_views: 89, apply_starts: 21, apply_submissions: 8,
  },
];

export const DEMO_ANALYTICS_OVERVIEW = {
  candidates: {
    total: 47,
    active: 23,
    hired: 8,
    rejected: 12,
    shortlisted: 7,
  },
  jobs: {
    total: 6,
    active: 4,
  },
  ai: {
    avg_score: 72,
    scored_count: 35,
    whatsapp_interviews: 18,
    assignments_sent: 11,
  },
  conversion_rate: 17,
};

export const DEMO_ANALYTICS_PIPELINE = {
  funnel: [
    { stage: "הגיש מועמדות",   count: 47 },
    { stage: "סוכן AI",         count: 35 },
    { stage: "ראיון WhatsApp",  count: 18 },
    { stage: "מטלה",            count: 11 },
    { stage: "נבחר לסיום",      count: 7  },
    { stage: "גויס",            count: 8  },
  ],
  score_distribution: [
    { bucket: "0-20",   count: 2  },
    { bucket: "21-40",  count: 5  },
    { bucket: "41-60",  count: 9  },
    { bucket: "61-80",  count: 14 },
    { bucket: "81-100", count: 17 },
  ],
  timeline: Array.from({ length: 30 }, (_, i) => ({
    date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000)
      .toISOString().slice(0, 10),
    count: Math.floor(Math.random() * 4) + (i > 20 ? 2 : 1),
  })),
};

export const DEMO_MESSAGES = [
  {
    id: "msg-1",
    candidate_id: "demo-1",
    direction: "inbound" as const,
    body: "שלום! קראתי על המשרה ואני מאוד מעוניינת. יש לי 5 שנות ניסיון ב-React.",
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "msg-2",
    candidate_id: "demo-1",
    direction: "outbound" as const,
    body: "שלום דנה! תודה על הפנייה. נשמח לשמוע יותר על הניסיון שלך. מה הפרויקטים הכי משמעותיים שעבדת עליהם?",
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 5 * 60 * 1000).toISOString(),
  },
  {
    id: "msg-3",
    candidate_id: "demo-1",
    direction: "inbound" as const,
    body: "עבדתי על פלטפורמת e-commerce גדולה עם 100K+ משתמשים, ועל מערכת BI פנימית. שניהם ב-React + TypeScript + Node.js.",
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "msg-4",
    candidate_id: "demo-1",
    direction: "outbound" as const,
    body: "מרשים מאוד! 🎯 האם את מכירה גם עם AWS או GCP?",
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 10 * 60 * 1000).toISOString(),
  },
  {
    id: "msg-5",
    candidate_id: "demo-1",
    direction: "inbound" as const,
    body: "כן, יש לי ניסיון ב-AWS — EC2, S3, Lambda, RDS. עבדתי גם עם Docker ו-Kubernetes.",
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export const DEMO_NOTES = [
  {
    id: "note-1",
    candidate_id: "demo-1",
    recruiter_id: "demo-recruiter",
    content: "מועמדת מצוינת — ניסיון מאוד רלוונטי, ענתה בצורה מפורטת ומדויקת על כל השאלות. להמשיך לשלב הבא.",
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    recruiter_profile: { full_name: "ישראל ישראלי" },
  },
];

// ── Agent Sessions ────────────────────────────────────────────────────────────
export const DEMO_AGENT_SESSIONS = [
  {
    id: "session-1",
    candidate_id: "demo-1",
    candidate_name: "דנה כהן",
    job_title: "מפתח Full Stack בכיר",
    status: "active",           // active | waiting | completed | escalated
    stage: "technical_screen",  // intro | screening | technical_screen | done
    last_message_at: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    messages_count: 8,
    ai_score: 88,
    next_action: "שאלת ניסיון עם Kubernetes",
    whatsapp_number: "+972501234567",
  },
  {
    id: "session-2",
    candidate_id: "demo-2",
    candidate_name: "יוסי לוי",
    job_title: "מפתח Full Stack בכיר",
    status: "waiting",
    stage: "screening",
    last_message_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    messages_count: 4,
    ai_score: 75,
    next_action: "ממתין לתגובת מועמד",
    whatsapp_number: "+972509876543",
  },
  {
    id: "session-3",
    candidate_id: "demo-3",
    candidate_name: "מיכל גולן",
    job_title: "מעצב UX/UI",
    status: "active",
    stage: "screening",
    last_message_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    messages_count: 3,
    ai_score: 91,
    next_action: "שאלה על ניסיון Figma",
    whatsapp_number: "+972521111222",
  },
  {
    id: "session-4",
    candidate_id: "demo-7",
    candidate_name: "גל ניסים",
    job_title: "Data Scientist",
    status: "escalated",
    stage: "technical_screen",
    last_message_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    messages_count: 12,
    ai_score: 67,
    next_action: "הועבר לטיפול מגייס",
    whatsapp_number: "+972511112222",
  },
];

// Messages for session-1 (Dana) — full annotated thread
export const DEMO_AGENT_THREAD = [
  {
    id: "t1",
    type: "message",
    direction: "inbound",
    body: "שלום! ראיתי את המשרה ואני מאוד מעוניינת. יש לי 5 שנות ניסיון ב-React ו-Node.js.",
    timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    agent_note: null,
  },
  {
    id: "t1-ann",
    type: "agent_action",
    action: "score_update",
    body: "זיהוי ניסיון רלוונטי: React + Node.js, 5 שנים → ניקוד +15",
    score_delta: 15,
    timestamp: new Date(Date.now() - 25 * 60 * 1000 + 3000).toISOString(),
    agent_note: "הגדיל ציון טכני",
  },
  {
    id: "t2",
    type: "message",
    direction: "outbound",
    body: "שלום דנה! 👋 תודה על הפנייה. נשמח לשמוע יותר. תוכלי לספר על הפרויקט הכי מאתגר שעבדת עליו?",
    timestamp: new Date(Date.now() - 24 * 60 * 1000).toISOString(),
    agent_note: "שאלת screening סטנדרטית #1",
  },
  {
    id: "t3",
    type: "message",
    direction: "inbound",
    body: "עבדתי על פלטפורמת e-commerce עם 100K+ משתמשים יומיים. בניתי את המערכת של התשלומים מאפס — React, Node.js, PostgreSQL, Redis לקאש. גם הובלתי צוות של 3 מפתחים.",
    timestamp: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    agent_note: null,
  },
  {
    id: "t3-ann",
    type: "agent_action",
    action: "score_update",
    body: "Scale מרשים (100K+ DAU), ניסיון הובלה, stack מתאים → ניקוד +20",
    score_delta: 20,
    timestamp: new Date(Date.now() - 20 * 60 * 1000 + 2000).toISOString(),
    agent_note: "Scale + Leadership מעלים ציון",
  },
  {
    id: "t4",
    type: "message",
    direction: "outbound",
    body: "מרשים מאוד! 🎯 ניהול צוות וScale גבוה זה בדיוק מה שאנחנו מחפשים. שאלה טכנית — איך התמודדת עם bottlenecks בביצועים?",
    timestamp: new Date(Date.now() - 19 * 60 * 1000).toISOString(),
    agent_note: "שאלת עומק טכנית — Performance",
  },
  {
    id: "t5",
    type: "message",
    direction: "inbound",
    body: "השתמשנו ב-Redis לcaching של נתוני מוצרים, הוסיפנו CDN, ואופטמיזציה של queries ב-PostgreSQL עם indexes מותאמים. הורדנו load time מ-4 שניות ל-800ms.",
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    agent_note: null,
  },
  {
    id: "t5-ann",
    type: "agent_action",
    action: "score_update",
    body: "תשובה מפורטת ומדידה (4s→800ms) — ידע מוכח ב-performance optimization → ניקוד +18",
    score_delta: 18,
    timestamp: new Date(Date.now() - 15 * 60 * 1000 + 2000).toISOString(),
    agent_note: "מספרים קונקרטיים = ציון גבוה",
  },
  {
    id: "t6",
    type: "message",
    direction: "outbound",
    body: "מצוין! 💪 שאלה אחרונה לעכשיו — יש לך ניסיון עם Kubernetes או Docker בProduction?",
    timestamp: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    agent_note: "שאלת DevOps — קריטריון חובה",
  },
  {
    id: "t6-ann",
    type: "agent_action",
    action: "waiting",
    body: "ממתין לתגובה — שאלת Kubernetes (קריטריון חובה). אם חיובי: להמשיך לשלב הבא ולהעביר למגייס.",
    score_delta: 0,
    timestamp: new Date(Date.now() - 12 * 60 * 1000 + 1000).toISOString(),
    agent_note: null,
  },
];

// Agent Configuration (editable)
export const DEMO_AGENT_CONFIG = {
  name: "סוכן HR",
  tone: "professional_friendly", // professional | friendly | professional_friendly | formal
  language: "hebrew",
  max_questions: 8,
  auto_score: true,
  auto_escalate_score: 85,   // escalate to human if score >= this
  reject_score: 40,           // auto-reject if score < this
  escalate_after_messages: 15,

  stages: [
    { id: "intro",            label: "פתיחה",       enabled: true  },
    { id: "screening",        label: "סינון ראשוני", enabled: true  },
    { id: "technical_screen", label: "מסך טכני",    enabled: true  },
    { id: "assignment",       label: "מטלה",         enabled: false },
  ],

  questions: [
    { id: "q1", stage: "screening",        text: "ספר/י על עצמך ועל הניסיון הרלוונטי", required: true,  weight: 10 },
    { id: "q2", stage: "screening",        text: "מה הפרויקט הכי מאתגר שעבדת עליו?",  required: true,  weight: 20 },
    { id: "q3", stage: "screening",        text: "למה התפקיד הזה מעניין אותך?",         required: false, weight: 5  },
    { id: "q4", stage: "technical_screen", text: "איך מתמודדים עם bottlenecks?",         required: true,  weight: 20 },
    { id: "q5", stage: "technical_screen", text: "ניסיון עם Docker/Kubernetes?",         required: true,  weight: 15 },
    { id: "q6", stage: "technical_screen", text: "גישה לכתיבת בדיקות אוטומטיות?",      required: false, weight: 10 },
  ],

  scoring_criteria: [
    { id: "s1", label: "ניסיון רלוונטי",    weight: 30, description: "שנות ניסיון + טכנולוגיות" },
    { id: "s2", label: "Scale וביצועים",    weight: 25, description: "עבודה על מערכות בסקייל" },
    { id: "s3", label: "הובלה ועצמאות",     weight: 20, description: "ניהול עצמי + ניהול אחרים" },
    { id: "s4", label: "תקשורת ובהירות",   weight: 15, description: "איכות ההסברים" },
    { id: "s5", label: "Motivation",        weight: 10, description: "מוטיבציה לתפקיד" },
  ],
};

// ── Demo Assignments (מטלות) ─────────────────────────────────────────────────
export const DEMO_ASSIGNMENTS = [
  {
    id: "assign-1",
    candidate_id: "demo-1",
    candidate_name: "דנה כהן",
    job_title: "מפתח Full Stack בכיר",
    title: "מטלה טכנית: בניית REST API",
    description: "בניית REST API פשוט עם Node.js / Express המנהל רשימת משימות (TODO list).",
    instructions: `בנה API עם הנקודות הבאות:
• GET /tasks — מחזיר את כל המשימות
• POST /tasks — יצירת משימה חדשה
• PATCH /tasks/:id — עדכון סטטוס משימה
• DELETE /tasks/:id — מחיקת משימה

דרישות:
- TypeScript מלא
- Validation על הקלט
- Error handling מסודר
- README עם הוראות הרצה
- Tests לפחות ל-2 endpoints

שלח קישור ל-GitHub repo.`,
    deadline_hours: 48,
    status: "submitted",
    sent_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    submission: {
      type: "url",
      content: "https://github.com/dana-cohen/todo-api",
      submitted_at: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
      evaluation_score: 87,
      evaluation_feedback: "קוד נקי ומסודר, TypeScript מלא, tests מצוינים. חסרה קצת הרחבה של Error handling לcases שאינם צפויים. README מפורט מאוד.",
      evaluated_at: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
    },
    whatsapp_message: `שלום דנה! 🎯\n\nעברת את שלב הסינון בהצלחה וציון AI שלך מרשים!\n\nהשלב הבא הוא מטלה טכנית קצרה — *בניית REST API*.\n\n⏰ זמן: 48 שעות\n📎 קישור למטלה: https://hr.demo/assignment/assign-1\n\nבהצלחה! 💪`,
  },
  {
    id: "assign-2",
    candidate_id: "demo-2",
    candidate_name: "יוסי לוי",
    job_title: "מפתח Full Stack בכיר",
    title: "מטלה: Code Review וRefactoring",
    description: "בצע Code Review לקוד קיים ושפר אותו.",
    instructions: `מצורף קובץ TypeScript עם מספר בעיות ידועות:\n• Memory leaks\n• Race conditions\n• Missing error handling\n• Performance issues\n\nהמשימה:\n1. זהה את כל הבעיות (ציין שורה + הסבר)\n2. תקן את הבעיות\n3. כתוב tests לחלקים שתוקנו\n\nשלח קישור ל-GitHub Gist או repo.`,
    deadline_hours: 24,
    status: "sent",
    sent_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    submission: null,
    whatsapp_message: `שלום יוסי! 🎯\n\nאנחנו מתקדמים — השלב הבא הוא מטלה קצרה של Code Review.\n\n⏰ זמן: 24 שעות\n📎 קישור למטלה: https://hr.demo/assignment/assign-2\n\nמחכים לראות את העבודה שלך! 🚀`,
  },
  {
    id: "assign-3",
    candidate_id: "demo-3",
    candidate_name: "מיכל גולן",
    job_title: "מעצב UX/UI",
    title: "מטלת עיצוב: Redesign של דף Onboarding",
    description: "עיצוב מחדש של דף Onboarding למוצר B2B SaaS.",
    instructions: `עצב/י דף Onboarding חדש עבור מוצר SaaS לניהול HR.\n\nדרישות:\n• Mobile-first\n• Figma (share קישור לצפייה)\n• שני screens לפחות: Welcome + First Action\n• כולל empty states\n• הסבר על החלטות UX (200-300 מילים)\n\nזמן משוער: 3-5 שעות`,
    deadline_hours: 72,
    status: "evaluated",
    sent_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    submission: {
      type: "url",
      content: "https://figma.com/file/demo-michal-onboarding",
      submitted_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      evaluation_score: 93,
      evaluation_feedback: "עיצוב מרהיב! Mobile-first מושלם, empty states מחושבים, החלטות UX מנומקות היטב. ניכר ניסיון עם Design Systems. הייתי שמח לראות עוד variation אחד של ה-Welcome screen.",
      evaluated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
    whatsapp_message: `שלום מיכל! 🎨\n\nציון AI שלך מרשים מאוד. לפני שלב הריאיון האישי, יש לנו מטלת עיצוב קצרה.\n\n⏰ זמן: 72 שעות\n📎 קישור למטלה: https://hr.demo/assignment/assign-3\n\nנשמח לראות את היצירתיות שלך! ✨`,
  },
];

// ── Demo WhatsApp / Settings ──────────────────────────────────────────────────
export const DEMO_SETTINGS = {
  organization: {
    name: "TechCorp HR",
    website: "https://techcorp.example.com",
    industry: "טכנולוגיה",
    size: "50-200",
    logo_url: null,
  },
  whatsapp: {
    provider: "twilio" as "twilio" | "meta",
    connected: false,
    twilio: {
      account_sid: "",
      auth_token: "",
      whatsapp_number: "",
    },
    meta: {
      phone_number_id: "",
      access_token: "",
      verify_token: "",
    },
    webhook_url: typeof window !== "undefined"
      ? `${window.location.origin}/api/webhooks/whatsapp/twilio`
      : "https://your-domain.com/api/webhooks/whatsapp/twilio",
  },
  notifications: {
    new_candidate: true,
    high_score: true,
    escalation: true,
    assignment_submitted: true,
  },
};

export function isDemoMode(request?: { cookies?: { has?: (name: string) => boolean; get?: (name: string) => { value: string } | undefined } }): boolean {
  // Server-side: check cookie or env var
  if (typeof window === "undefined") {
    if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") return true;
    if (request?.cookies?.has?.("hr-demo")) return true;
    return false;
  }
  // Client-side: check env var
  return process.env.NEXT_PUBLIC_DEMO_MODE === "true";
}
