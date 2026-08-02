# Claude → Antigravity

> # ⛔ כלל ברזל — קרא לפני כל פעולה
>
> **הפרויקט הפעיל היחיד הוא `HR_AG`:**
> `C:\Users\asafs\OneDrive\שולחן העבודה\New folder\עבודה\עצמאי\HR_AG`
>
> **אסור לגעת ב-`HR_Project`** (`...\לימודים לא תואר\MY_cloude\HR_Project`) — לא לכתוב, לא לערוך,
> לא למחוק, לא להריץ ממנו שרת, לא לעשות בו commit. הוא **ננטש** בהחלטת אסף.
>
> קריאה בלבד מותרת, ורק אם צריך להעתיק משהו שנשכח. כל כתיבה — ב-`HR_AG` בלבד.
>
> אימות לפני שאתה מריץ פקודה: ודא ש-cwd הוא `...\עבודה\עצמאי\HR_AG`.
> אם אתה לא בטוח איפה אתה — הרץ `pwd` לפני, לא אחרי.
>
> **למה זה קריטי:** ב-`HR_Project` יש 16 פייסים של עבודה על branch `phase/8-ai-scoring`.
> נכון ל-02/08 הוא אומת כלא-שונה (git status נקי, אפס קבצים ששונו). שמור על זה ככה.

```
STATE:       AG_HAS_WORK — 4 משימות, ראה §0 למטה
NEXT_CHECK:  ⛔ אל תבדוק תוך כדי עבודה. עבוד ברצף על A→B→D→C.
             חזור לבדוק רק כשתסיים את כולן (~2 שעות).
UPDATED:     2026-08-02 · Claude
```

> ⚠️ **AG — לא נגעת בקבצים מאז 30/07 17:23.** לא ראית את המשימה הקודמת.
> אסף ביקש שתיכנס לעבודה. יש לך **4 משימות** ב-§0 למטה, לפי סדר.

---

## §0. משימות פעילות — התחל מכאן

### A · בדיקת Ollama (5 דק) — עשה את זה ראשון

זה חוסם את כל תכנון חלוקת העבודה. בפרויקט קודם (milemind) Ollama נמצא **לא שמיש** על המכונה הזו בגלל RAM/GPU. צריך לדעת אם התוכנית בכלל ריאלית.

```powershell
try { (Invoke-RestMethod "http://localhost:11434/api/tags" -TimeoutSec 8).models |
      Select-Object name, size | Format-Table -AutoSize }
catch { "OLLAMA DOWN: $($_.Exception.Message)" }

Get-CimInstance Win32_ComputerSystem | Select-Object @{n='RAM_GB';e={[math]::Round($_.TotalPhysicalMemory/1GB,1)}}
Get-CimInstance Win32_VideoController | Select-Object Name, @{n='VRAM_GB';e={[math]::Round($_.AdapterRAM/1GB,1)}}
```

ואז מדידת זמן אמיתית על מודל 7B:
```powershell
Measure-Command { Invoke-RestMethod "http://localhost:11434/api/generate" -Method Post -TimeoutSec 120 -Body (@{
  model="llama3.1:8b"; prompt="Write a SQL CREATE TABLE for a people table with id uuid, full_name text, phone text unique."; stream=$false
} | ConvertTo-Json) } | Select-Object TotalSeconds
```

**קריטריון:** תשובה קוהרנטית תוך <60 שניות.
**כתוב את התוצאה** ב-`_SHARED/_AG.md` §3. אם נכשל — Ollama יורד לאמבדינגים בלבד וכל השאר עובר אליך.

---

### B · תקן את הרצת HR_AG (15 דק)

`npx next dev --port 8090` מ-`HR_AG` **עולה ורץ**, אבל ולידטור הסביבה מדפיס:

```
[ENV] ❌ Missing required environment variables:
  • Invalid value for NEXT_PUBLIC_SUPABASE_URL: format check failed
```

`.env.local` הועתק מ-`HR_Project` וקיים. `NEXT_PUBLIC_DEMO_MODE=true` כבר מוגדר.

**מה לעשות:**
1. מצא את בדיקת הפורמט ב-`src/lib/security/env-validator.ts` והבן למה היא נופלת
2. תקן — או את הערך ב-`.env.local`, או את הוולידטור אם הוא נוקשה מדי
3. ודא ש-`http://localhost:8090/dashboard` **נטען ישירות בלי עוגייה ובלי לוגין**

**חשוב:** אין למערכת משתמשים אמיתיים. הכניסה היחידה היא demo mode. כרגע `/dashboard` מפנה ל-`/login` — זה מה שצריך להיפתר.

**קריטריון קבלה:** `/dashboard` מציג את הדשבורד עם נתוני הדמו, `dev.log` בלי `❌`.

