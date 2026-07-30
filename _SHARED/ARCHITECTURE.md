# ARCHITECTURE v1 — HR_AG

מחבר: Claude · 2026-07-30 · סטטוס: **טיוטה לביקורת AG**

---

## 1. מה השתנה במודל העסקי

| | HR_Project (קיים) | HR_AG (חדש) |
|---|---|---|
| מי משלם | מגייסת שקונה תוכנה | **חברה מעסיקה** |
| מי מפעיל את המערכת | הלקוח | **אסף** |
| הכנסה | מנוי | **דמי הצלחה על השמה שהתקבלה** |
| נכס הליבה | הקוד | **מאגר המועמדים** |
| המועמד שייך ל־ | משרה אחת בארגון אחד | **המאגר — לתמיד** |

השורה האחרונה היא כל הארכיטקטורה. כל השאר נגזר ממנה.

---

## 2. החסם: המועמד לא יכול להתקיים בלי משרה

בסכמה הקיימת (`20260513000005_candidates.sql`):

```sql
create table candidates (
  job_id          uuid not null references jobs,          -- ⛔
  organization_id uuid not null references organizations, -- ⛔
  unique (job_id, email)                                  -- ⛔
);
```

שלוש שורות, שלוש בעיות:

1. **`job_id not null`** — אין "מועמד במאגר". מועמד = הגשה למשרה. הנכס העסקי שלך לא ניתן לביטוי בסכמה.
2. **`organization_id not null`** — כל מועמד כלוא בארגון אחד. אי אפשר להציע אותו לחברה שנייה.
3. **`unique (job_id, email)`** — דדופ **פר משרה**. אותו אדם שהגיש ל-5 משרות = 5 רשומות נפרדות, בלי קשר ביניהן. אין "אדם".

הכלכלה של העסק היא לפרוס עלות גיוס מועמד על פני **הרבה** השמות. הסכמה הנוכחית מאלצת עלות מלאה בכל פעם.

**התיקון:** לפצל את `candidates` לשתי ישויות.

```
people        — האדם. גלובלי, מדודפל, בלי משרה ובלי חברה.
submissions   — האירוע: הצגתי את האדם הזה לחברה הזו למשרה הזו.
```

---

## 3. היפוך הרב-דיירות (Tenancy)

היום `organizations` = דייר = "חברה שמשתמשת בפלטפורמה", וכל ה-RLS נשען על:

```sql
using (organization_id = get_current_org_id())
```

בחדש `organizations` מתפצל לשני דברים **שונים בתכלית**:

- **הסוכנות** — אסף + עובדים עתידיים. דייר יחיד. גישה מלאה.
- **`client_companies`** — הלקוחות. הם **דאטה**, ובנוסף מקבלים פורטל מוגבל.

`get_current_org_id()` כבר לא מבטא את מודל הגישה. RLS נכתב מחדש לשתי משפחות זרות:

```sql
-- צוות פנימי: רואה הכל
create policy people_staff_all on people
  to authenticated using (is_staff());

-- משתמש לקוח: רואה אדם רק אם הוצג לחברה שלו
create policy people_client_select on people
  to authenticated using (
    exists (
      select 1 from submissions s
      where s.person_id = people.id
        and s.client_company_id = current_client_company_id()
    )
  );
```

זו לא התאמה — זו כתיבה מחדש של מיגרציה 009. **חובה שתיכתב ע"י Claude, לא Ollama.**

---

## 4. הסכמה החדשה

### 4.1 המאגר

```sql
-- האדם. קיים פעם אחת. לא שייך למשרה ולא לחברה.
create table people (
  id                uuid primary key default uuid_generate_v4(),

  full_name         text not null,
  email_normalized  text,          -- lowercase, trimmed
  phone_e164        text,          -- +972501234567

  cv_url            text,
  cv_parsed_data    jsonb,         -- נשמר כמו שהוא מ-HR_Project
  cv_embedding      vector(768),   -- pgvector — ראה §6

  source            text,          -- 'inbound_form' | 'facebook' | 'referral' | 'manual'
  pool_status       pool_status not null default 'active',
                                   -- active | placed | cold | opted_out
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- דדופ גלובלי — לא פר-משרה
create unique index people_phone_uniq on people (phone_e164) where phone_e164 is not null;
create unique index people_email_uniq on people (email_normalized) where email_normalized is not null;
create index people_embedding_idx on people using hnsw (cv_embedding vector_cosine_ops);
```

