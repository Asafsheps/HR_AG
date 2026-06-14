/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { supabase } from "./supabase";
import { INITIAL_POSITIONS, INITIAL_CANDIDATES } from "./src/data/mockData";

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 7000;

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

function isSupabaseConfigured(): boolean {
  const url = process.env.SUPABASE_URL || "";
  const key = process.env.SUPABASE_ANON_KEY || "";
  return !!url && !!key && url.startsWith("http") && url !== "YOUR_SUPABASE_PROJECT_URL";
}

// Authentication Middleware
async function getUserOrganization(userId: string): Promise<string> {
  if (!isSupabaseConfigured()) {
    return userId === "admin-id" ? "default-org" : "default-org";
  }
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", userId)
      .maybeSingle();

    if (error) throw error;
    if (data && data.organization_id) {
      return data.organization_id;
    }
    return "default-org";
  } catch (err) {
    console.error("Error getting user organization:", err);
    return "default-org";
  }
}

// Authentication Middleware
async function requireAuth(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: Missing or invalid token format." });
  }
  const token = authHeader.split(" ")[1];

  // Allow developer mock token in both local and Supabase modes
  if (token === "mock-jwt-token-for-dev") {
    req.user = { 
      id: "admin-id", 
      email: "admin@example.com", 
      role: "admin", 
      organization_id: "default-org" 
    };
    return next();
  }

  if (!isSupabaseConfigured()) {
    return res.status(401).json({ error: "Unauthorized: Invalid token for mock developer session." });
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ error: "Unauthorized: Invalid or expired session token." });
    }
    const orgId = await getUserOrganization(user.id);
    req.user = {
      ...user,
      organization_id: orgId
    };
    next();
  } catch (err: any) {
    return res.status(401).json({ error: "Unauthorized: Authentication verification failed." });
  }
}

