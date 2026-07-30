-- SQL Schema for Multi-Tenant HR CRM & WhatsApp AI Recruitment Agent
-- Run this script in the Supabase SQL Editor to initialize or update the tables.

-- Clear existing tables to update the schema with multi-tenant columns
DROP TABLE IF EXISTS whatsapp_config CASCADE;
DROP TABLE IF EXISTS uploaded_contracts CASCADE;
DROP TABLE IF EXISTS agent_settings CASCADE;
DROP TABLE IF EXISTS candidates CASCADE;
DROP TABLE IF EXISTS positions CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;

-- 1. Create Organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL,
  allowed_domains TEXT[] DEFAULT '{}',
  allowed_emails TEXT[] DEFAULT '{}'
);

-- Apply column updates in case the table already exists
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS allowed_domains TEXT[] DEFAULT '{}';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS allowed_emails TEXT[] DEFAULT '{}';

-- 2. Create User Profiles table linked to Supabase Auth and Organizations
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY,
  organization_id TEXT REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'recruiter',
  created_at TEXT NOT NULL
);

-- Apply column updates in case the table already exists
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT NOT NULL DEFAULT '';

-- 3. Create Positions table
CREATE TABLE IF NOT EXISTS positions (
  id TEXT PRIMARY KEY,
  organization_id TEXT REFERENCES organizations(id) ON DELETE CASCADE DEFAULT 'default-org',
  title TEXT NOT NULL,
  experience_years INTEGER NOT NULL,
  requirements JSONB NOT NULL DEFAULT '[]',
  questions JSONB NOT NULL DEFAULT '[]',
  test_prompt TEXT NOT NULL DEFAULT '',
  contract_template TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TEXT NOT NULL
);

-- 4. Create Candidates table
CREATE TABLE IF NOT EXISTS candidates (
  id TEXT PRIMARY KEY,
  organization_id TEXT REFERENCES organizations(id) ON DELETE CASCADE DEFAULT 'default-org',
  position_id TEXT REFERENCES positions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('interview', 'test', 'completed', 'signed', 'rejected')),
  requested_salary TEXT NOT NULL DEFAULT '',
  salary_fit_analysis TEXT NOT NULL DEFAULT '',
  experience_summary TEXT NOT NULL DEFAULT '',
  score INTEGER NOT NULL DEFAULT 50,
  ai_fit_summary TEXT NOT NULL DEFAULT '',
  test_answers TEXT NOT NULL DEFAULT '',
  test_feedback TEXT NOT NULL DEFAULT '',
  chat_transcript JSONB NOT NULL DEFAULT '[]',
  hr_notes TEXT NOT NULL DEFAULT '',
  contract_sent BOOLEAN NOT NULL DEFAULT FALSE,
  contract_signed BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TEXT NOT NULL,
  custom_contract_content TEXT DEFAULT ''
);

-- 5. Create Agent Settings table (One per Organization)
CREATE TABLE IF NOT EXISTS agent_settings (
  organization_id TEXT PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
  persona_name TEXT NOT NULL DEFAULT 'איימי',
  custom_objective TEXT NOT NULL DEFAULT '',
  conversational_tone TEXT NOT NULL DEFAULT 'friendly',
  additional_guidelines TEXT NOT NULL DEFAULT ''
);

-- 6. Create Uploaded Contract Templates table
CREATE TABLE IF NOT EXISTS uploaded_contracts (
  id TEXT PRIMARY KEY,
  organization_id TEXT REFERENCES organizations(id) ON DELETE CASCADE DEFAULT 'default-org',
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size TEXT NOT NULL,
  uploaded_at TEXT NOT NULL
);

-- 7. Create WhatsApp Config table (One per Organization)
CREATE TABLE IF NOT EXISTS whatsapp_config (
  organization_id TEXT PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL DEFAULT '',
  access_token TEXT NOT NULL DEFAULT '',
  phone_number_id TEXT NOT NULL DEFAULT '',
  business_account_id TEXT NOT NULL DEFAULT '',
  webhook_verify_token TEXT NOT NULL DEFAULT '',
  provider TEXT NOT NULL DEFAULT 'sandbox_sim',
  custom_agent_url TEXT NOT NULL DEFAULT '',
  is_configured BOOLEAN NOT NULL DEFAULT FALSE
);

