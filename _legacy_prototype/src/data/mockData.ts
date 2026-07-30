/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Position, Candidate } from '../types.ts';

export const INITIAL_POSITIONS: Position[] = [
  {
    id: "pos-1",
    title: "אנליסט נתונים בכיר (Senior Data Analyst)",
    experienceYears: 5,
    requirements: [
      "כתיבה ושליטה מוחלטת בשאילתות SQL מורכבות (Window Functions, CTEs)",
      "ניסיון בפיתוח דשבורדים מורכבים ב-Tableau או Power BI",
      "ניסיון בניתוח נתונים ב-Python / Pandas וסטטיסטיקה יישומית",
      "רקע בעבודה צמודה מול צוותי מוצר ופיתוח עסקי"
    ],
    questions: [
      "ספר על פרויקט דאטה מורכב שפיתחת וכיצד הוא השפיע על ההחלטות העסקיות בחברה.",
      "מהי המומחיות שלך בכתיבת שאילתות SQL מורכבות, ואיך אתה מייעל שאילתה איטית?",
      "איך אתה מתמודד עם נתונים חסרים או לא עקביים במקורות המידע השונים?"
    ],
    testPrompt: "כתוב שאילתת SQL שתחשב ממוצע נע של 7 ימים של סך המכירות לכל קטגוריית מוצר, והסבר כיצד תייעל את השאילתה מול מיליארדי שורות.",
    contractTemplate: `הסכם העסקה אישי - משרת אנליסט נתונים בכיר

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

החברה: _________________             העובד: _________________`,
    isActive: true,
    createdAt: "2026-05-10"
  },
  {
    id: "pos-2",
    title: "מפתח Fullstack - React & Node.js",
    experienceYears: 3,
    requirements: [
      "ניסיון בפיתוח אפליקציות SPA מתקדמות ב-React, TypeScript ו-Tailwind",
      "ניסיון קודם בפיתוח שרתי REST/GraphQL ב-Node.js / Express",
      "הבנה במסדי נתונים מבוססי SQL ו-NoSQL",
      "יכולת עבודה עצמאית והובלת משימות משלב האפיון עד הפרודקשן"
    ],
    questions: [
      "מה הניסיון שלך עם React Hooks וניהול סטייט מורכב?",
      "תאר ארכיטקטורה של API מאובטח ויעיל שבנית בעבר ב-Node.js.",
      "איך אתה פותר בעיות ביצועים או קריסה של שרת בגלל עומס?"
    ],
    testPrompt: "כתוב פונקציית TypeScript שמבצעת חלוקת משימות אופטימלית בין עובדים (Scheduling Algorithm) תוך שמירה על עומס מאוזן, והסבר את הסיבוכיות של הפתרון שלך.",
    contractTemplate: `הסכם העסקה אישי - מפתח Fullstack React & Node.js

שנערך ונחתם ביום {date}
בין: חברת קוד-מאסטرز טכנולוגיות (להלן: "החברה")
לבין: {name}, ת.ז. {phone} (להלן: "העובד")

1. תיאור התפקיד:
העובד יועסק כמפתח Fullstack בקוד-מאסטرز ויהיה אחראי על פיתוח צד לקוח וצד שרת.

2. תקופת ההסכם ותנאים:
השכר יעמוד על {salary} ש"ח לחודש ברוטו.
היקף משרה: משרה מלאה, 5 ימים בשבוע.

3. חתימות:
החברה: _________________             העובד: _________________`,
    isActive: true,
    createdAt: "2026-05-15"
  }
];