### 4.2 הלקוחות

```sql
create table client_companies (
  id           uuid primary key default uuid_generate_v4(),
  name         text not null,
  slug         text not null unique,
  domain       text,
  status       text not null default 'prospect',  -- prospect | active | churned
  created_at   timestamptz not null default now()
);

-- משתמשי הפורטל של הלקוח. נפרד מ-recruiter_profiles.
create table client_users (
  id                 uuid primary key references auth.users on delete cascade,
  client_company_id  uuid not null references client_companies on delete cascade,
  full_name          text not null,
  role               text not null default 'viewer',   -- viewer | hiring_manager
  created_at         timestamptz not null default now()
);

-- הזמנת משרה מלקוח. מחליף את jobs.
create table client_jobs (
  id                 uuid primary key default uuid_generate_v4(),
  client_company_id  uuid not null references client_companies on delete cascade,
  fee_agreement_id   uuid references fee_agreements,

  title              text not null,
  description        text not null default '',
  requirements       text[] not null default '{}',
  must_have          text[] not null default '{}',   -- לסינון קשיח בשלב 1
  location           text,
  salary_range       jsonb,
  status             job_status not null default 'open',

  job_embedding      vector(768),
  created_at         timestamptz not null default now()
);
```

### 4.3 מודול הכסף — לא קיים היום בכלל

```sql
-- תנאי מסחר מול לקוח
create table fee_agreements (
  id                 uuid primary key default uuid_generate_v4(),
  client_company_id  uuid not null references client_companies on delete cascade,

  model              text not null,          -- 'percent_of_annual' | 'flat'
  percent            numeric(5,2),           -- למשל 15.00
  flat_amount        numeric(12,2),
  currency           text not null default 'ILS',

  guarantee_days     integer not null default 90,   -- עזב בתוך X → החלפה/זיכוי
  payment_terms_days integer not null default 30,
  ownership_months   integer not null default 12,   -- ראה §5

  signed_at          timestamptz,
  valid_from         date not null,
  valid_to           date,

  check (
    (model = 'percent_of_annual' and percent is not null) or
    (model = 'flat' and flat_amount is not null)
  )
);

-- ההשמה בפועל
create table placements (
  id              uuid primary key default uuid_generate_v4(),
  submission_id   uuid not null unique references submissions,
  person_id       uuid not null references people,
  client_job_id   uuid not null references client_jobs,

  hired_at        timestamptz not null,
  start_date      date not null,
  annual_salary   numeric(12,2) not null,
  currency        text not null default 'ILS',

  fee_amount      numeric(12,2) not null,
  fee_basis       jsonb not null,      -- צילום החישוב: {model, percent, salary}
                                       -- כדי שהחשבונית לא תשתנה אם ההסכם ישתנה

  guarantee_until date not null,
  guarantee_status text not null default 'active'  -- active | passed | invoked
);

create table invoices (
  id                 uuid primary key default uuid_generate_v4(),
  placement_id       uuid not null references placements,
  client_company_id  uuid not null references client_companies,

  amount             numeric(12,2) not null,
  currency           text not null default 'ILS',
  status             text not null default 'draft',  -- draft|sent|paid|overdue|credited
  issued_at          timestamptz,
  due_at             date,
  paid_at            timestamptz
);
```

---

## 5. `submissions` — הטבלה שמייצרת את הכסף

זו הטבלה הכי חשובה במערכת. היא **התביעה המשפטית שלך לעמלה**.

התרחיש שהורג עסקי גיוס: הצגת מועמד, החברה "מצאה אותו לבד" חודשיים אחר כך, לא שילמה. בלי רשומה חתומה בזמן — אין לך מה להראות.