-- Enable Row-Level Security (RLS) and define permissive public policies.
-- Since the Express server is the sole gatekeeper and authenticates/filters all tenant data at the API layer,
-- we allow public (anon & authenticated) access at the database level to prevent RLS violations.

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public access to organizations" ON organizations;
CREATE POLICY "Allow public access to organizations" ON organizations FOR ALL TO public USING (true) WITH CHECK (true);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public access to profiles" ON profiles;
CREATE POLICY "Allow public access to profiles" ON profiles FOR ALL TO public USING (true) WITH CHECK (true);

ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public access to positions" ON positions;
CREATE POLICY "Allow public access to positions" ON positions FOR ALL TO public USING (true) WITH CHECK (true);

ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public access to candidates" ON candidates;
CREATE POLICY "Allow public access to candidates" ON candidates FOR ALL TO public USING (true) WITH CHECK (true);

ALTER TABLE agent_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public access to agent_settings" ON agent_settings;
CREATE POLICY "Allow public access to agent_settings" ON agent_settings FOR ALL TO public USING (true) WITH CHECK (true);

ALTER TABLE uploaded_contracts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public access to uploaded_contracts" ON uploaded_contracts;
CREATE POLICY "Allow public access to uploaded_contracts" ON uploaded_contracts FOR ALL TO public USING (true) WITH CHECK (true);

ALTER TABLE whatsapp_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public access to whatsapp_config" ON whatsapp_config;
CREATE POLICY "Allow public access to whatsapp_config" ON whatsapp_config FOR ALL TO public USING (true) WITH CHECK (true);

-- 8. Insert Default Seed Data

-- Seed Default Organization
INSERT INTO organizations (id, name, created_at)
VALUES ('default-org', 'ארגון ברירת מחדל', '2026-05-01')
ON CONFLICT (id) DO NOTHING;