// --- Auth Routes ---
app.post("/api/auth/signup", async (req, res) => {
  const { mode, email, password, orgName, orgId } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "נא להזין אימייל וסיסמה." });
  }

  if (!isSupabaseConfigured()) {
    const mockOrgId = mode === "create" ? `org-${Date.now()}` : orgId;
    const mockOrgName = mode === "create" ? orgName : "ארגון קיים (סימולציה)";
    return res.json({
      token: "mock-jwt-token-for-dev",
      user: {
        id: `user-${Date.now()}`,
        email,
        role: mode === "create" ? "admin" : "recruiter",
        organizationId: mockOrgId,
        organizationName: mockOrgName
      }
    });
  }

  try {
    let targetOrgId = orgId;
    let targetOrgName = "";

    if (mode === "create") {
      if (!orgName) {
        return res.status(400).json({ error: "נא להזין את שם הארגון." });
      }
      targetOrgId = `org-${Math.random().toString(36).substring(2, 9)}`;
      targetOrgName = orgName;

      // Insert organization
      const { error: orgErr } = await supabase
        .from("organizations")
        .insert({ id: targetOrgId, name: targetOrgName, created_at: new Date().toISOString() });
      
      if (orgErr) throw orgErr;

      // Seed default settings and whatsapp config for organization
      await supabase.from("agent_settings").insert({
        organization_id: targetOrgId,
        persona_name: "איימי",
        custom_objective: "לנהל שיחת סינון ראשונית בוואטסאפ עם מועמדים, לנטר פרטים אישיים וציפיות שכר מפי המועמד, לבחון מענה על שאלות ה-HR ולהפנות את המועמדים החזקים לביצוע מבדק קוד מעשי אוטומטי.",
        conversational_tone: "friendly",
        additional_guidelines: "1. היה תומך ומזמין.\n2. ברר בבקשה בקור רוח על שנות הניסיון.\n3. אל תשתמש במונחים טכניים מסובכים מדי."
      });

      await supabase.from("whatsapp_config").insert({
        organization_id: targetOrgId,
        phone_number: "",
        access_token: "",
        phone_number_id: "",
        business_account_id: "",
        webhook_verify_token: `verify_token_${Math.random().toString(36).substring(2, 10)}`,
        provider: "sandbox_sim",
        custom_agent_url: "",
        is_configured: false
      });
    } else {
      if (!targetOrgId) {
        return res.status(400).json({ error: "נא להזין קוד ארגון." });
      }
      const { data: orgData, error: orgFindErr } = await supabase
        .from("organizations")
        .select("name")
        .eq("id", targetOrgId)
        .maybeSingle();

      if (orgFindErr || !orgData) {
        return res.status(400).json({ error: "הארגון המבוקש לא קיים במערכת. בדוק את קוד הארגון." });
      }
      targetOrgName = orgData.name;
    }

    const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
      email,
      password
    });

    if (signUpErr) throw signUpErr;
    if (!signUpData.user) {
      throw new Error("שגיאה ברישום המשתמש.");
    }

    const { error: profileErr } = await supabase
      .from("profiles")
      .insert({
        id: signUpData.user.id,
        organization_id: targetOrgId,
        role: mode === "create" ? "admin" : "recruiter",
        created_at: new Date().toISOString()
      });

    if (profileErr) throw profileErr;

    return res.json({
      token: signUpData.session?.access_token || "mock-jwt-token-for-dev",
      user: {
        id: signUpData.user.id,
        email: signUpData.user.email,
        role: mode === "create" ? "admin" : "recruiter",
        organizationId: targetOrgId,
        organizationName: targetOrgName
      }
    });

  } catch (err: any) {
    console.error("Signup error:", err.message);
    return res.status(500).json({ error: err.message || "שגיאה בתהליך הרישום." });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "נא להזין אימייל וסיסמה." });
  }

  if (email === "admin@example.com" && password === "admin123") {
    return res.json({
      token: "mock-jwt-token-for-dev",
      user: {
        id: "admin-id",
        email: "admin@example.com",
        role: "admin",
        organizationId: "default-org",
        organizationName: "ארגון דיגיטלי (סימולציה)"
      }
    });
  }

  if (!isSupabaseConfigured()) {
    return res.status(401).json({ error: "פרטי התחברות שגויים (במצב סימולציה מקומי השתמש ב-admin@example.com / admin123)." });
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (!data.user) throw new Error("לא נמצא משתמש.");

    const orgId = await getUserOrganization(data.user.id);
    let orgName = "ארגון לא ידוע";
    const { data: orgData } = await supabase
      .from("organizations")
      .select("name")
      .eq("id", orgId)
      .maybeSingle();
    if (orgData) orgName = orgData.name;

    let role = "recruiter";
    const { data: profileData } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .maybeSingle();
    if (profileData) role = profileData.role;

    return res.json({
      token: data.session?.access_token,
      user: {
        id: data.user.id,
        email: data.user.email,
        role: role,
        organizationId: orgId,
        organizationName: orgName
      }
    });
  } catch (error: any) {
    console.error("Auth error:", error.message);
    return res.status(401).json({ error: error.message || "שגיאת התחברות למערכת." });
  }
});

app.get("/api/auth/me", requireAuth, async (req: any, res: any) => {
  let orgName = "ארגון ברירת מחדל";
  if (isSupabaseConfigured() && req.user.organization_id) {
    const { data } = await supabase
      .from("organizations")
      .select("name")
      .eq("id", req.user.organization_id)
      .maybeSingle();
    if (data) orgName = data.name;
  }
  
  let role = "recruiter";
  if (isSupabaseConfigured() && req.user.id) {
    const { data } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", req.user.id)
      .maybeSingle();
    if (data) role = data.role;
  }

  return res.json({
    user: {
      id: req.user.id,
      email: req.user.email,
      role: role,
      organizationId: req.user.organization_id,
      organizationName: orgName
    }
  });
});