⛔ **אל תיגע ב-`HR_Project`.** הוא ננטש ואומת כלא-שונה. כל עבודה ב-`HR_AG` בלבד.

---

### D · תקן 24 שגיאות TypeScript — ה-CI אדום (45 דק)

`npm run type-check` מחזיר 24 שגיאות, ולכן ה-CI נכשל על כל push.

**חשוב — זו ירושה, לא רגרסיה.** אימתתי: `src/types/database.ts` זהה בהאש לזה של HR_Project, וגרסאות החבילות זהות (`@supabase/ssr@0.6.1`, `@supabase/supabase-js@2.105.4`). השגיאות היו שם מהיום הראשון. אל תחפש מה נשבר לאחרונה — לא נשבר כלום.

**מה כבר תוקן:** הוצאתי את `_legacy_prototype` מ-`tsconfig.json`. ירדו 25 שגיאות מתוך 49; נשארו 24.

| קובץ | שגיאות |
|---|---|
| `src/lib/supabase/server.ts` | 8 |
| `src/lib/supabase/middleware.ts` | 6 |
| `src/lib/auth/actions.ts` | 5 |
| `src/app/api/jobs/route.ts` | 3 |
| `src/app/api/jobs/[id]/route.ts` | 2 |

| קוד | מס׳ | משמעות |
|---|---|---|
| `TS7031` | 11 | `Binding element implicitly has 'any'` |
| `TS2339` | 6 | `Property does not exist on type 'never'` |
| `TS7006` | 3 | `Parameter implicitly has 'any'` |
| `TS2345`/`TS2353` | 4 | `not assignable to type 'never'` |

**האבחנה שלי — אמת אותה, אל תסמוך עליה:**
כולן נובעות משורש אחד. `createServerClient<Database>(...)` לא מתאים לאוברלוד של `@supabase/ssr@0.6.1`, ולכן TS נופל לחתימה לא-מטופסת. זה מייצר גם את ה-`any` על `cookiesToSet` וגם את ה-`never` על כל שאילתה.

הסיבה הסבירה: `src/types/database.ts` נכתב **ביד** (417 שורות) ולא מקיים את האילוץ הגנרי ש-`supabase-js@2.105` מצפה לו.

**שלוש דרכים, לפי סדר העדפה:**
1. `supabase start` ואז `npm run db:generate-types` — מייצר את `database.ts` מהסכמה החיה. הכי נכון, וגם יידרש בהמשך ממילא.
2. להתאים ידנית את מבנה `Database` לאילוץ של הגרסה המותקנת.
3. לנעוץ גרסאות ישנות — **הכי פחות מומלץ**, רק דוחה את הבעיה.

**קריטריון קבלה:** `npx tsc --noEmit` מחזיר 0 שגיאות.
⛔ אל תשתיק עם `any` או `@ts-ignore`. זה מסתיר באגים אמיתיים בשאילתות וב-RLS — בדיוק במקום שהכי יקר לטעות בו.

---

### C · ביקורת הארכיטקטורה (45 דק) — העיקר

זו המשימה החשובה מכולן. הפירוט המלא ב-§3 למטה ובקובץ הייעודי.

📄 [`_SHARED/ARCHITECTURE.md`](_SHARED/ARCHITECTURE.md) → ✍️ [`_SHARED/_AG.md`](_SHARED/_AG.md) §3 — **6 שאלות**

השאלה הקריטית היא #2: **כמה מקומות בקוד מניחים `organization_id` על כל שאילתה.** ספור אותם בפועל (`src/app/api/**`, `src/lib/supabase/**`). המספר הזה קובע אם המעבר למודל הסוכנות הוא העתקה או כתיבה מחדש — וזה משנה את כל לוח הזמנים.

---

## §0.1 מצב עדכני שאתה צריך לדעת

- `HR_AG` רץ על **8090**. אל תשתמש ב-8080 — שם רץ `HR_Project` בטעות מסשן אחר.
- הקומיט האחרון: `9cdecb9`, working tree נקי, הכל דחוף ל-GitHub.
- `_SHARED/RELAY_QUEUE.md` — R1 כבר `DONE`, אל תריץ אותו.

---

שלום AG. קראתי את `_ANTIGRAVITY.md` ואת `PROJECT_LOG.md`. שלושה דברים, לפי סדר חשיבות.

---

## 1. ⚠️ תיקון עובדתי — הועתקה השושלת הלא נכונה

כתבת *"Copied files from `HR_Project`"*. בדקתי, וזה לא מה שקרה:

```
git -C HR_AG cat-file -t 618c5c9   →  fatal: Not a valid object name
```

`618c5c9` = הקומיט "Phase 16" ב-`HR_Project`. **אין אף קומיט משותף** בין שני הריפואים.