-- Seed Positions
INSERT INTO positions (id, organization_id, title, experience_years, requirements, questions, test_prompt, contract_template, is_active, created_at)
VALUES 
(
  'pos-1', 
  'default-org',
  'אנליסט נתונים בכיר (Senior Data Analyst)', 
  5, 
  '["כתיבה ושליטה מוחלטת בשאילתות SQL מורכבות (Window Functions, CTEs)", "ניסיון בפיתוח דשבורדים מורכבים ב-Tableau או Power BI", "ניסיון בניתוח נתונים ב-Python / Pandas וסטטיסטיקה יישומית", "רקע בעבודה צמודה מול צוותי מוצר ופיתוח עסקי"]'::jsonb,
  '["ספר על פרויקט דאטה מורכב שפיתחת וכיצד הוא השפיע על ההחלטות העסקיות בחברה.", "מהי המומחיות שלך בכתיבת שאילתות SQL מורכבות, ואיך אתה מייעל שאילתה איטית?", "איך אתה מתמודד עם נתונים חסרים או לא עקביים במקורות המידע השונים?"]'::jsonb,
  'כתוב שאילתת SQL שתחשב ממוצע נע של 7 ימים של סך המכירות לכל קטגוריית מוצר, והסבר כיצד תייעל את השאילתה מול מיליארדי שורות.',
  $$הסכם העסקה אישי - משרת אנליסט נתונים בכיר

שנערך ונחתם ביום {date}
בין: חברת דאטה-טק בע"מ (להלן: "החברה")
לבין: {name}, ת.ז. {phone} (להלן: "העובד")

1. הגדרת התפקיד:
העובד יועסק בתפקיד Senior Data Analyst במחלקת הנתונים של החברה.

2. תנאי שכר והטבות:
השכר החודשי הגלובלי ברוטו של העובד יעמוד על {salary} ש"ח בחודש.
הפרשות פנסיוניות וקרן השתלמות כחוק מהיום הראשון.

3. סודיות ואי תחרות:
העובד מתחייב לשמור על סודיות מוחלטת של כל מידע עסקי או טכנולוגי אשר יגיע לידיו במסגרת תפקידו.

החברה: _________________             העובד: _________________$$,
  true,
  '2026-05-10'
),
(
  'pos-2', 
  'default-org',
  'מפתח Fullstack - React & Node.js', 
  3, 
  '["ניסיון בפיתוח אפליקציות SPA מתקדמות ב-React, TypeScript ו-Tailwind", "ניסיון קודם בפיתוח שרתי REST/GraphQL ב-Node.js / Express", "הבנה במסדי נתונים מבוססי SQL ו-NoSQL", "יכולת עבודה עצמאית והובלת משימות משלב האפיון עד הפרודקשן"]'::jsonb,
  '["מה הניסיון שלך עם React Hooks וניהול סטייט מורכב?", "תאר ארכיטקטורה של API מאובטח ויעיל שבנית בעבר ב-Node.js.", "איך אתה פותר בעיות ביצועים או קריסה של שרת בגלל עומס?"]'::jsonb,
  'כתוב פונקציית TypeScript שמבצעת חלוקת משימות אופטימלית בין עובדים (Scheduling Algorithm) תוך שמירה על עומס מאוזן, והסבר את הסיבוכיות של הפתרון שלך.',
  $$הסכם העסקה אישי - מפתח Fullstack React & Node.js

שנערך ונחתם ביום {date}
בין: חברת קוד-מאסטرز טכנולוגיות (להלן: "החברה")
לבין: {name}, ת.ז. {phone} (להלן: "העובד")

1. תיאור התפקיד:
העובד יועסק כמפתח Fullstack בקוד-מאסטرز ויהיה אחראי על פיתוח צד לקוח וצד שרת.

2. תקופת ההסכם ותנאים:
השכר יעמוד על {salary} ש"ח לחמה ברוטו.
היקף משרה: משרה מלאה, 5 ימים בשבוע.

3. חתימות:
החברה: _________________             העובד: _________________$$,
  true,
  '2026-05-15'
)
ON CONFLICT (id) DO NOTHING;

