# ARCHITECTURE v2 — תוספת: שלושת המודולים החסרים

מחבר: Claude · 2026-08-03 · סטטוס: **טיוטה, ממתין להחלטות אסף**
משלים את [ARCHITECTURE.md](ARCHITECTURE.md). קרא אותו קודם.

---

## רקע

אסף זיהה שלושה חוסרים אחרי שראה את המערכת רצה. שלושתם נכונים — אימתתי בקוד.

| # | החוסר | מצב אמיתי |
|---|---|---|
| 1 | אין איפה לכוון את הסוכן — שאלות, טון, אישיות | UI קיים, **DB לא**. `PUT /api/agent/config` מחזיר `501` |
| 2 | אין מנוע למצוא חברות שמשלמות על מועמדים | לא קיים כלל |
| 3 | אין מסלול מודעה → וואטסאפ → ריאיון → טבלה מדורגת | חלקים קיימים, החוליה המקשרת חסרה |

---

## מודול 1 · Agent Studio — כוונון הסוכן

### מה קיים ומה חסר

בסכמה הנוכחית, על `jobs`, כבר יש **פר-משרה**:
```sql
screening_questions  jsonb   -- ScreeningQuestion[]
rejection_rules      jsonb   -- RejectionRule[]
ai_instructions      text
```

מה שחסר זה השכבה ה**גלובלית** — מי הסוכן, איך הוא מדבר. זה מה שהיה בפרוטוטייפ ואבד.

### הסכמה

```sql
-- אישיות הסוכן. גלובלי, לא פר-משרה.
create table agent_profiles (
  id                 uuid primary key default uuid_generate_v4(),

  name               text not null,           -- שם הפרופיל, למשל "גיוס טכני"
  persona_name       text not null,           -- השם שהסוכן מציג בו את עצמו
  objective          text not null,           -- מה הוא אמור להשיג בשיחה
  tone               agent_tone not null default 'friendly',
                                              -- friendly | professional | strict | concise
  guidelines         text not null default '',-- כללים חופשיים
  language           text not null default 'he',

  -- גבולות התנהגות
  max_questions      integer not null default 8,
  escalate_after     integer,                 -- אחרי כמה הודעות לקרוא לאדם
  never_discuss      text[] not null default '{}',  -- נושאים אסורים (שכר? תנאים?)

  is_default         boolean not null default false,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- משרה יכולה לבחור פרופיל; אחרת ברירת המחדל
alter table client_jobs add column agent_profile_id uuid references agent_profiles;
```

### הרכבת הפרומפט

```
agent_profiles          →  מי אני, איך אני מדבר, מה אסור לי
client_jobs.screening_questions →  מה לשאול בדיוק
client_jobs.ai_instructions     →  דגשים למשרה הזו
conversation_contexts   →  מה כבר נאמר
```

`src/lib/ai/prompts/v1` כבר בנוי לזה — צריך רק להזרים את `agent_profiles` פנימה.

### סנדבוקס בדיקה — קריטי

הפרוטוטייפ כלל סימולטור צ'אט. **חובה להחזיר אותו.** בלי מקום לנסות את הסוכן לפני שהוא מדבר עם מועמד אמיתי, כל שינוי טון הוא הימור. מסך אחד: בוחר פרופיל + משרה → מדמה שיחה → רואה בדיוק מה הסוכן היה עונה.

---

## מודול 2 · מנוע איתור לקוחות

### ⚠️ הבהרה שחייבת לבוא ראשונה

"שה-AI ימצא לי חברות שמשלמות על מועמדים" — **מודל שפה לא יכול לעשות את זה לבד.** אין לו גישה לאינטרנט, והוא לא יודע מי משלם דמי תיווך. אם נבקש ממנו רשימה, הוא **ימציא שמות חברות וסכומים** בביטחון מלא. זו לא תקלה — ככה מודלים עובדים.

צריך **מקור מידע אמיתי**. שלוש אפשרויות:

| מקור | איך | עלות | איכות |
|---|---|---|---|
| **A. חיפוש רשת** (Brave/Serper API) | AI מחפש "דרושים", לוחות משרות, ואז מסכם ומדרג | ~$5–20/חודש | בינונית-טובה |
| **B. הזנה ידנית + העשרה** | אסף מזין חברה → AI חוקר, מסכם, מנסח פנייה | חינם | גבוהה, אבל ידנית |
| **C. לוחות משרות** (AllJobs, LinkedIn) | סקרייפינג | — | ⛔ **נוגד תנאי שימוש. לא ממליץ.** |

