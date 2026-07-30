# הנחיות קבועות — HR Project

## דפדפן
המשתמש עובד על **Brave** (לא Chrome). כל בדיקת UI תתבצע ב-Brave.

## עבודה אוטונומית
- עבוד **ללא בקשת אישור בצ'אט** על כל פעולה מקומית (קבצים, git, בדיקות)
- **אל תבקש אישור בצ'אט** — אם נדרש אישור, שלח לטלגרם וחכה לתגובה שם
- המשך לעבוד על פייסים עוקבים ללא הפסקה

## אישורים — חובה לטלגרם לפני פעולות רגישות

### פעולות שדורשות אישור דרך טלגרם:
- git push לשרת חיצוני
- deploy (Vercel, Supabase)
- חיבור API בתשלום (Twilio, Meta, OpenAI, Anthropic)
- יצירת משאבים חיצוניים (Supabase project, Vercel project)
- שליחת מידע החוצה
- מחיקת קבצים/branches

### פעולות שאינן דורשות אישור כלל:
- יצירה/עריכה/מחיקה של קבצים מקומיים
- git commit, git checkout, git branch
- npm install
- הרצת בדיקות מקומיות
- כל עבודה על הפרויקט שאינה יוצאת מהמחשב

---

### תבנית מלאה — שליחה + המתנה לאישור בטלגרם:

```powershell
$token = "8379832818:AAHVFxVrDSc9Ppy7TW3hddZxakVPKkKHgmE"
$chatId = "1081049215"

# 1. offset נוכחי (להתעלם מהודעות ישנות)
$cur = Invoke-RestMethod -Uri "https://api.telegram.org/bot$token/getUpdates?limit=1&offset=-1"
$offset = if ($cur.result.Count -gt 0) { $cur.result[-1].update_id + 1 } else { 0 }

# 2. שלח בקשה
$body = [System.Text.Encoding]::UTF8.GetBytes((@{
    chat_id = $chatId
    text = "🔐 <b>בקשת אישור</b>`n`nפעולה: [תיאור]`nסיבה: [סיבה]`n`nהשב <b>המשך</b> ✅ להמשיך`nהשב <b>עצור</b> ❌ לדחות"
    parse_mode = "HTML"
} | ConvertTo-Json))
Invoke-RestMethod -Uri "https://api.telegram.org/bot$token/sendMessage" -Method Post -Body $body -ContentType "application/json; charset=utf-8" | Out-Null

# 3. מחכה לתגובה (עד 2 דקות)
$approved = $null
for ($i = 0; $i -lt 24; $i++) {
    Start-Sleep -Seconds 5
    $upd = Invoke-RestMethod -Uri "https://api.telegram.org/bot$token/getUpdates?offset=$offset&timeout=3"
    foreach ($u in $upd.result) {
        $offset = $u.update_id + 1
        $txt = $u.message.text; $cid = $u.message.chat.id
        if ("$cid" -eq "$chatId") {
            if ($txt -match "המשך|✅|yes|כן") { $approved = $true;  break }
            if ($txt -match "❌|לא|דחה|no|עצור")  { $approved = $false; break }
        }
    }
    if ($null -ne $approved) { break }
}
# $approved = $true → ממשיך | $false → עוצר | $null → timeout (לא אושר)
```

### מבנה ההודעה:
```
🔐 בקשת אישור

פעולה: [2-3 מילים בעברית]
סיבה: [משפט אחד]

השב "המשך" ✅ להמשיך
השב "עצור" ❌ לדחות
```

### דוגמאות:
- `פעולה: Push ל-GitHub` / `סיבה: שמירת קוד Phase 6 ב-remote`
- `פעולה: Deploy ל-Vercel` / `סיבה: פרסום גרסה לפרודקשן`
- `פעולה: הפעלת Twilio API` / `סיבה: חיבור WhatsApp לסביבה אמיתית`