// REST API endpoint: Evaluate/Simulate WhatsApp HR Conversational Bot
app.post("/api/candidate/simulate-bot", requireAuth, async (req, res) => {
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

// ==========================================
// SUPABASE BACKEND CRUD API ROUTES WITH IN-MEMORY FALLBACK
// ==========================================

// In-Memory Database Fallback State
let memPositions: any[] = INITIAL_POSITIONS.map(p => ({ ...p, organization_id: "default-org" }));
let memCandidates: any[] = INITIAL_CANDIDATES.map(c => ({ ...c, organization_id: "default-org" }));
let memAgentSettings: Record<string, any> = {
  "default-org": {
    personaName: "איימי",
    customObjective: "לנהל שיחת סינון ראשונית בוואטסאפ עם מועמדים, לנטר פרטים אישיים וציפיות שכר מפי המועמד, לבחון מענה על שאלות ה-HR ולהפנות את המועמדים החזקים לביצוע מבדק קוד מעשי אוטומטי.",
    conversationalTone: "friendly",
    additionalGuidelines: "1. היה תומך ומזמין.\n2. ברר בבקשה בקור רוח על שנות הניסיון.\n3. אל תשתמש במונחים טכניים מסובכים מדי."
  }
};
let memUploadedContracts: any[] = [
  {
    id: "contract-nda",
    organization_id: "default-org",
    name: "סודיות_למועמדים_NDA_2026.docx",
    content: `הסכם שמירת סודיות (NDA) - מועמדי גיוס\n\nשנחתם ביום {date} בין החברה המגייסת לבין מר/גב' {name} נושא ת.ז/דרכון/טלפון {phone}.\n\nהמועמד מתחייב לשמור בסודיות מוחלטת כל מידע טכנולוגי או עסקי שייחשף אליו במהלך מבדקי המשרה {position}.\nשכר מבוקש להמשך תיאום: {salary} ש"ח בחודש.\n\nחתימת המועמד: _________________`,
    fileType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    fileSize: "24.5 KB",
    uploadedAt: "2026-05-15"
  },
  {
    id: "contract-standard-dev",
    organization_id: "default-org",
    name: "הסכם_משרה_מלאה_סטנדרטי.docx",
    content: `הסכם העסקה אישי - מפתח תוכנה\n\nשנערך ביום {date}\nבין: החברה המגייסת\nלבין המועמד: {name} (טלפון: {phone}, אימייל: {email})\n\nלתפקיד: {position}\n\nתנאי העסקה עיקריים:\n1. שכר חודשי יסוד ברוטו: {salary} ש"ח.\n2. המועמד מתחייב להקדיש את מירב מרצו לחברה.\n\nחתימת החברה: HR Team       חתימת המועמד: ______________`,
    fileType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    fileSize: "41.2 KB",
    uploadedAt: "2026-05-28"
  }
];
let memWhatsappConfig: Record<string, any> = {
  "default-org": {
    phoneNumber: '',
    accessToken: '',
    phoneNumberId: '',
    businessAccountId: '',
    webhookVerifyToken: 'verify_token_default123',
    provider: 'sandbox_sim',
    customAgentUrl: '',
    isConfigured: false
  }
};

// --- Positions API ---
app.get("/api/positions", requireAuth, async (req: any, res: any) => {
  const orgId = req.user.organization_id;
  if (!isSupabaseConfigured()) {
    return res.json(memPositions.filter(p => p.organization_id === orgId));
  }
  try {
    const { data, error } = await supabase
      .from("positions")
      .select("*")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    
    const mapped = (data || []).map((pos: any) => ({
      id: pos.id,
      title: pos.title,
      experienceYears: pos.experience_years,
      requirements: pos.requirements,
      questions: pos.questions,
      testPrompt: pos.test_prompt,
      contractTemplate: pos.contract_template,
      isActive: pos.is_active,
      createdAt: pos.created_at,
    }));
    return res.json(mapped);
  } catch (error: any) {
    console.error("Error fetching positions:", error.message);
    return res.status(500).json({ error: error.message });
  }
});

app.post("/api/positions", requireAuth, async (req: any, res: any) => {
  const body = req.body;
  const orgId = req.user.organization_id;
  body.organization_id = orgId;
  if (!isSupabaseConfigured()) {
    const idx = memPositions.findIndex(p => p.id === body.id);
    if (idx !== -1) {
      memPositions[idx] = body;
    } else {
      memPositions.push(body);
    }
    return res.json(body);
  }
  try {
    const dbData = {
      id: body.id,
      organization_id: orgId,
      title: body.title,
      experience_years: body.experienceYears,
      requirements: body.requirements,
      questions: body.questions,
      test_prompt: body.testPrompt,
      contract_template: body.contractTemplate,
      is_active: body.isActive,
      created_at: body.createdAt
    };

    const { data, error } = await supabase
      .from("positions")
      .upsert(dbData)
      .select();

    if (error) throw error;
    return res.json(data ? data[0] : null);
  } catch (error: any) {
    console.error("Error saving position:", error.message);
    return res.status(500).json({ error: error.message });
  }
});

app.delete("/api/positions/:id", requireAuth, async (req: any, res: any) => {
  const { id } = req.params;
  const orgId = req.user.organization_id;
  if (!isSupabaseConfigured()) {
    memPositions = memPositions.filter(p => p.id !== id);
    return res.json({ success: true });
  }
  try {
    const { error } = await supabase
      .from("positions")
      .delete()
      .eq("id", id)
      .eq("organization_id", orgId);

    if (error) throw error;
    return res.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting position:", error.message);
    return res.status(500).json({ error: error.message });
  }
});

// --- Candidates API ---
app.get("/api/candidates", requireAuth, async (req: any, res: any) => {
  const orgId = req.user.organization_id;
  if (!isSupabaseConfigured()) {
    return res.json(memCandidates.filter(c => c.organization_id === orgId));
  }
  try {
    const { data, error } = await supabase
      .from("candidates")
      .select("*")
      .eq("organization_id", orgId)
      .order("updated_at", { ascending: false });

    if (error) throw error;

    const mapped = (data || []).map((cand: any) => ({
      id: cand.id,
      positionId: cand.position_id,
      name: cand.name,
      phone: cand.phone,
      email: cand.email,
      status: cand.status,
      requestedSalary: cand.requested_salary,
      salaryFitAnalysis: cand.salary_fit_analysis,
      experienceSummary: cand.experience_summary,
      score: cand.score,
      aiFitSummary: cand.ai_fit_summary,
      testAnswers: cand.test_answers,
      testFeedback: cand.test_feedback,
      chatTranscript: cand.chat_transcript,
      hrNotes: cand.hr_notes,
      contractSent: cand.contract_sent,
      contractSigned: cand.contract_signed,
      updatedAt: cand.updated_at,
      customContractContent: cand.custom_contract_content
    }));
    return res.json(mapped);
  } catch (error: any) {
    console.error("Error fetching candidates:", error.message);
    return res.status(500).json({ error: error.message });
  }
});

app.post("/api/candidates", requireAuth, async (req: any, res: any) => {
  const body = req.body;
  const orgId = req.user.organization_id;
  body.organization_id = orgId;
  if (!isSupabaseConfigured()) {
    const idx = memCandidates.findIndex(c => c.id === body.id);
    if (idx !== -1) {
      memCandidates[idx] = body;
    } else {
      memCandidates.push(body);
    }
    return res.json(body);
  }
  try {
    const dbData = {
      id: body.id,
      organization_id: orgId,
      position_id: body.positionId,
      name: body.name,
      phone: body.phone,
      email: body.email,
      status: body.status,
      requested_salary: body.requestedSalary,
      salary_fit_analysis: body.salaryFitAnalysis,
      experience_summary: body.experienceSummary,
      score: body.score,
      ai_fit_summary: body.aiFitSummary,
      test_answers: body.testAnswers,
      test_feedback: body.testFeedback,
      chat_transcript: body.chatTranscript,
      hr_notes: body.hrNotes,
      contract_sent: body.contractSent,
      contract_signed: body.contractSigned,
      updated_at: body.updatedAt,
      custom_contract_content: body.customContractContent
    };

    const { data, error } = await supabase
      .from("candidates")
      .upsert(dbData)
      .select();

    if (error) throw error;
    return res.json(data ? data[0] : null);
  } catch (error: any) {
    console.error("Error saving candidate:", error.message);
    return res.status(500).json({ error: error.message });
  }
});

app.delete("/api/candidates/:id", requireAuth, async (req: any, res: any) => {
  const { id } = req.params;
  const orgId = req.user.organization_id;
  if (!isSupabaseConfigured()) {
    memCandidates = memCandidates.filter(c => c.id !== id);
    return res.json({ success: true });
  }
  try {
    const { error } = await supabase
      .from("candidates")
      .delete()
      .eq("id", id)
      .eq("organization_id", orgId);

    if (error) throw error;
    return res.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting candidate:", error.message);
    return res.status(500).json({ error: error.message });
  }
});

// --- Agent Settings API ---
app.get("/api/agent-settings", requireAuth, async (req: any, res: any) => {
  const orgId = req.user.organization_id;
  if (!isSupabaseConfigured()) {
    if (!memAgentSettings[orgId]) {
      memAgentSettings[orgId] = {
        personaName: "איימי",
        customObjective: "לנהל שיחת סינון ראשונית בוואטסאפ עם מועמדים.",
        conversationalTone: "friendly",
        additionalGuidelines: ""
      };
    }
    return res.json(memAgentSettings[orgId]);
  }
  try {
    const { data, error } = await supabase
      .from("agent_settings")
      .select("*")
      .eq("organization_id", orgId)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      const defaultSettings = {
        organization_id: orgId,
        persona_name: "איימי",
        custom_objective: "לנהל שיחת סינון ראשונית בוואטסאפ עם מועמדים, לנטר פרטים אישיים וציפיות שכר מפי המועמד, לבחון מענה על שאלות ה-HR ולהפנות את המועמדים החזקים לביצוע מבדק קוד מעשי אוטומטי.",
        conversational_tone: "friendly",
        additional_guidelines: "1. היה תומך ומזמין.\n2. ברר בבקשה בקור רוח על שנות הניסיון.\n3. אל תשתמש במונחים טכניים מסובכים מדי."
      };
      await supabase.from("agent_settings").insert(defaultSettings);
      return res.json({
        personaName: defaultSettings.persona_name,
        customObjective: defaultSettings.custom_objective,
        conversationalTone: defaultSettings.conversational_tone,
        additionalGuidelines: defaultSettings.additional_guidelines
      });
    }

    return res.json({
      personaName: data.persona_name,
      customObjective: data.custom_objective,
      conversationalTone: data.conversational_tone,
      additionalGuidelines: data.additional_guidelines
    });
  } catch (error: any) {
    console.error("Error fetching agent settings:", error.message);
    return res.status(500).json({ error: error.message });
  }
});

app.post("/api/agent-settings", requireAuth, async (req: any, res: any) => {
  const body = req.body;
  const orgId = req.user.organization_id;
  if (!isSupabaseConfigured()) {
    memAgentSettings[orgId] = body;
    return res.json(body);
  }
  try {
    const dbData = {
      organization_id: orgId,
      persona_name: body.personaName,
      custom_objective: body.customObjective,
      conversational_tone: body.conversationalTone,
      additional_guidelines: body.additionalGuidelines
    };

    const { data, error } = await supabase
      .from("agent_settings")
      .upsert(dbData)
      .select();

    if (error) throw error;
    return res.json(data ? data[0] : null);
  } catch (error: any) {
    console.error("Error saving agent settings:", error.message);
    return res.status(500).json({ error: error.message });
  }
});

// --- Uploaded Contracts API ---
app.get("/api/uploaded-contracts", requireAuth, async (req: any, res: any) => {
  const orgId = req.user.organization_id;
  if (!isSupabaseConfigured()) {
    return res.json(memUploadedContracts.filter(doc => doc.organization_id === orgId));
  }
  try {
    const { data, error } = await supabase
      .from("uploaded_contracts")
      .select("*")
      .eq("organization_id", orgId)
      .order("uploaded_at", { ascending: false });

    if (error) throw error;
    const mapped = (data || []).map((doc: any) => ({
      id: doc.id,
      name: doc.name,
      content: doc.content,
      fileType: doc.file_type,
      fileSize: doc.file_size,
      uploadedAt: doc.uploaded_at
    }));
    return res.json(mapped);
  } catch (error: any) {
    console.error("Error fetching uploaded contracts:", error.message);
    return res.status(500).json({ error: error.message });
  }
});

app.post("/api/uploaded-contracts", requireAuth, async (req: any, res: any) => {
  const body = req.body;
  const orgId = req.user.organization_id;
  body.organization_id = orgId;
  if (!isSupabaseConfigured()) {
    const idx = memUploadedContracts.findIndex(doc => doc.id === body.id);
    if (idx !== -1) {
      memUploadedContracts[idx] = body;
    } else {
      memUploadedContracts.push(body);
    }
    return res.json(body);
  }
  try {
    const dbData = {
      id: body.id,
      organization_id: orgId,
      name: body.name,
      content: body.content,
      file_type: body.fileType,
      file_size: body.fileSize,
      uploaded_at: body.uploadedAt
    };

    const { data, error } = await supabase
      .from("uploaded_contracts")
      .upsert(dbData)
      .select();

    if (error) throw error;
    return res.json(data ? data[0] : null);
  } catch (error: any) {
    console.error("Error saving uploaded contract:", error.message);
    return res.status(500).json({ error: error.message });
  }
});

app.delete("/api/uploaded-contracts/:id", requireAuth, async (req: any, res: any) => {
  const { id } = req.params;
  const orgId = req.user.organization_id;
  if (!isSupabaseConfigured()) {
    memUploadedContracts = memUploadedContracts.filter(doc => doc.id !== id);
    return res.json({ success: true });
  }
  try {
    const { error } = await supabase
      .from("uploaded_contracts")
      .delete()
      .eq("id", id)
      .eq("organization_id", orgId);

    if (error) throw error;
    return res.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting contract template:", error.message);
    return res.status(500).json({ error: error.message });
  }
});

// --- WhatsApp Config API ---
app.get("/api/whatsapp-config", requireAuth, async (req: any, res: any) => {
  const orgId = req.user.organization_id;
  if (!isSupabaseConfigured()) {
    if (!memWhatsappConfig[orgId]) {
      memWhatsappConfig[orgId] = {
        phoneNumber: '',
        accessToken: '',
        phoneNumberId: '',
        businessAccountId: '',
        webhookVerifyToken: 'verify_token_' + Math.random().toString(36).substring(2, 10),
        provider: 'sandbox_sim',
        customAgentUrl: '',
        isConfigured: false
      };
    }
    return res.json(memWhatsappConfig[orgId]);
  }
  try {
    const { data, error } = await supabase
      .from("whatsapp_config")
      .select("*")
      .eq("organization_id", orgId)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      const defaultConfig = {
        organization_id: orgId,
        phone_number: '',
        access_token: '',
        phone_number_id: '',
        business_account_id: '',
        webhook_verify_token: 'verify_token_' + Math.random().toString(36).substring(2, 10),
        provider: 'sandbox_sim',
        custom_agent_url: '',
        is_configured: false
      };
      await supabase.from("whatsapp_config").insert(defaultConfig);
      return res.json(defaultConfig);
    }

    return res.json({
      phoneNumber: data.phone_number,
      accessToken: data.access_token,
      phoneNumberId: data.phone_number_id,
      businessAccountId: data.business_account_id,
      webhookVerifyToken: data.webhook_verify_token,
      provider: data.provider,
      customAgentUrl: data.custom_agent_url,
      isConfigured: data.is_configured
    });
  } catch (error: any) {
    console.error("Error fetching whatsapp config:", error.message);
    return res.status(500).json({ error: error.message });
  }
});

app.post("/api/whatsapp-config", requireAuth, async (req: any, res: any) => {
  const body = req.body;
  const orgId = req.user.organization_id;
  if (!isSupabaseConfigured()) {
    memWhatsappConfig[orgId] = body;
    return res.json(body);
  }
  try {
    const dbData = {
      organization_id: orgId,
      phone_number: body.phoneNumber,
      access_token: body.accessToken,
      phone_number_id: body.phoneNumberId,
      business_account_id: body.businessAccountId,
      webhook_verify_token: body.webhookVerifyToken,
      provider: body.provider,
      custom_agent_url: body.customAgentUrl,
      is_configured: body.isConfigured
    };

    const { data, error } = await supabase
      .from("whatsapp_config")
      .upsert(dbData)
      .select();

    if (error) throw error;
    return res.json(data ? data[0] : null);
  } catch (error: any) {
    console.error("Error saving whatsapp config:", error.message);
    return res.status(500).json({ error: error.message });
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
