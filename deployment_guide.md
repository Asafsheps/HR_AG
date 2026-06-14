# מדריך פריסה לענן – העלאת המערכת לאוויר (Live Deployment)

מדריך זה מסביר כיצד להעלות את מערכת הגיוס **Amy AI HR Match** לאוויר (Cloud Hosting) כדי שלקוחות וחברות שונות יוכלו להתנסות בה ולהשתמש בה מרחוק.

---

## 🚀 אפשרות א': פריסה מהירה ב-Render.com (מומלץ)

[Render](https://render.com) היא פלטפורמת ענן מצוינת המאפשרת לארח שרתי Node.js (Vite + Express) בחינם או בעלות נמוכה מאוד, ישירות מתוך מאגר ה-GitHub שלך.

### שלבי הפריסה:
1. **העלאת הקוד ל-GitHub**:
   - צור מאגר (Repository) חדש ב-GitHub (למשל פרטי או ציבורי).
   - דחוף (Push) את קוד הפרויקט הנוכחי לתוך המאגר.

2. **הרשמה ויצירת שירות ב-Render**:
   - היכנס ל-[Render.com](https://render.com) והתחבר באמצעות חשבון ה-GitHub שלך.
   - בלוח הבקרה, לחץ על **New +** ובחר **Web Service**.
   - קשר את מאגר ה-GitHub של הפרויקט.

3. **הגדרת השירות (Settings)**:
   - **Name**: `amy-ai-hr` (או כל שם אחר לבחירתך).
   - **Environment**: `Node`.
   - **Build Command**: `npm install && npm run build` (הפקודה בונה את צד הלקוח של Vite ומכינה אותו להגשה מהשרת).
   - **Start Command**: `npm run start` או `npx tsx server.ts` (מריץ את שרת ה-Express המאובטח בייצור).

4. **הגדרת משתני סביבה (Environment Variables)**:
   תחת הלשונית **Env Groups** או **Environment** בשירות שנוצר, הוסף את המשתנים הבאים (מתוך קובץ ה-`.env` שלך):
   - `GEMINI_API_KEY`: מפתח ה-API של Google Gemini לעבודה עם ה-AI.
   - `SUPABASE_URL`: כתובת ה-API של פרויקט ה-Supabase שלך.
   - `SUPABASE_ANON_KEY`: מפתח ה-Anon של פרויקט ה-Supabase שלך.
   - `NODE_ENV`: `production` (זה יבטיח שהשרת יגיש את הקבצים המקומפלים בצורה יעילה).

5. **הפעלה**:
   - Render תבנה את האפליקציה ותספק לך כתובת אינטרנט ציבורית מאובטחת (למשל: `https://amy-ai-hr.onrender.com`).

---

## ⚡ אפשרות ב': פריסה ב-Railway.app (מהיר ומקצועי)

[Railway](https://railway.app) היא פלטפורמה קלה במיוחד המזהה אוטומטית שרתי Node.js ומריצה אותם בתוך שניות.

### שלבי הפריסה:
1. התחבר ל-[Railway.app](https://railway.app) עם חשבון ה-GitHub שלך.
2. לחץ על **New Project** -> **Deploy from GitHub repo**.
3. בחר את מאגר ה-GitHub של הפרויקט.
4. תחת הגדרות הפרויקט (**Variables**), לחץ על **Raw Editor** והעתק את כל התוכן של קובץ ה-`.env` שלך (כולל מפתחות ה-API והחיבור ל-Supabase).
5. המערכת תזהה את ה-`package.json`, תריץ את הבנייה ותעלה את האפליקציה לאוויר. היא תספק לך כתובת ייחודית (למשל `https://hr-crm-production.up.railway.app`).

---

## 🔐 אבטחה וניהול לקוחות מרובים (SaaS Multi-Tenancy)

לשם מכירת שימוש במערכת למגייסים מחברות שונות, הארכיטקטורה הנוכחית של המערכת תומכת בחיבורים מאובטחים:
1. **בידוד מפתחות (Private Keys)**: מפתחות ה-Supabase וה-Gemini אינם נחשפים לעולם בדפדפן הלקוח – הם נשמרים רק בשרת ה-Backend (ה-BFF).
2. **אימות משתמשים**: כל מגייס מזדהה באמצעות מייל וסיסמה.
3. **הפרדת נתונים מרובת-לקוחות (Multi-Tenant Row Level Security)**:
   - ב-Supabase, תוכל להוסיף שדה `tenant_id` או `company_id` בטבלאות `candidates` ו-`positions`.
   - תוכל להגדיר חוקי RLS (Row Level Security) ב-PostgreSQL שיבטיחו שכל מגייס מחובר רואה אך ורק את המשרות והמועמדים השייכים לחברה שלו (מבוסס על ה-JWT שלו).