```sql
create table submissions (
  id                    uuid primary key default uuid_generate_v4(),
  person_id             uuid not null references people,
  client_job_id         uuid not null references client_jobs,
  client_company_id     uuid not null references client_companies,

  introduced_by         uuid references recruiter_profiles,
                        -- NULL = הסוכנות עצמה.
                        -- קיים מיום 1 כדי לאפשר מודל אפיליאייט בעתיד
                        -- בלי שינוי סכמה.

  presented_at          timestamptz not null default now(),
  ownership_expires_at  timestamptz not null,   -- presented_at + ownership_months

  dossier_snapshot      jsonb not null,   -- עותק אימוטבילי של מה שנשלח בפועל
  consent_id            uuid not null references consents,
  pii_revealed_at       timestamptz,      -- מתי הלקוח פתח את הזהות

  status                submission_status not null default 'presented'
                        -- presented|viewed|interviewing|offer|hired|rejected|expired
);

-- append-only: אין UPDATE ואין DELETE על העובדות
revoke update, delete on submissions from authenticated;
create unique index submissions_person_job_uniq on submissions (person_id, client_job_id);
create index submissions_ownership_idx on submissions (client_company_id, person_id, ownership_expires_at);
```

שלוש תכונות קריטיות:

1. **`ownership_expires_at`** — חלון בעלות. הלקוח שכר את האדם בתוך החלון → העמלה מגיעה לך, גם אם "הגיע מערוץ אחר".
2. **`dossier_snapshot`** — צילום אימוטבילי של מה שנשלח. הראיה. `people` ישתנה עם הזמן; הצילום לא.
3. **append-only** — עובדות לא נערכות. שינוי מצב = רשומה חדשה ב-`submission_events`, לא UPDATE.

> **משפטי — לבדיקת עו"ד, לא לקוד:** בישראל תיווך עבודה פרטי מוסדר (רישיון לשכת תעסוקה פרטית ממשרד העבודה), וגביית תשלום **מהמועמד** אסורה. המודל חייב להיות: המעסיק משלם, המועמד לעולם לא. הסכמה כאן משקפת את זה — אין שום מסלול חיוב שמצביע על `people`. אני לא נותן ייעוץ משפטי; זה דגל, לא חוות דעת.

---

## 6. הסכמה — לא היה צריך קודם, חובה עכשיו

קודם: המועמד הגיש למשרה ספציפית. ההסכמה מובלעת ותחומה.
עכשיו: אתה מחזיק מאגר ומציע אנשים לחברות. זה שימוש אחר לגמרי.

```sql
create table consents (
  id                 uuid primary key default uuid_generate_v4(),
  person_id          uuid not null references people on delete cascade,

  scope              text not null,   -- 'pool' | 'present_to_client'
  client_company_id  uuid references client_companies,  -- לפי scope

  granted_at         timestamptz not null default now(),
  revoked_at         timestamptz,
  evidence           jsonb not null   -- {channel:'whatsapp', message_id:'...'}
);
```

`submissions.consent_id NOT NULL` אוכף במסד שאי אפשר להציג אדם בלי הסכמה מתועדת. **סוכן ה-WhatsApp הקיים אוסף את זה** — התשתית כבר בנויה.

---

## 7. הפורטל: הסתרת PII כברירת מחדל

הכשל הקלאסי: שולח CV מלא → החברה פונה ישירות → עוקפת אותך → אין עמלה.

הפורטל מציג **דוסייה אנונימית**: כישורים, ותק, ציון התאמה, תמצית הצ'אט, תוצאות מטלה — **בלי** שם, טלפון, מייל, מעסיק נוכחי.

חשיפה = פעולה מפורשת ומתועדת שמחזקת את רשומת הבעלות (`pii_revealed_at`).

> **אכיפה בשרת בלבד.** ה-PII לא נשלח ללקוח ומוסתר ב-CSS — הוא **לא עוזב את השרת**. השאילתה של הפורטל בוררת `dossier_snapshot`, לא `people`. זו הנקודה שהכי קל לפשל בה ולאבד את העסק.

זה בדיוק ה-**Candidate Dossier (תעודת זהות מועמד)** שכבר הגדרת ב-`PROJECT_LOG.md` — כאן הוא הופך גם למנגנון הגנה על ההכנסה.

---

## 8. ההתאמה: מ"ניקוד" ל"אחזור"