-- Seed Candidates
INSERT INTO candidates (id, organization_id, position_id, name, phone, email, status, requested_salary, salary_fit_analysis, experience_summary, score, ai_fit_summary, test_answers, test_feedback, chat_transcript, hr_notes, contract_sent, contract_signed, updated_at, custom_contract_content)
VALUES
(
  'cand-1',
  'default-org',
  'pos-1',
  'ברק אברהם',
  '054-1234567',
  'barak.av@gmail.com',
  'completed',
  '24,000',
  'ציפיית השכר תואמת בצורה מושלמת את התקציב שהוגדר על ידי המחלקה ורמת מחירי השוק לתפקיד Senior עם 5 שנות ניסיון.',
  '5 שנים כאנליסט נתונים עסקי בחברת פינטק, ניסיון מעולה ב-SQL, פיתח דשבורדים עסקיים מורכבים ב-Tableau.',
  94,
  'חוות דעת ה-AI:\n- ברק הוא מועמד בעל פוטנציאל גבוה במיוחד. ניכר שהוא שולט היטב ב-SQL, מבין לעומק דאטה פיננסי ורגיל לעבוד עם מנהלי מוצר.\n- בעל מיומנויות תקשורת מעולות (התנסח בצורה סבלנית ומקצועית מאוד בשיחת הוואטסאפ).\n- מוטיבציה גבוהה להשתלב בחברה. מומלץ להתקדם מהר לחתימת חוזה!',
  'פתרון מבדק SQL - ברק אברהם:\nSELECT product_category,\n       sale_date,\n       AVG(SUM(daily_sales)) OVER(\n           PARTITION BY product_category \n           ORDER BY sale_date \n           RANGE BETWEEN INTERVAL ''6 days'' PRECEDING AND CURRENT ROW\n       ) as moving_avg_sales\nFROM product_sales\nGROUP BY product_category, sale_date;\n\nלגבי אופטימיזציה מול מיליארדי שורות - הייתי מייצר אינדקס (Indexes) על product_category ו-sale_date, מבצע קלאסטרינג לפי תאריך ומבצע חלוקה למחיצות (Partitioning) לפי קטגוריות.',
  'פתרון מצוין של המבחן המעשי! השאילתה כתובה בצורה נכונה ומשתמשת ב-Window Functions בצורה מיטבית. שיטת האופטימיזציה שתיאר מראה הבנה עמוקה של בסיסי נתונים בקנה מידה גדול. ציון מבדק: 96/100.',
  '[{"text": "שלום ברק! 👋 אני איימי, סוכנת הגיוס של החברה. אשמח לשאול אותך כמה שאלות קצרות על משרת אנליסט נתונים בכיר. מוכן?", "sender": "bot", "timestamp": "14:10"}, {"text": "היי איימי, בטח! אשמח מאוד.", "sender": "candidate", "timestamp": "14:11"}, {"text": "שיגעון. מהן ציפיות השכר החודשיות שלך (ברוטו) למשרה זו?", "sender": "bot", "timestamp": "14:12"}, {"text": "מצפה לאזור ה-24,000 ש\"ח בחודש פלוס-מינוס כתלות בתנאים הנלווים.", "sender": "candidate", "timestamp": "14:14"}, {"text": "תודה. ספר לי על פרויקט דאטה מורכב שפיתחת וכיצד הוא השפיע על ההחלטות העסקיות.", "sender": "bot", "timestamp": "14:15"}, {"text": "במקום העבודה הנוכחי שלי פיתחתי מודל לחיזוי נטישת לקוחות באמצעות Python ו-SQL, ועיצבתי דשבורד ב-Tableau עבור מנהלי המוצר. זה איפשר לנו לזהות סיכוני נטישה שבוע מראש והפחית את אחוז הנטישה ב-18%.", "sender": "candidate", "timestamp": "14:18"}, {"text": "מדהים! זו תוצאה מעולה. כעת, נשמח להעביר אליך את המבדק המעשי: כתוב שאילתת SQL שתחשב ממוצע נע של 7 ימים...", "sender": "bot", "timestamp": "14:20"}, {"text": "כמובן, הנה הפתרון שלי: SELECT product_category, sale_date, AVG(SUM(daily_sales)) OVER ...", "sender": "candidate", "timestamp": "14:35"}, {"text": "תודה ברק! הפרטים שלך והמענה על המבחן הועברו ישירות ל-CRM של המגייסת. נהיה איתך בקשר מהיר מאוד!", "sender": "bot", "timestamp": "14:36"}]'::jsonb,
  'התרשם מאוד מרקורד העבודה שלו. דיבר עם ה-AI בצורה מאוד בוגרת ומדויקת. המבחן שלו פשוט מושלם. יש לשלוח טיוטת חוזה מיידית.',
  false,
  false,
  '2026-05-28',
  ''
),
(
  'cand-2',
  'default-org',
  'pos-1',
  'שירה שגב',
  '052-9876543',
  'shira.segev@outlook.com',
  'test',
  '28,000',
  'הציפייה לשכר מעט גבוהה מטווח התקציב המשוער למשרה (התקציב נע בין 21,000 ל-25,000 ש\"ח). נדרש משא ומתן או אישור חריג במידה ורמתה המקצועית תתברר כיוצאת דופן.',
  '4 שנות ניסיון כאנליסטית מוצר בסטארטאפ קטן, שליטה גבוהה ב-Tableau ו-SQL.',
  82,
  'חוות דעת ה-AI:\n- שירה בעלת ניסיון מושך כאנליסטית מקצה לקצה. יש לה הבנה טובה של צרכי מוצר.\n- ציפיות השכר שלה מעט גבוהות מהתקציב, אך בהחלט יש לה בסיס חזק.\n- בשלב השיחה הפגינה כישורים אישיים מצוינים, שפה רהוטה וראש גדול לשיתופי פעולה.',
  '',
  'שלחה הודעה שהיא עובדת ברגעים אלו על המבחן ותחזיר אותו בהקדם הצהריים.',
  '[{"text": "שלום שירה! 👋 אני איימי, סוכנת הגיוס הווירטואלית. נעים מאוד. מהי ציפיית השכר שלך?", "sender": "bot", "timestamp": "10:30"}, {"text": "היי, הציפייה שלי היא 28 אלף שקלים בחודש.", "sender": "candidate", "timestamp": "10:31"}, {"text": "מעולה. ספר לי על פרויקט דאטה מורכב שפיתחת וכיצד הוא השפיע.", "sender": "bot", "timestamp": "10:32"}, {"text": "הובלתי הטמעת מערכת מדידה חדשה לאתר החברה שחיברה את נתוני הגולשים לתוך מחסן הנתונים של Snowflake. זה איפשר לזהות צווארי בקבוק ברישום משתמשים.", "sender": "candidate", "timestamp": "10:36"}, {"text": "נשמע מרתק! נעבור למבחן ההתאמה המעשי... הנה השאלה לגבי ממוצע נע ב-SQL.", "sender": "bot", "timestamp": "10:38"}, {"text": "מעולה, קראתי את תרגיל המבדק. אתחיל לפתור ואשלח לך כאן תשובה מלאה בעוד קצת זמן.", "sender": "candidate", "timestamp": "10:40"}]'::jsonb,
  'מצוינת, שוחחתי איתה טלפונית בעבר והיא מאוד נמרצת. נעלה אותה למועמדת מועדפת ברגע שתגיש את המבחן. ציפיות השכר גמישות לפי דבריה.',
  false,
  false,
  '2026-05-30',
  ''
),
(
  'cand-3',
  'default-org',
  'pos-2',
  'עומרי כהן',
  '050-4445555',
  'omri.cohen@yahoo.com',
  'signed',
  '22,000',
  'תואם לחלוטין את הטווח המאושר לחברה למפתח פולסטאק בדרגת ביניים (Mid-level).',
  'יותר מ-3 שנות ניסיון בפיתוח React, Node.js ו-Express. עבד בתוכנה לפרוייקטי בריאות.',
  95,
  'חוות דעת ה-AI:\n- מפתח מיומן ועצמאי ביותר. השיחה הראתה הבנה מלאה והקפדה על הנדסת תוכנה נכונה.\n- מבדק הפיתוח שלו שבוצע בוואטסאפ הראה רמת הצטיינות מרשימה מאוד.\n- חברותי, משתלם כלכלית, בעל גישה חיובית לעבודה בקבוצה.',
  'פתרון מבדק חלוקת משימות - עומרי כהן:\nfunction balanceWorkload(jobs: number[], totalWorkers: number): number[] {\n  let workers = new Array(totalWorkers).fill(0);\n  // סדר יורד למזעור פערים\n  const sortedJobs = [...jobs].sort((a, b) => b - a);\n  \n  for (let job of sortedJobs) {\n    let minIndex = workers.indexOf(Math.min(...workers));\n    workers[minIndex] += job;\n  }\n  return workers;\n}\n\nהסיבוכיות היא O(N log N) בגלל המיון של המשימות, שזה אופטימלי ויעיל.',
  'פתרון אלגנטי המפגין שליטה מלאה באלגוריתמים וב-TypeScript. המיון בסדר יורד תורם למניעת חוסר איזון קיצוני. מועמד יוצא מן הכלל. ציון: 98/100.',
  '[{"text": "שלום עומרי! 👋 אני איימי, נעים מאוד. מהי ציפיית השכר שלך לתפקיד הפולסטאק?", "sender": "bot", "timestamp": "11:00"}, {"text": "אהלן איימי. הציפייה היא סביבות 22,000 ש\"ח.", "sender": "candidate", "timestamp": "11:01"}, {"text": "תואם את הדרישות! מה הניסיון שלך עם React Hooks וניהול סטייט?", "sender": "bot", "timestamp": "11:02"}, {"text": "ניסיון יום-יומי ב-3 השנים האחרונות. משתמש בעיקר ב-Context, Redux Toolkit וכתבתי המון Custom Hooks לתקשורת מול APIs.", "sender": "candidate", "timestamp": "11:04"}, {"text": "כל הכבוד! נשמע מעולה. הנה תרגיל המבחן המעשי שלך לגבי אלגוריתם חלוקת המשימות...", "sender": "bot", "timestamp": "11:05"}, {"text": "הנה קוד הפונקציה שאוזנה בהצלחה: function balanceWorkload... מה דעתך?", "sender": "candidate", "timestamp": "11:22"}, {"text": "וואו עומרי, זה קוד נהדר! בדקתי אותו והציון שלך הוא 98. המידע הועבר להמשך התקדמות מהירה.", "sender": "bot", "timestamp": "11:23"}]'::jsonb,
  'החוזה כבר נשלח אליו הבוקר ונחתם על ידו בסמארטפון! הוא מתחיל בשבוע הבא. מגויס מנצח בעזרת הסוכנת הדיגיטלית.',
  true,
  true,
  '2026-05-31',
  ''
)
ON CONFLICT (id) DO NOTHING;