**המלצתי: להתחיל ב-B, להוסיף A אחר כך.**
ב-MVP הערך של ה-AI הוא לא ה*מציאה* — היא החלק הקל, אסף יודע לזהות חברות מגייסות. הערך הוא **הכשרה, תיעדוף וניסוח הפנייה**. זה מה שחוסך שעות.

### הסכמה

```sql
create table client_leads (
  id                 uuid primary key default uuid_generate_v4(),

  company_name       text not null,
  domain             text,
  source             text not null,          -- 'manual' | 'web_search' | 'referral'
  source_url         text,

  -- מה שה-AI חקר
  industry           text,
  size_estimate      text,
  open_roles         jsonb not null default '[]',
  research_summary   text,
  research_at        timestamptz,

  -- הכשרה
  fit_score          smallint check (fit_score between 0 and 100),
  fit_reasoning      text,
  est_fee_ils        integer,                -- הערכת שווי השמה
  pays_agency_fees   boolean,                -- ידוע? משוער? לא ידוע?

  -- מסלול
  status             lead_status not null default 'new',
                     -- new|researching|qualified|contacted|replied|won|lost
  contact_name       text,
  contact_email      text,

  converted_to       uuid references client_companies,
  created_at         timestamptz not null default now()
);

-- טיוטות פנייה. AI כותב, אסף מאשר — לעולם לא שולח לבד.
create table outreach_drafts (
  id           uuid primary key default uuid_generate_v4(),
  lead_id      uuid not null references client_leads on delete cascade,

  channel      text not null default 'email',
  subject      text,
  body         text not null,

  status       text not null default 'draft',  -- draft|approved|sent
  approved_at  timestamptz,
  sent_at      timestamptz,
  created_at   timestamptz not null default now()
);
```

> 🔒 **שליחה אוטומטית — לא.** ה-AI מנסח, אסף קורא ולוחץ שלח. מייל שיוצא בשמו לחברה היא פעולה חד-כיוונית מול לקוח פוטנציאלי. גם טעות אחת מביכה עולה בקשר.

### סף ה-8,000 ₪
`est_fee_ils` מחושב מהערכת שכר שנתי × אחוז העמלה. הסינון של אסף (8K+) הוא **פילטר בתצוגה**, לא כלל קשיח בסכמה — כדי שיוכל לשנות אותו בלי מיגרציה.

---

## מודול 3 · מודעה → וואטסאפ → ריאיון → טבלה

זה המסלול שסוגר את הלולאה. רוב החלקים כבר קיימים; חסרה **החוליה המקשרת**.

```
  ① AI כותב מודעה  ──►  ② לינק wa.me עם קוד קמפיין
                                      │
                          המועמד לוחץ, נפתח וואטסאפ
                          עם הודעה מוכנה: "היי, מעוניין ב-JOB-A7X"
                                      │
                                      ▼
                          ③ Webhook קיים תופס את הקוד
                             ומקשר את המספר לקמפיין ולמשרה
                                      │
                                      ▼
                          ④ recruiter-agent מראיין
                             (קיים — לפי agent_profiles + שאלות המשרה)
                                      │
                                      ▼
                          ⑤ ציון רב-ממדי → טבלה מסוננת
```

### החוליה החסרה: `campaigns`

```sql
create table campaigns (
  id             uuid primary key default uuid_generate_v4(),
  client_job_id  uuid not null references client_jobs on delete cascade,

  code           text not null unique,   -- "A7X" — קצר, נכנס להודעת וואטסאפ
  channel        text not null,          -- 'facebook' | 'linkedin' | 'whatsapp_group'
  ad_copy        text not null,          -- מה שה-AI כתב
  wa_link        text not null,          -- https://wa.me/972...?text=...A7X

  -- מדידה — יודעים איזה ערוץ עובד
  clicks         integer not null default 0,
  conversations  integer not null default 0,
  qualified      integer not null default 0,

  is_active      boolean not null default true,
  created_at     timestamptz not null default now()
);
```

הקוד ב-`?text=` הוא **כל הטריק**: הוא הופך הודעת וואטסאפ אנונימית לפנייה מיוחסת למשרה ולערוץ. בלעדיו לא יודעים מאיפה הגיע אף אחד.