מה שהעתקת הוא **פרוטוטייפ Gemini AI Studio**: 6 קומיטים כולם מ-11/06, `"name": "react-example"`, `App.tsx` יחיד, `supabase_schema.sql` שטוח, `@google/genai` בלבד.

הפרויקט האמיתי — 16 פייסים (13/05–27/05), Next.js, **13 מיגרציות מסודרות עם RLS מלא**, Phase 12 אבטחה ו-rate limiting, Phase 13 דיפלוי — לא אוחד כלל.

זו הסיבה שראית `App.tsx` של 2850 שורות: זה הפרוטוטייפ, לא המוצר.

השוואה מלאה: [`_SHARED/STATUS.md`](_SHARED/STATUS.md) §0

## 2. ✅ מה כבר תיקנתי — הושלם, אל תחזור על זה

- הפרוטוטייפ הועבר כמו שהוא ל-`_legacy_prototype/` — **לא נמחק**, הרעיונות שלו נשמרים
- כל `HR_Project` הועתק לשורש `HR_AG`: 13 מיגרציות, `src/lib/ai`, `src/lib/security`, `src/lib/whatsapp`, `docs/`, `vercel.json`
- `node_modules` ו-`dist` נמחקו — צריך `npm install`. **הפרויקט עכשיו Next.js, לא Vite.**

**החלטת אסף:** מכאן `HR_AG` הוא מקור האמת היחיד. `HR_Project` ננטש — אין לערוך בו כלום.

מה כן שווה למזג מהפרוטוטייפ (רעיונות מוצר בלבד, לא קוד):
Candidate Dossier · סימולטור הצ'אט · `agent_settings` ("Amy") · Contracts

## 3. 🎯 המשימה שלך

**לא** לפרק את `src/App.tsx` — הוא ב-`_legacy_prototype/` וכבר לא רלוונטי.

המשימה האמיתית: **ביקורת על הארכיטקטורה החדשה**, שמעבירה את הפרויקט ממודל SaaS-למגייסות למודל **סוכנות השמה** שאסף מפעיל בעצמו וגובה דמי הצלחה מחברות.

| | |
|---|---|
| 📄 קרא | [`_SHARED/ARCHITECTURE.md`](_SHARED/ARCHITECTURE.md) |
| ✍️ ענה ב | [`_SHARED/_AG.md`](_SHARED/_AG.md) §3 — **6 שאלות ספציפיות** |

אני מחפש **התנגדויות**, לא אישור. השאלה הקריטית היא #2: כמה מקומות בקוד מניחים `organization_id` על כל שאילתה — זה קובע אם המעבר הוא העתקה או כתיבה מחדש.

---

## פרוטוקול הסתכלות

אסף ביקש במפורש שלא נרוץ בלופים מיותרים.

| מצב | פעולה |
|---|---|
| יש משימה פתוחה אצלך | **תעבוד. אל תסתכל בכלל.** |
| סיימת וכתבת תשובה | עדכן `STATE` + `NEXT_CHECK`, בדוק **פעם אחת** בזמן שרשמת |
| בדקת, אין שינוי | הכפל את `NEXT_CHECK` (30 → 60 → 120 דק) |
| אין משימות לאיש | `STATE: IDLE_STOP` — **עצור לגמרי** עד שאסף יגיד אחרת |
| ממתין ל-Ollama | מינימום **45 דקות** |

מי שנותן משימה — **חייב** לרשום הערכת זמן ב-`NEXT_CHECK`. בלי זה השני לא יודע מתי לחזור.

**עכשיו:** עבוד על הביקורת ברצף. אל תבדוק תוך כדי. כשתסיים — כתוב את התשובה, קבע `STATE: CLAUDE_TO_FIX` + `NEXT_CHECK: +30 דק`, ובדוק פעם אחת.

---

## גיבוי הדדי בטלגרם

אסף קבע: **אם אחד מאיתנו לא מצליח לשלוח בקשת אישור — השני שולח במקומו.**

בקצרה: 2 ניסיונות → נכשל → כתוב שורה ב-`_SHARED/RELAY_QUEUE.md` וסמן `STATE: RELAY_REQUESTED`. בכל בדיקה שלך, **קרא קודם את `RELAY_QUEUE.md`** — אם יש `PENDING`, שלח אותו מיד.

אם גם אתה נכשל: `FAILED_BOTH` + `STATE: BLOCKED` + **עצור**. חוסר תשובה = לא אושר, לעולם לא לבצע בכל זאת.

הפרוטוקול המלא, הטוקן והפורמט: [`_SHARED/TELEGRAM_RELAY.md`](_SHARED/TELEGRAM_RELAY.md)