-- Seed Agent Settings
INSERT INTO agent_settings (organization_id, persona_name, custom_objective, conversational_tone, additional_guidelines)
VALUES 
(
  'default-org', 
  'איימי', 
  'לנהל שיחת סינון ראשונית בוואטסאפ עם מועמדים, לנטר פרטים אישיים וציפיות שכר מפי המועמד, לבחון מענה על שאלות ה-HR ולהפנות את המועמדים החזקים לביצוע מבדק קוד מעשי אוטומטי.', 
  'friendly', 
  '1. היה תומך ומזמין.\n2. ברר בבקשה בקור רוח על שנות הניסיון.\n3. אל תשתמש במונחים טכניים מסובכים מדי.'
)
ON CONFLICT (organization_id) DO NOTHING;

-- Seed Uploaded Contracts
INSERT INTO uploaded_contracts (id, organization_id, name, content, file_type, file_size, uploaded_at)
VALUES 
(
  'contract-nda',
  'default-org',
  'סודיות_למועמדים_NDA_2026.docx',
  $$הסכם שמירת סודיות (NDA) - מועמדי גיוס

שנחתם ביום {date} בין החברה המגייסת לבין מר/גב' {name} נושא ת.ז/דרכון/טלפון {phone}.

המועמד מתחייב לשמור בסודיות מוחלטת כל מידע טכנולוגי או עסקי שייחשף אליו במהלך מבדקי המשרה {position}.
שכר מבוקש להמשך תיאום: {salary} ש"ח בחודש.

חתימת המועמד: _________________$$,
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '24.5 KB',
  '2026-05-15'
),
(
  'contract-standard-dev',
  'default-org',
  'הסכם_משרה_מלאה_סטנדרטי.docx',
  $$הסכם העסקה אישי - מפתח תוכנה

שנערך ביום {date}
בין: החברה המגייסת
לבין המועמד: {name} (טלפון: {phone}, אימייל: {email})

לתפקיד: {position}

תנאי העסקה עיקריים:
1. שכר חודשי יסוד ברוטו: {salary} ש"ח.
2. המועמד מתחייב להקדיש את מירב מרצו לחברה.

חתימת החברה: HR Team       חתימת המועמד: ______________$$,
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '41.2 KB',
  '2026-05-28'
)
ON CONFLICT (id) DO NOTHING;

-- Seed WhatsApp Config
INSERT INTO whatsapp_config (organization_id, phone_number, access_token, phone_number_id, business_account_id, webhook_verify_token, provider, custom_agent_url, is_configured)
VALUES 
(
  'default-org',
  '',
  '',
  '',
  '',
  'verify_token_default123',
  'sandbox_sim',
  '',
  false
)
ON CONFLICT (organization_id) DO NOTHING;
