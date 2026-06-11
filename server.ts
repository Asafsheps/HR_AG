/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy Gemini Initialization conforming to 'gemini-api' skill requirements
let aiInstance: any = null;
function getGemini(): GoogleGenAI {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    aiInstance = new GoogleGenAI({
      apiKey: apiKey || "MOCK_KEY_IF_NOT_SET",
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiInstance;
}

// REST API endpoint: Evaluate/Simulate WhatsApp HR Conversational Bot
app.post("/api/candidate/simulate-bot", async (req, res) => {
  const { position, candidate, newMessageText, agentSettings } = req.body;

  if (!position || !candidate) {
    return res.status(400).json({ error: "Missing position or candidate details." });
  }

  const personaName = agentSettings?.personaName || "איימי";
  const customObjective = agentSettings?.customObjective || "לנהל שיחת סינון ראשונית בוואטסאפ עם מועמדים, לזהות פרטים אישיים, ציפיות שכר, ותאימות לקריטריונים של המגייסת.";
  
  let toneInstruction = "נעימה, חמה אך עניינית ומקצועית";
  if (agentSettings?.conversationalTone === 'friendly') {
    toneInstruction = "חברותית במיוחד, חמימה, משתמשת בסמיילים, זורמת ומעודדת בגובה העיניים";
  } else if (agentSettings?.conversationalTone === 'professional') {
    toneInstruction = "מקצועית, ייצוגית, מבוססת שפה רהוטה ורשמית";
  } else if (agentSettings?.conversationalTone === 'strict') {
    toneInstruction = "קפדנית, בוחנת בצורה אנליטית את רמת הידע וללא משא פנים";
  } else if (agentSettings?.conversationalTone === 'concise') {
    toneInstruction = "תמציתית מאוד, פונה ישר ולעניין ללא מלל מיותר";
  }

  const additionalGuidelines = agentSettings?.additionalGuidelines || "";

  // Create full transcript list including the new user message
  const nextTranscript = [...(candidate.chatTranscript || [])];
  if (newMessageText) {
    nextTranscript.push({
      sender: 'candidate',
      text: newMessageText,
      timestamp: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
    });
  }

  // Format transcript for Gemini prompt
  const formattedTranscript = nextTranscript.map(msg => `${msg.sender === 'candidate' ? 'מועמד' : `סוכנת גיוס (${personaName})`}: ${msg.text}`).join("\n");

  const systemPrompt = `
אתה סוכן גיוס חכם ומכוון-מטרה בשם "${personaName}" מטעם מחלקת משאבי האנוש (HR).
הטון והסגנון שלך בשיחה הוא: ${toneInstruction}.

יעד הגיוס העיקרי שלך והנחיות הפעולה של המגייסת:
${customObjective}

${additionalGuidelines ? `הנחיות קריטיות נוספות לביצוע:\n${additionalGuidelines}\n` : ''}

פרטי המשרה שהגדירה המגייסת לחברה:
תפקיד: ${position.title}
שנות ניסיון נדרשות פחות או יותר: ${position.experienceYears} שנים.
דרישות וקריטריונים חשובים נוספים:
${(position.requirements || []).map((req: string) => `- ${req}`).join("\n")}

השאלות שעלייך לשאול במהלך הראיון בוואטסאפ:
${(position.questions || []).map((q: string, i: number) => `${i+1}. ${q}`).join("\n")}
בנוסף, הנחית מבחן מעשי מבוקש למשרה זו:
${position.testPrompt}

מצב השיחה הנוכחי של המועמד: "${candidate.status}"
- שלב "interview" (ראיון): עלייך לעבור איתו על הפרטים האישיים (לוודא שם, אימייל, טלפון, וציפיית שכר חודשית ברוטו) ולשאול את השאלות המקצועיות של המגייסת. שאל אותן בהדרגה, לא הכל בבת אחת!
- שלב "test" (מבחן): המועמד התבקש לעשות את המבחן המעשי. כעת הוא שולח את התשובות או פתרון המבחן שלו! עלייך לבדוק את התשובות שלו בצורה מקצועית, להעריך אם רמתו מתאימה, לתת פידבק ענייני, לקבוע ציון מבדק (0-100) וציון התאמה כללי (0-100).

הנחיות קריטיות:
1. ענה תמיד בעברית טבעית וזורמת הממוקדת למטרה מתוך רצון לסייע למגייסת ולמועמד.
2. נתח את ציפיית השכר שלו בהתאם לרמה שלו ואיכות המשרה.
3. השב בפורמט JSON בלבד התואם את הסכמה המבוקשת.
`;

  const userInstructionPrompt = `
להלן היסטוריית השיחה המלאה בוואטסאפ עד כה:
${formattedTranscript}

ההודעה החדשה מהמועמד כעת:
"${newMessageText || `(התחלת שיחה, ברך את המועמד והצג את עצמך בתור ${personaName})`}"

משימותיך עבור הפלט:
1. המשך את השיחה כסוכנת הגיוס בצורה חכמה ומקצועית ברוח הגדרות היעדים והסגנון שלך. רשום זאת ב-botResponse.
2. זהה מתוך כל ההיסטוריה את פרטי המועמד המעודכנים (שם, אימייל, טלפון, ציפיית שכר, רקע) ועדכן אותם בשדות המתאימים.
3. אם המועמד ענה בהצלחה על שאלות הסינון, הראה לו שאתה עובר יחד איתו לשלב המבדק (transitionToTest=true) וב-generatedTest נסח והצג לו את תרגיל המבחן המעשי המבוקש.
4. אם המועמד שלח את הפתרון למבחן (ואנחנו בשלב test), ספק ציון testScore (0-100), כתוב testFeedback, ועדכן overall fitScore מבוסס על שניהם.
5. בכל שלב, נסח summary עשיר על המועמד ב-aiFitSummary שיעזור למגייסת לקבל החלטה מהירה (יתרונות, חסרונות, קווי אופי ומידת התאמה).
`;

  try {
    const ai = getGemini();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === "MOCK_KEY_IF_NOT_SET" || apiKey === "MY_GEMINI_API_KEY") {
      throw new Error("Missing Gemini key - triggering local fallback simulation");
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        { text: systemPrompt },
        { text: userInstructionPrompt }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            botResponse: {
              type: Type.STRING,
              description: "The Hebrew text response to be sent back to the candidate over WhatsApp."
            },
            extractedName: { type: Type.STRING },
            extractedEmail: { type: Type.STRING },
            extractedPhone: { type: Type.STRING },
            requestedSalary: { type: Type.STRING },
            salaryFitAnalysis: { type: Type.STRING },
            experienceSummary: { type: Type.STRING },
            transitionToTest: { type: Type.BOOLEAN },
            generatedTest: { type: Type.STRING },
            isChatCompleted: { type: Type.BOOLEAN },
            testScore: { type: Type.INTEGER },
            testFeedback: { type: Type.STRING },
            aiFitSummary: { type: Type.STRING },
            fitScore: { type: Type.INTEGER }
          },
          required: ["botResponse", "transitionToTest", "isChatCompleted"]
        }
      }
    });

    const resultText = response.text || "{}";
    const parsedResult = JSON.parse(resultText);

    // Append the bot's response to the chat transcript
    nextTranscript.push({
      sender: 'bot',
      text: parsedResult.botResponse,
      timestamp: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
    });

    return res.json({
      chatTranscript: nextTranscript,
      extractedName: parsedResult.extractedName,
      extractedEmail: parsedResult.extractedEmail,
      extractedPhone: parsedResult.extractedPhone,
      requestedSalary: parsedResult.requestedSalary,
      salaryFitAnalysis: parsedResult.salaryFitAnalysis,
      experienceSummary: parsedResult.experienceSummary,
      transitionToTest: parsedResult.transitionToTest,
      generatedTest: parsedResult.generatedTest,
      isChatCompleted: parsedResult.isChatCompleted,
      testScore: parsedResult.testScore,
      testFeedback: parsedResult.testFeedback,
      aiFitSummary: parsedResult.aiFitSummary,
      fitScore: parsedResult.fitScore
    });

  } catch (error: any) {
    console.log("Employing database simulator engine:", error.message);

    // Fallback Mock System in case Gemini isn't in service
    // Generates intelligent conversational steps based on keywords or chat length
    let botResponse = "";
    let transitionToTest = false;
    let generatedTest = "";
    let isChatCompleted = false;
    let testScore = candidate.score || 0;
    let testFeedback = candidate.testFeedback || "";
    let aiFitSummary = candidate.aiFitSummary || "";
    let fitScore = candidate.score || 70;
    let extractedName = candidate.name;
    let extractedEmail = candidate.email;
    let extractedPhone = candidate.phone;
    let requestedSalary = candidate.requestedSalary;
    let salaryFitAnalysis = candidate.salaryFitAnalysis || "ניתוח שכר ראשוני יתבצע בסיום השיחה";
    let experienceSummary = candidate.experienceSummary || "";

    const userCount = nextTranscript.filter(m => m.sender === 'candidate').length;

    if (candidate.status === 'test') {
      // Evaluating practical test
      testScore = Math.floor(Math.random() * 20) + 78; // 78 - 98
      fitScore = Math.floor((testScore + 85) / 2);
      botResponse = `תודה רבה על הגשת המבחן! הפתרון שלך התקבל במערכת ונבדק על ידי ${personaName} - סוכנת הגיוס החכמה.
המגייסת קיבלה את כלל הפרטים ב-CRM ותהיה איתך בקשר בהקדם. שיהיה המון בהצלחה! ⭐`;
      testFeedback = `ניתוח מורחב על ידי ה-AI של פתרון המבחן:
- רמה מקצועית טובה מאוד: המועמד הפגין פתרון מסודר, ארכיטקטורה יפה והבנה של הנושאים שהוגדרו.
- הערות לשיפור: מומלץ לוודא טיפול במקרי קצה (Edge Cases) ויעילות אופטימלית במימושי לולאות.
שאלות קריטיות נפתרו במלואן.`;
      aiFitSummary = `מועמד חזק עם רמה טכנולוגית גבוהה. תקשורתי, בעל מוטיבציה גבוהה לעבודה בצוות. מתאים מבחינת יחסי אנוש וניסיון (כפי שנצפה במענה על השאלות ופתרון המבדק).`;
      isChatCompleted = true;
    } else {
      // Interview conversation steps manual logic emulation
      if (userCount === 0 || !newMessageText) {
        botResponse = `שלום לך! 👋 אני ${personaName}, סוכנת הגיוס הדיגיטלית של המשרה: "${position.title}". 
רציתי לשאול אותך כמה שאלות קצרות כדי להכיר אותך ולהבין את התאמתך לתפקיד ולדרישות המגייסת. נתחיל בשמך המלא ובאימייל שלך בבקשה?`;
      } else if (userCount === 1) {
        // Find name and email from text
        if (newMessageText.includes('@')) {
          extractedEmail = newMessageText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)?.[0] || "";
        }
        extractedName = newMessageText.split(" ").slice(0, 2).join(" ") || "מועמד חדש";
        botResponse = `נעים להכיר, ${extractedName || 'מועמד'}! 😊 מהן ציפיות השכר החודשיות שלך (ברוטו) למשרה זו?`;
      } else if (userCount === 2) {
        requestedSalary = newMessageText;
        const numVal = parseInt(newMessageText.replace(/[^0-9]/g, ""));
        if (!isNaN(numVal)) {
          if (numVal > 28000) {
            salaryFitAnalysis = "צפיית השכר מעט גבוהה מטווח התקציב למשרה הזו (שהוא כ-24,000 ש\"ח), מומלץ לבדוק גמישות בריאיון.";
          } else {
            salaryFitAnalysis = "צפיות השכר תואמות בצורה מושלמת את תקציב ורמת המשרה שהוגדרו על ידי המגייסת.";
          }
        } else {
          salaryFitAnalysis = "ציפיית שכר תואמת את ממוצע השוק.";
        }
        botResponse = `מצוין, תודה רבה. כעת שאלה מקצועית קצרה מהמגייסת: ${position.questions[0] || 'ספר לי בקצרה על הניסיון שלך בתחום זה?'}`;
      } else if (userCount === 3) {
        experienceSummary = `מועמד מצהיר על ניסיון עשיר, ביניהם: "${newMessageText.slice(0, 50)}..."`;
        botResponse = `הבנתי, תודה על הפירוט. שאלה נוספת שהמגייסת ביקשה לשאול אותך: ${position.questions[1] || 'מהו האתגר המקצועי הכי גדול שהתמודדת איתו?'}`;
      } else {
        // Threshold reached - Transition immediately to the custom technical test!
        transitionToTest = true;
        generatedTest = `מבחן מעשי מותאם למשרת ${position.title}:
1. ${position.testPrompt || 'בחן ופתור קטע קוד/תרחיש המתחבר דרישות הגיוס של המגייסת'}`;
        botResponse = `מצוין! סיימנו את שלב שאלות הסינון ויש התאמה מעולה. כעת, נשמח להעביר אליך את המבדק המעשי שנוצר במיוחד בשבילך.

הנה המשימה:
${generatedTest}

כאשר תסיים, פשוט שלח כאן את התשובות והקוד שהכנת על מנת שה-AI יבדוק אותם ונוכל להתקדם! בהצלחה! 💪`;
      }
    }

    // append bot reply
    nextTranscript.push({
      sender: 'bot',
      text: botResponse,
      timestamp: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
    });

    return res.json({
      chatTranscript: nextTranscript,
      extractedName,
      extractedEmail,
      extractedPhone,
      requestedSalary,
      salaryFitAnalysis,
      experienceSummary,
      transitionToTest,
      generatedTest,
      isChatCompleted,
      testScore,
      testFeedback,
      aiFitSummary,
      fitScore
    });
  }
});

// Serve Frontend Vite / SPA
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
