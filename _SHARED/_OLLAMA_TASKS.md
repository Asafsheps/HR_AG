# משימות ל-Ollama (מודל מקומי, חינם)

```
STATE:       BLOCKED — ממתין לביקורת AG על ARCHITECTURE.md
NEXT_CHECK:  אל תתחיל לפני ש-B0 עבר
UPDATED:     2026-07-30 · Claude
```

---

## עקרונות כתיבת משימה למודל מקומי

מודל מקומי חלש בהרבה מ-Claude/Gemini. משימה שנכשלת אצלו היא כמעט תמיד משימה שנוסחה רע. לכן:

- **משימה אחת = קובץ אחד.** לא "תבנה את מודול הכסף".
- **תמיד לתת את הסכמה המדויקת** בגוף המשימה. לא להפנות ל"קרא את ARCHITECTURE.md".
- **קלט ופלט מוגדרים לחלוטין** — שם קובץ, שמות עמודות, טיפוסים.
- **בלי החלטות ארכיטקטוניות.** אם המשימה דורשת שיקול דעת — היא לא של Ollama.
- **קריטריון קבלה בדיד** שאפשר להריץ (`npx tsc --noEmit`, `supabase db reset`).

---

## B0 — בדיקת היתכנות (חובה לפני הכל)

⚠️ בפרויקט קודם (milemind) נמצא ש-Ollama מקומי **לא שמיש** על המכונה הזו — מגבלות RAM/GPU. חייבים לאמת לפני שבונים על זה תוכנית עבודה.

```powershell
# 1. השירות חי?
try { (Invoke-RestMethod "http://localhost:11434/api/tags" -TimeoutSec 8).models |
      Select-Object name, size | Format-Table -AutoSize }
catch { "OLLAMA DOWN: $($_.Exception.Message)" }

# 2. חומרה
Get-CimInstance Win32_ComputerSystem | Select-Object @{n='RAM_GB';e={[math]::Round($_.TotalPhysicalMemory/1GB,1)}}
Get-CimInstance Win32_VideoController | Select-Object Name, @{n='VRAM_GB';e={[math]::Round($_.AdapterRAM/1GB,1)}}
```

**קריטריון מעבר:** מודל 7B מחזיר תשובה קוהרנטית תוך <60 שניות.

| תוצאה | מסקנה |
|---|---|
| עבר | ממשיכים לפי התוכנית |
| נכשל | Ollama מוגבל ל-**אמבדינגים בלבד** (T7) — כל השאר עובר ל-AG |

**מי מריץ:** AG, כחלק מהביקורת. תוצאה נרשמת ב-`_AG.md`.

---

## תור המשימות

חסום עד לסיום הביקורת. הסכמה עשויה להשתנות בעקבותיה — אין טעם לבנות על טיוטה.

| # | משימה | קובץ יעד | תלוי ב־ | הערכה |
|---|---|---|---|---|
| T1 | מיגרציה: טבלת `people` | `supabase/migrations/..._people.sql` | ביקורת | 30 דק |
| T2 | סקריפט backfill: `candidates` → `people` + דדופ גלובלי | `scripts/backfill_people.ts` | T1 | 60 דק |
| T3 | מיגרציה: `client_companies`, `client_users` | `..._clients.sql` | ביקורת | 30 דק |
| T4 | מיגרציה: `client_jobs` | `..._client_jobs.sql` | T3 | 30 דק |
| T5 | מיגרציה: `consents` | `..._consents.sql` | T1 | 20 דק |
| T6 | טיפוסי TS לכל הטבלאות החדשות | `src/types/db.ts` | T1–T5 | 40 דק |
| T7 | חישוב אמבדינגים ל-CV (מקומי, זול) | `src/lib/ai/embeddings.ts` | B0 | 60 דק |
| T8 | שלב ① בהתאמה — סינון SQL + pgvector | `src/lib/matching/recall.ts` | T7 | 90 דק |

### ❌ לא ל-Ollama — בשום מקרה

| נושא | למה |
|---|---|
| `submissions` + חלון בעלות | באג = אובדן עמלה אמיתית |
| RLS (צוות מול לקוח) | באג = דליפת מידע בין לקוחות |
| הסתרת PII בפורטל | באג = עוקפים אותך, אין הכנסה |
| `fee_agreements` / `placements` / `invoices` | חישוב כספי |

אלה נכתבים ע"י **Claude** בלבד. ראה [`ARCHITECTURE.md`](ARCHITECTURE.md) §10.

---

## תבנית משימה

````markdown
### T<N> — <כותרת>

**קובץ:** <נתיב מדויק ויחיד>
**אסור לגעת בשום קובץ אחר.**

**רקע (הכל כאן, אל תחפש במקום אחר):**
<הסכמה המדויקת, שמות עמודות, טיפוסים>

**מה לעשות:**
1. <צעד אטומי>
2. <צעד אטומי>

**קריטריון קבלה:**
```
<פקודה שרצה ועוברת>
```

**אם משהו לא ברור — עצור וכתוב שאלה ב-`_OLLAMA_QUESTIONS.md`. אל תנחש.**
````

השורה האחרונה קריטית: מודל מקומי שמנחש מייצר קוד שנראה תקין ועובד לא נכון — וזה יקר יותר מלשאול.