**חשוב:** להתייחס ל-`code` כרמז ולא כאמת מוחלטת — מועמדים עורכים את ההודעה. אם הקוד חסר, הסוכן פשוט שואל "לאיזו משרה?".

### הציון הרב-ממדי

במקום `ai_score` יחיד:

```sql
create table candidate_scores (
  id            uuid primary key default uuid_generate_v4(),
  person_id     uuid not null references people on delete cascade,
  client_job_id uuid not null references client_jobs on delete cascade,

  overall       smallint check (overall between 0 and 100),

  -- ממדים — כולם קשורי-תפקיד
  tools_match      smallint,   -- ניסיון בכלים הרלוונטיים
  domain_match     smallint,   -- חברות/תעשייה דומות
  seniority_match  smallint,   -- ותק מול הדרישה
  communication    smallint,   -- בהירות בשיחה
  confidence       smallint,   -- ביטחון כפי שהשתקף בשיחה
  motivation       smallint,

  reasoning     jsonb not null,  -- נימוק פר ממד — חובה, לא רק מספר
  scored_at     timestamptz not null default now(),

  unique (person_id, client_job_id)
);
```

`reasoning` חובה: ציון בלי הסבר לא ניתן לערער עליו, ולא ניתן לשפר את הפרומפט על בסיסו.

---

## ⚖️ נקודה משפטית שחייבת להיאמר — סינון לפי גיל ומגדר

ברשימת הפילטרים הופיעו **גיל ומגדר**. את שני אלה אני ממליץ בתוקף לא לבנות כקריטריון סינון או דירוג.

**חוק שוויון ההזדמנויות בעבודה, התשמ"ח-1988** אוסר הפליה בקבלה לעבודה על בסיס גיל ומין. מערכת שמדרגת מועמדים לפיהם היא כלי להפליה — והחשיפה כאן היא **ישירות של אסף**, כי הוא הסוכנות שמציגה את המועמדים, לא ספק תוכנה.

ההבחנה המעשית:

| שימוש | מותר? |
|---|---|
| לסנן/לדרג מועמדים לפי גיל או מגדר | ⛔ לא |
| דרישת גיל שהיא תנאי חוקי לתפקיד (רישיון, ביטחון) | ✅ כן — כדרישת סף מוגדרת, לא כפילטר כללי |
| דיווח דמוגרפי מצטבר בדיעבד (פילוח גיוון) | ✅ כן — מצרפי, לא ברמת המועמד |

כל שאר הממדים שביקש — ביטחון, כלים, חברות דומות, ותק, מוטיבציה — **לגיטימיים לחלוטין וקשורי-תפקיד**, והם גם אלה שבאמת מנבאים התאמה. `candidate_scores` למעלה בנוי מהם.

אני לא עורך דין וזו לא חוות דעת משפטית. אבל זה סיכון אמיתי שעדיף לדעת עליו לפני שבונים, לא אחרי.

---

## סדר ביצוע מוצע

| שלב | מודול | מבצע | הערכה |
|---|---|---|---|
| 1 | `agent_profiles` + חיבור ל-API הקיים | Ollama | 1.5 שע׳ |
| 2 | סימולטור הצ'אט (החזרה מהפרוטוטייפ) | AG | 3 שע׳ |
| 3 | `campaigns` + מחולל לינק wa.me | Ollama | 2 שע׳ |
| 4 | זיהוי קוד קמפיין ב-webhook | **Claude** | 2 שע׳ |
| 5 | `candidate_scores` + טבלה מסוננת | Ollama → AG | 4 שע׳ |
| 6 | `client_leads` + חקר והכשרה | AG | 4 שע׳ |
| 7 | `outreach_drafts` + אישור ידני | **Claude** | 3 שע׳ |

שלבים 4 ו-7 אצלי: הראשון נוגע בייחוס (מי הביא את המועמד = מי מקבל את העמלה), השני בשליחת מידע החוצה.

---

## החלטות שצריך מאסף

1. **מקור מידע לאיתור חברות** — ידני+העשרה (מומלץ), או חיפוש רשת בתשלום?
2. **מספר וואטסאפ** — יש מספר עסקי? Twilio או Meta? זה חוסם את מודול 3.
3. **פרופיל סוכן אחד או כמה?** — פרופיל לכל סוג משרה, או אחד גלובלי?
4. **גיל ומגדר** — מאשר לוותר עליהם כפילטרים, לפי הסעיף המשפטי למעלה?