export const INITIAL_CANDIDATES: Candidate[] = [
  {
    id: "cand-1",
    positionId: "pos-1",
    name: "ברק אברהם",
    phone: "054-1234567",
    email: "barak.av@gmail.com",
    status: "completed",
    requestedSalary: "24,000",
    salaryFitAnalysis: "ציפיית השכר תואמת בצורה מושלמת את התקציב שהוגדר על ידי המחלקה ורמת מחירי השוק לתפקיד Senior עם 5 שנות ניסיון.",
    experienceSummary: "5 שנים כאנליסט נתונים עסקי בחברת פינטק, ניסיון מעולה ב-SQL, פיתח דשבורדים עסקיים מורכבים ב-Tableau.",
    score: 94,
    aiFitSummary: `חוות דעת ה-AI:
- ברק הוא מועמד בעל פוטנציאל גבוה במיוחד. ניכר שהוא שולט היטב ב-SQL, מבין לעומק דאטה פיננסי ורגיל לעבוד עם מנהלי מוצר.
- בעל מיומנויות תקשורת מעולות (התנסח בצורה סבלנית ומקצועית מאוד בשיחת הוואטסאפ).
- מוטיבציה גבוהה להשתלב בחברה. מומלץ להתקדם מהר לחתימת חוזה!`,
    testAnswers: `פתרון מבדק SQL - ברק אברהם:
SELECT product_category,
       sale_date,
       AVG(SUM(daily_sales)) OVER(
           PARTITION BY product_category 
           ORDER BY sale_date 
           RANGE BETWEEN INTERVAL '6 days' PRECEDING AND CURRENT ROW
       ) as moving_avg_sales
FROM product_sales
GROUP BY product_category, sale_date;

לגבי אופטימיזציה מול מיליארדי שורות - הייתי מייצר אינדקס (Indexes) על product_category ו-sale_date, מבצע קלאסטרינג לפי תאריך ומבצע חלוקה למחיצות (Partitioning) לפי קטגוריות.`,
    testFeedback: "פתרון מצוין של המבחן המעשי! השאילתה כתובה בצורה נכונה ומשתמשת ב-Window Functions בצורה מיטבית. שיטת האופטימיזציה שתיאר מראה הבנה עמוקה של בסיסי נתונים בקנה מידה גדול. ציון מבדק: 96/100.",
    chatTranscript: [
      { sender: "bot", text: "שלום ברק! 👋 אני איימי, סוכנת הגיוס של החברה. אשמח לשאול אותך כמה שאלות קצרות על משרת אנליסט נתונים בכיר. מוכן?", timestamp: "14:10" },
      { sender: "candidate", text: "היי איימי, בטח! אשמח מאוד.", timestamp: "14:11" },
      { sender: "bot", text: "שיגעון. מהן ציפיות השכר החודשיות שלך (ברוטו) למשרה זו?", timestamp: "14:12" },
      { sender: "candidate", text: "מצפה לאזור ה-24,000 ש\"ח בחודש פלוס-מינוס כתלות בתנאים הנלווים.", timestamp: "14:14" },
      { sender: "bot", text: "תודה. ספר לי על פרויקט דאטה מורכב שפיתחת וכיצד הוא השפיע על ההחלטות העסקיות.", timestamp: "14:15" },
      { sender: "candidate", text: "במקום העבודה הנוכחי שלי פיתחתי מודל לחיזוי נטישת לקוחות באמצעות Python ו-SQL, ועיצבתי דשבורד ב-Tableau עבור מנהלי המוצר. זה איפשר לנו לזהות סיכוני נטישה שבוע מראש והפחית את אחוז הנטישה ב-18%.", timestamp: "14:18" },
      { sender: "bot", text: "מדהים! זו תוצאה מעולה. כעת, נשמח להעביר אליך את המבדק המעשי: כתוב שאילתת SQL שתחשב ממוצע נע של 7 ימים...", timestamp: "14:20" },
      { sender: "candidate", text: "כמובן, הנה הפתרון שלי: SELECT product_category, sale_date, AVG(SUM(daily_sales)) OVER ...", timestamp: "14:35" },
      { sender: "bot", text: "תודה ברק! הפרטים שלך והמענה על המבחן הועברו ישירות ל-CRM של המגייסת. נהיה איתך בקשר מהיר מאוד!", timestamp: "14:36" }
    ],
    hrNotes: "התרשמתי מאוד מרקורד העבודה שלו. דיבר עם ה-AI בצורה מאוד בוגרת ומדויקת. המבחן שלו פשוט מושלם. יש לשלוח טיוטת חוזה מיידית.",
    contractSent: false,
    contractSigned: false,
    updatedAt: "2026-05-28"
  },
  {
    id: "cand-2",
    positionId: "pos-1",
    name: "שירה שגב",
    phone: "052-9876543",
    email: "shira.segev@outlook.com",
    status: "test",
    requestedSalary: "28,000",
    salaryFitAnalysis: "הציפייה לשכר מעט גבוהה מטווח התקציב המשוער למשרה (התקציב נע בין 21,000 ל-25,000 ש\"ח). נדרש משא ומתן או אישור חריג במידה ורמתה המקצועית תתברר כיוצאת דופן.",
    experienceSummary: "4 שנות ניסיון כאנליסטית מוצר בסטארטאפ קטן, שליטה גבוהה ב-Tableau ו-SQL.",
    score: 82,
    aiFitSummary: `חוות דעת ה-AI:
- שירה בעלת ניסיון מושך כאנליסטית מקצה לקצה. יש לה הבנה טובה של צרכי מוצר.
- ציפיות השכר שלה מעט גבוהות מהתקציב, אך בהחלט יש לה בסיס חזק.
- בשלב השיחה הפגינה כישורים אישיים מצוינים, שפה רהוטה וראש גדול לשיתופי פעולה.`,
    testAnswers: "",
    testFeedback: "שלחה הודעה שהיא עובדת ברגעים אלו על המבחן ותחזיר אותו בהקדם הצהריים.",
    chatTranscript: [
      { sender: "bot", text: "שלום שירה! 👋 אני איימי, סוכנת הגיוס הווירטואלית. נעים מאוד. מהי ציפיית השכר שלך?", timestamp: "10:30" },
      { sender: "candidate", text: "היי, הציפייה שלי היא 28 אלף שקלים בחודש.", timestamp: "10:31" },
      { sender: "bot", text: "מעולה. ספר לי על פרויקט דאטה מורכב שפיתחת וכיצד הוא השפיע.", timestamp: "10:32" },
      { sender: "candidate", text: "הובלתי הטמעת מערכת מדידה חדשה לאתר החברה שחיברה את נתוני הגולשים לתוך מחסן הנתונים של Snowflake. זה איפשר לזהות צווארי בקבוק ברישום משתמשים.", timestamp: "10:36" },
      { sender: "bot", text: "נשמע מרתק! נעבור למבחן ההתאמה המעשי... הנה השאלה לגבי ממוצע נע ב-SQL.", timestamp: "10:38" },
      { sender: "candidate", text: "מעולה, קראתי את תרגיל המבדק. אתחיל לפתור ואשלח לך כאן תשובה מלאה בעוד קצת זמן.", timestamp: "10:40" }
    ],
    hrNotes: "מצוינת, שוחחתי איתה טלפונית בעבר והיא מאוד נמרצת. נעלה אותה למועמדת מועדפת ברגע שתגיש את המבחן. ציפיות השכר גמישות לפי דבריה.",
    contractSent: false,
    contractSigned: false,
    updatedAt: "2026-05-30"
  },
  {
    id: "cand-3",
    positionId: "pos-2",
    name: "עומרי כהן",
    phone: "050-4445555",
    email: "omri.cohen@yahoo.com",
    status: "signed",
    requestedSalary: "22,000",
    salaryFitAnalysis: "תואם לחלוטין את הטווח המאושר לחברה למפתח פולסטאק בדרגת ביניים (Mid-level).",
    experienceSummary: "יותר מ-3 שנות ניסיון בפיתוח React, Node.js ו-Express. עבד בתוכנה לפרוייקטי בריאות.",
    score: 95,
    aiFitSummary: `חוות דעת ה-AI:
- מפתח מיומן ועצמאי ביותר. השיחה הראתה הבנה מלאה והקפדה על הנדסת תוכנה נכונה.
- מבדק הפיתוח שלו שבוצע בוואטסאפ הראה רמת הצטיינות מרשימה מאוד.
- חברותי, משתלם כלכלית, בעל גישה חיובית לעבודה בקבוצה.`,
    testAnswers: `פתרון מבדק חלוקת משימות - עומרי כהן:
function balanceWorkload(jobs: number[], totalWorkers: number): number[] {
  let workers = new Array(totalWorkers).fill(0);
  // סדר יורד למזעור פערים
  const sortedJobs = [...jobs].sort((a, b) => b - a);
  
  for (let job of sortedJobs) {
    let minIndex = workers.indexOf(Math.min(...workers));
    workers[minIndex] += job;
  }
  return workers;
}

הסיבוכיות היא O(N log N) בגלל המיון של המשימות, שזה אופטימלי ויעיל.`,
    testFeedback: "פתרון אלגנטי המפגין שליטה מלאה באלגוריתמים וב-TypeScript. המיון בסדר יורד תורם למניעת חוסר איזון קיצוני. מועמד יוצא מן הכלל. ציון: 98/100.",
    chatTranscript: [
      { sender: "bot", text: "שלום עומרי! 👋 אני איימי, נעים מאוד. מהי ציפיית השכר שלך לתפקיד הפולסטאק?", timestamp: "11:00" },
      { sender: "candidate", text: "אהלן איימי. הציפייה היא סביבות 22,000 ש\"ח.", timestamp: "11:01" },
      { sender: "bot", text: "תואם את הדרישות! מה הניסיון שלך עם React Hooks וניהול סטייט?", timestamp: "11:02" },
      { sender: "candidate", text: "ניסיון יום-יומי ב-3 השנים האחרונות. משתמש בעיקר ב-Context, Redux Toolkit וכתבתי המון Custom Hooks לתקשורת מול APIs.", timestamp: "11:04" },
      { sender: "bot", text: "כל הכבוד! נשמע מעולה. הנה תרגיל המבחן המעשי שלך לגבי אלגוריתם חלוקת המשימות...", timestamp: "11:05" },
      { sender: "candidate", text: "הנה קוד הפונקציה שאוזנה בהצלחה: function balanceWorkload... מה דעתך?", timestamp: "11:22" },
      { sender: "bot", text: "וואו עומרי, זה קוד נהדר! בדקתי אותו והציון שלך הוא 98. המידע הועבר להמשך התקדמות מהירה.", timestamp: "11:23" }
    ],
    hrNotes: "החוזה כבר נשלח אליו הבוקר ונחתם על ידו בסמארטפון! הוא מתחיל בשבוע הבא. מגויס מנצח בעזרת הסוכנת הדיגיטלית.",
    contractSent: true,
    contractSigned: true,
    updatedAt: "2026-05-31"
  }
];