היום: מועמד מגיש → מנקדים אותו מול המשרה שאליה הגיש. יחס 1:1.
בחדש: משרה נכנסת → צריך לדרג **אלפי** אנשים מהמאגר. הרצת LLM על כל אחד = בלתי אפשרי כלכלית, במיוחד כשהיעד הוא מחשוב חינמי.

**שני שלבים:**

```
   מאגר (אלפים)
        │
   ① סינון זול   ── SQL קשיח: location, ותק, must_have, שכר, זמינות
      + pgvector    cosine(job_embedding, cv_embedding)
        │           ⟶ רץ מקומית, עלות ~0
        ▼
     ~50 מועמדים
        │
   ② דירוג יקר  ── LLM: ניקוד מנומק + כתיבת הדוסייה
        │           ⟶ רק כאן משלמים
        ▼
   Top 5–10 להצגה
```

- אמבדינגים נשמרים על `people` ומחושבים מחדש **רק** כשה-CV משתנה.
- שלב ① מתאים מצוין ל-Ollama מקומי — אמבדינגים זולים ורצים על CPU.
- **כיוון הפוך באותו מנגנון:** אדם חדש נכנס למאגר → התאמה מול כל המשרות הפתוחות.

---

## 9. מה נשמר מ-16 הפייסים (לא לבנות מחדש)

| רכיב | מקור | תפקיד חדש |
|---|---|---|
| סוכן WhatsApp + `conversation_contexts` | מיגרציה 006 | טיפוח מאגר + **איסוף הסכמות** |
| פירסור CV → `cv_parsed_data` | קיים | ללא שינוי, עובר ל-`people` |
| מטלות + הערכת AI | מיגרציה 007 | הבידול החזק ביותר בדוסייה |
| `ai_usage_logs`, `audit_logs` | מיגרציה 008 | קריטי — מעקב עלות ושרשרת ראיות |
| Storage + מדיניות | מיגרציה 010 | ללא שינוי |
| אבטחה + rate limiting | Phase 12 | ללא שינוי |
| קונפיג דיפלוי | Phase 13 | ללא שינוי |

**~70% מהמנוע שורד.** מה שמשתנה: מודל הנתונים סביבו, ה-RLS, ומודול הכסף שלא קיים.

---

## 10. סדר ביצוע מוצע

| שלב | תוכן | מבצע |
|---|---|---|
| 0 | ייסוד `HR_AG` מחדש על 13 המיגרציות של `HR_Project` | AG |
| 1 | `people` + backfill מ-`candidates` + דדופ גלובלי | Ollama |
| 2 | `client_companies`, `client_users`, `client_jobs` | Ollama |
| 3 | `consents` + חיבור לסוכן WhatsApp | Ollama |
| 4 | **`submissions`** + append-only + חלון בעלות | **Claude** |
| 5 | **RLS מלא — צוות מול לקוח** | **Claude** |
| 6 | `fee_agreements`, `placements`, `invoices` | Ollama → ביקורת Claude |
| 7 | pgvector + שלב ① של ההתאמה | Ollama |
| 8 | שלב ② + כתיבת דוסייה | AG |
| 9 | פורטל לקוח + **הסתרת PII בשרת** | **Claude** |

שלבים 4, 5, 9 נוגעים בכסף, בגישה ובפרטיות. שם באג עולה כסף אמיתי או חושף מידע אישי — לכן לא מועברים למודל מקומי.

---

## 11. שאלות פתוחות (החלטות שלך, אסף)

1. **מודל העמלה** — אחוז משכר שנתי (מקובל: 12–20%) או סכום קבוע? משפיע על `fee_agreements`.
2. **חלון בעלות** — 6 / 12 / 18 חודשים? ברירת המחדל שלי: 12.
3. **תקופת אחריות** — כמה ימים החלפה חינם אם המועמד עוזב? ברירת מחדל: 90.
4. **פורטל ללקוח ב-MVP?** — או שבשלב ראשון פשוט שולח דוסייה במייל/PDF? **המלצתי: בלי פורטל ב-MVP.** זה חוסך את כל שלב 9, שהוא הכי יקר. אבל **הסתרת ה-PII נשארת** — גם ב-PDF.
5. **אפיליאייטים** — מגייסים אחרים שמכניסים מועמדים ומקבלים חלק? `introduced_by` כבר מוכן לזה; לא צריך להחליט עכשיו.
