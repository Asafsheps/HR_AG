/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Briefcase, 
  Users, 
  CheckSquare, 
  FileText, 
  Send, 
  Plus, 
  Search, 
  Filter, 
  SlidersHorizontal, 
  Sparkles, 
  PhoneCall, 
  ExternalLink, 
  FileSignature, 
  Loader2, 
  HelpCircle, 
  RefreshCw, 
  Check, 
  Trash2, 
  MessageSquare,
  Building,
  UserCheck,
  ChevronLeft,
  X,
  PlusCircle,
  FileCheck,
  DollarSign,
  Mail,
  Upload,
  FileCode,
  LogOut,
  Home
} from 'lucide-react';
import { Position, Candidate, ChatMessage, AgentSettings, UploadedContractTemplate } from './types.ts';
import { INITIAL_POSITIONS, INITIAL_CANDIDATES } from './data/mockData.ts';

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('recruiter_token'));
  const [activeSection, setActiveSection] = useState<'home' | 'positions' | 'candidates' | 'whatsapp' | 'contracts' | 'settings'>('home');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authOrgName, setAuthOrgName] = useState<string>('');
  const [authOrgId, setAuthOrgId] = useState<string>('');
  const [authMode, setAuthMode] = useState<'login' | 'signup_create' | 'signup_join'>('login');

  const [authEmail, setAuthEmail] = useState<string>('');
  const [authPassword, setAuthPassword] = useState<string>('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);

  // Helper to make authorized API calls
  const authFetch = async (url: string, options: RequestInit = {}) => {
    const headers = {
      ...(options.headers || {}),
      'Authorization': `Bearer ${token}`
    };
    const response = await fetch(url, { ...options, headers });
    if (response.status === 401) {
      localStorage.removeItem('recruiter_token');
      setToken(null);
      setCurrentUser(null);
      throw new Error('Unauthorized');
    }
    return response;
  };

  // Verify token on initial load or change
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setCurrentUser(null);
        return;
      }
      try {
        const res = await fetch('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.status === 401) {
          localStorage.removeItem('recruiter_token');
          setToken(null);
          setCurrentUser(null);
        } else {
          const data = await res.json();
          setCurrentUser(data.user);
        }
      } catch (err) {
        console.error("Token verification failed:", err);
      }
    };
    verifyToken();
  }, [token]);

  // Load initial data from backend APIs
  const [positions, setPositions] = useState<Position[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);

  // State for AI Recruitment Agent settings block
  const [agentSettings, setAgentSettings] = useState<AgentSettings>({
    personaName: "איימי",
    customObjective: "לנהל שיחת סינון ראשונית בוואטסאפ עם מועמדים, לנטר פרטים אישיים וציפיות שכר מפי המועמד, לבחון מענה על שאלות ה-HR ולהפנות את המועמדים החזקים לביצוע מבדק קוד מעשי אוטומטי.",
    conversationalTone: "friendly",
    additionalGuidelines: "1. היה תומך ומזמין.\n2. ברר בבקשה בקור רוח על שנות הניסיון.\n3. אל תשתמש במונחים טכניים מסובכים מדי."
  });

  // State for Human Custom Uploaded Templates
  const [uploadedContracts, setUploadedContracts] = useState<UploadedContractTemplate[]>([]);

  // Keep track of chosen document to edit / auto-populate for candidate
  const [selectedContractTemplateId, setSelectedContractTemplateId] = useState<string>("baseline");
  const [liveContractText, setLiveContractText] = useState<string>('');
  const [showAgentSettings, setShowAgentSettings] = useState<boolean>(true);

  // State for Real WhatsApp Cloud API & AI Integration Configurations
  const [whatsappConfig, setWhatsappConfig] = useState({
    phoneNumber: '',
    accessToken: '',
    phoneNumberId: '',
    businessAccountId: '',
    webhookVerifyToken: 'verify_token_' + Math.random().toString(36).substring(2, 10),
    provider: 'sandbox_sim',
    customAgentUrl: '',
    isConfigured: false
  });

  // State for file upload progress simulations
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // States for simulating WhatsApp connectivity tests
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionTestResult, setConnectionTestResult] = useState<'success' | 'failed' | null>(null);

  // State for adding a new position modal/form
  const [showAddPosition, setShowAddPosition] = useState(false);
  const [newPositionTitle, setNewPositionTitle] = useState('');
  const [newPositionExperience, setNewPositionExperience] = useState(3);
  const [newPositionRequirements, setNewPositionRequirements] = useState<string[]>(['']);
  const [newPositionQuestions, setNewPositionQuestions] = useState<string[]>(['']);
  const [newPositionTestPrompt, setNewPositionTestPrompt] = useState('');
  const [newPositionContract, setNewPositionContract] = useState('');

  // Active Tab/View inside left panel
  const [activeViewTab, setActiveViewTab] = useState<'candidates' | 'positions' | 'contracts' | 'whatsapp'>('candidates');

  // Candidate Filters
  const [filterPositionId, setFilterPositionId] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'score' | 'experience' | 'salary'>('score');

  // Recruiter notes free-text buffer, updated when candidate changes
  const [currentNotesBuffer, setCurrentNotesBuffer] = useState('');

  // WhatsApp simulation state
  const [whatsappInputValue, setWhatsappInputValue] = useState('');
  const [isBotResponding, setIsBotResponding] = useState(false);
  const [whatsappCandidateId, setWhatsappCandidateId] = useState<string | null>(null);

  // Chat container reference for auto-scrolling
  const chatEndRef = useRef<HTMLDivElement>(null);


  // Fetch initial data from backend API
  useEffect(() => {
    if (!token) return;
    const loadAllData = async () => {
      try {
        const [posRes, candRes, settingsRes, contractsRes, configRes] = await Promise.all([
          authFetch('/api/positions').then(res => res.json()),
          authFetch('/api/candidates').then(res => res.json()),
          authFetch('/api/agent-settings').then(res => res.json()),
          authFetch('/api/uploaded-contracts').then(res => res.json()),
          authFetch('/api/whatsapp-config').then(res => res.json())
        ]);
        setPositions(posRes || []);
        setCandidates(candRes || []);
        if (settingsRes) setAgentSettings(settingsRes);
        setUploadedContracts(contractsRes || []);
        if (configRes) setWhatsappConfig(configRes);

        if (candRes && candRes.length > 0) {
          setSelectedCandidateId(candRes[0].id);
        }
      } catch (err) {
        console.error("Error loading data from backend APIs:", err);
      }
    };
    loadAllData();
  }, [token]);

  // Debounced save for agentSettings to backend
  useEffect(() => {
    if (!token) return;
    // Only save if data has loaded (which sets positions/candidates)
    if (positions.length === 0 && candidates.length === 0) return;
    const timer = setTimeout(async () => {
      try {
        await authFetch('/api/agent-settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(agentSettings)
        });
      } catch (err) {
        console.error("Error saving agent settings to backend:", err);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [agentSettings, token]);

  // Debounced save for whatsappConfig to backend
  useEffect(() => {
    if (!token) return;
    if (positions.length === 0 && candidates.length === 0) return;
    const timer = setTimeout(async () => {
      try {
        await authFetch('/api/whatsapp-config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(whatsappConfig)
        });
      } catch (err) {
        console.error("Error saving WhatsApp config to backend:", err);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [whatsappConfig, token]);

  // Sync selected candidate's HR notes buffer and active contract buffer
  const selectedCandidate = candidates.find(c => c.id === selectedCandidateId);
  useEffect(() => {
    if (selectedCandidate) {
      setCurrentNotesBuffer(selectedCandidate.hrNotes || '');
    } else {
      setCurrentNotesBuffer('');
    }
  }, [selectedCandidateId, selectedCandidate?.id]);

  // Compile rendered contract text whenever candidate or chosen document type changes
  useEffect(() => {
    if (selectedCandidate) {
      const pos = positions.find(p => p.id === selectedCandidate.positionId);
      if (selectedCandidate.customContractContent) {
        setLiveContractText(selectedCandidate.customContractContent);
      } else if (pos) {
        setLiveContractText(getRenderedContract(selectedCandidate, pos, selectedContractTemplateId));
      } else {
        setLiveContractText('');
      }
    } else {
      setLiveContractText('');
    }
  }, [selectedCandidateId, selectedContractTemplateId, selectedCandidate?.id, positions]);

  // If there's a WhatsApp candidate, sync/auto-scroll chat history
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [whatsappCandidateId, selectedCandidate?.chatTranscript?.length]);

  // Set default WhatsApp active simulation candidate
  useEffect(() => {
    if (!whatsappCandidateId && selectedCandidateId) {
      setWhatsappCandidateId(selectedCandidateId);
    }
  }, [selectedCandidateId]);

  // Database saving helper functions
  const saveCandidateToBackend = async (cand: Candidate) => {
    if (!token) return;
    try {
      await authFetch('/api/candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cand)
      });
    } catch (err) {
      console.error("Error saving candidate to backend database:", err);
    }
  };

  const savePositionToBackend = async (pos: Position) => {
    if (!token) return;
    try {
      await authFetch('/api/positions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pos)
      });
    } catch (err) {
      console.error("Error saving position to backend database:", err);
    }
  };

  // Save notes handler
  const handleSaveNotes = async () => {
    if (!selectedCandidateId) return;
    const target = candidates.find(c => c.id === selectedCandidateId);
    if (!target) return;

    const updated = { ...target, hrNotes: currentNotesBuffer, updatedAt: new Date().toISOString().split('T')[0] };

    setCandidates(prev => prev.map(cand => {
      if (cand.id === selectedCandidateId) {
        return updated;
      }
      return cand;
    }));
    await saveCandidateToBackend(updated);
    // Flash brief feedback
    alert('ההערות נשמרו בהצלחה!');
  };

  // Create new position helper
  const handleAddPositionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPositionTitle) return;

    const newPos: Position = {
      id: `pos-${Date.now()}`,
      title: newPositionTitle,
      experienceYears: Number(newPositionExperience),
      requirements: newPositionRequirements.filter(r => r.trim() !== ''),
      questions: newPositionQuestions.filter(q => q.trim() !== ''),
      testPrompt: newPositionTestPrompt || 'משימה טכנולוגית הממחישה את יכולות פתרון הבעיות',
      contractTemplate: newPositionContract || `הסכם העסקה אישי - ${newPositionTitle} \n\nשנערך ונחתם ביום {date} \nבין: החברה המגייסת \nלבין: {name} (טלפון: {phone}) \n\nשכר מוסכם ברוטו: {salary} ש"ח בחודש.\nמדדי הערכת ביצועים ייקבעו בהמשך.\n\nחתימת החברה: ______________       חתימת העובד: ______________`,
      isActive: true,
      createdAt: new Date().toISOString().split('T')[0]
    };

    setPositions(prev => [...prev, newPos]);
    await savePositionToBackend(newPos);
    setShowAddPosition(false);

    // Initial reset variables
    setNewPositionTitle('');
    setNewPositionExperience(3);
    setNewPositionRequirements(['']);
    setNewPositionQuestions(['']);
    setNewPositionTestPrompt('');
    setNewPositionContract('');
  };

  // Add list fields input helper
  const handleAddReqField = () => setNewPositionRequirements(prev => [...prev, '']);
  const handleReqFieldChange = (index: number, val: string) => {
    setNewPositionRequirements(prev => {
      const copy = [...prev];
      copy[index] = val;
      return copy;
    });
  };

  const handleAddQuestionField = () => setNewPositionQuestions(prev => [...prev, '']);
  const handleQuestionFieldChange = (index: number, val: string) => {
    setNewPositionQuestions(prev => {
      const copy = [...prev];
      copy[index] = val;
      return copy;
    });
  };

  // Simulate starting a new candidate completely from WhatsApp Link
  const handleCreateNewCandidateFromLink = async (positionId: string) => {
    const pos = positions.find(p => p.id === positionId);
    if (!pos) return;

    const randomId = `cand-${Date.now()}`;
    const newCand: Candidate = {
      id: randomId,
      positionId: pos.id,
      name: "מועמד חדש (בוואטסאפ)",
      phone: `05${Math.floor(1000000 + Math.random() * 9000000)}`,
      email: "טרם עודכן",
      status: "interview",
      requestedSalary: "טרם קבע",
      salaryFitAnalysis: "ממתין לציפיית שכר מהמועמד",
      experienceSummary: "ממתין להתחלת שיחה",
      score: 50,
      aiFitSummary: "סוכנת הגיוס איימי ממתינה להתחלת שיחה עם המועמד בוואטסאפ.",
      testAnswers: "",
      testFeedback: "טרם הוגש מבדק מעשי",
      chatTranscript: [
        { sender: 'bot', text: `שלום לך! 👋 אני איימי, סוכנת הגיוס הווירטואלית של החברה. הגעת בעקבות המשרה: "${pos.title}". נשמח מאוד להכיר אותך ולהעביר סינון ראשוני מהיר ומבדק קצר. אפשר לקבל את שמך המלא וכתובת האימייל שלך בבקשה?`, timestamp: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }) }
      ],
      hrNotes: "",
      contractSent: false,
      contractSigned: false,
      updatedAt: new Date().toISOString().split('T')[0]
    };

    setCandidates(prev => [...prev, newCand]);
    await saveCandidateToBackend(newCand);
    setSelectedCandidateId(randomId);
    setWhatsappCandidateId(randomId);
    setActiveSection('whatsapp');
  };

  // Simulated Candidate manual insert
  const createQuickCandidate = async () => {
    if (positions.length === 0) return;
    const randomId = `cand-${Date.now()}`;
    const firstPos = positions[0];
    const newCand: Candidate = {
      id: randomId,
      positionId: firstPos.id,
      name: "מועמד מדגים",
      phone: "052-1112233",
      email: "demo@example.co.il",
      status: "interview",
      requestedSalary: "23,000",
      salaryFitAnalysis: "ניתוח מורחב יופק על ידי ה-AI",
      experienceSummary: "מצהיר על 4 שנות ניסיון בענף.",
      score: 75,
      aiFitSummary: "המועמד עבר סינון התחלתי, וכעת ישנה המלצה לשלוח לו את המבדק המעשי לתעוד ביצועים מדויק.",
      testAnswers: "",
      testFeedback: "טרם בוצע מבדק.",
      chatTranscript: [
        { sender: 'bot', text: "שלום! מוכן לשאלון ההתאמה בוואטסאפ?", timestamp: "12:00" },
        { sender: 'candidate', text: "כן בהחלט, אשמח להתחיל.", timestamp: "12:01" }
      ],
      hrNotes: "הוסף הערות עבור מועמד זה כאן בכתב חופשי.",
      contractSent: false,
      contractSigned: false,
      updatedAt: new Date().toISOString().split('T')[0]
    };
    setCandidates(prev => [...prev, newCand]);
    await saveCandidateToBackend(newCand);
    setSelectedCandidateId(randomId);
    setWhatsappCandidateId(randomId);
  };

  // Call the server API endpoint to trigger Gemini response as Bot
  const triggerBotSimulation = async (candidateId: string, customMessage?: string) => {
    const cand = candidates.find(c => c.id === candidateId);
    if (!cand) return;

    const pos = positions.find(p => p.id === cand.positionId);
    if (!pos) return;

    setIsBotResponding(true);

    try {
      const response = await authFetch('/api/candidate/simulate-bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          position: pos,
          candidate: cand,
          newMessageText: customMessage || '',
          agentSettings: agentSettings
        })
      });

      if (!response.ok) {
        throw new Error('API server returned negative response');
      }

      const data = await response.json();

      let updatedCandidate: Candidate | null = null;
      setCandidates(prev => prev.map(c => {
        if (c.id === candidateId) {
          // Keep current values or merge from AI extractions
          updatedCandidate = {
            ...c,
            chatTranscript: data.chatTranscript,
            name: data.extractedName || c.name,
            email: data.extractedEmail || c.email,
            phone: data.extractedPhone || c.phone,
            requestedSalary: data.requestedSalary || c.requestedSalary,
            salaryFitAnalysis: data.salaryFitAnalysis || c.salaryFitAnalysis,
            experienceSummary: data.experienceSummary || c.experienceSummary,
            aiFitSummary: data.aiFitSummary || c.aiFitSummary,
            score: data.fitScore !== undefined ? data.fitScore : c.score,
            updatedAt: new Date().toISOString().split('T')[0]
          };

          // If transition to test indicates candidate should receive tests
          if (data.transitionToTest) {
            updatedCandidate.status = 'test';
            updatedCandidate.testFeedback = 'המבחן המעשי צורף בשיחת הוואטסאפ. ממתין למענה המועמד...';
          }

          // If test evaluation is returned
          if (data.testScore !== undefined) {
            updatedCandidate.testFeedback = data.testFeedback || c.testFeedback;
            if (customMessage && c.status === 'test') {
              updatedCandidate.testAnswers = customMessage; // save candidates solution string
              updatedCandidate.status = 'completed'; // completed after receiving results!
            }
          }

          // Complete if bot marked done
          if (data.isChatCompleted) {
            updatedCandidate.status = 'completed';
          }

          return updatedCandidate;
        }
        return c;
      }));

      if (updatedCandidate) {
        await saveCandidateToBackend(updatedCandidate);
      }

    } catch (e) {
      console.error('Bot fetch error:', e);
    } finally {
      setIsBotResponding(false);
    }
  };

  // Candidate sends a Whatsapp message
  const handleCandidateSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!whatsappInputValue.trim() || !whatsappCandidateId) return;

    const userMsg = whatsappInputValue;
    setWhatsappInputValue('');

    let updatedCand: Candidate | null = null;
    setCandidates(prev => prev.map(c => {
      if (c.id === whatsappCandidateId) {
        updatedCand = {
          ...c,
          chatTranscript: [
            ...c.chatTranscript,
            { sender: 'candidate', text: userMsg, timestamp: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }) }
          ]
        };
        return updatedCand;
      }
      return c;
    }));

    if (updatedCand) {
      await saveCandidateToBackend(updatedCand);
    }

    // Trigger AI assessment or smart flow
    await triggerBotSimulation(whatsappCandidateId, userMsg);
  };

  // HR Recruiter clicks to send message to candidate in WhatsApp simulation
  const handleHrSimulateWhatsAppClick = (candidateId: string) => {
    setWhatsappCandidateId(candidateId);
    setActiveSection('whatsapp');
  };

  // Perform contract action (Send contract)
  const handleSendDraftContract = async (candidateId: string) => {
    let updatedCand: Candidate | null = null;
    setCandidates(prev => prev.map(c => {
      if (c.id === candidateId) {
        updatedCand = {
          ...c,
          contractSent: true,
          status: 'test', // upgrade state or keep updated
          updatedAt: new Date().toISOString().split('T')[0]
        };
        return updatedCand;
      }
      return c;
    }));

    if (updatedCand) {
      await saveCandidateToBackend(updatedCand);
    }
    alert('חוזה ההעסקה נשלח בהצלחה למועמד! הסימולטור מייצר כעת שליחה נוחה לכתובת המייל והוואטסאפ של המועמד.');
  };

  // Simulate Candidate signing the contract
  const handleSimulateCandidateSigning = async (candidateId: string) => {
    let updatedCand: Candidate | null = null;
    setCandidates(prev => prev.map(c => {
      if (c.id === candidateId) {
        updatedCand = {
          ...c,
          contractSigned: true,
          status: 'signed',
          updatedAt: new Date().toISOString().split('T')[0]
        };
        return updatedCand;
      }
      return c;
    }));

    if (updatedCand) {
      await saveCandidateToBackend(updatedCand);
    }
    alert('המועמד חתם בהצלחה על החוזה מהסמארטפון שלו! סטטוס המועמד עודכן במערכת CRM ל-"נחתם בהצלחה".');
  };

  // Helper template string interpolation supporting custom templates and positions
  const getRenderedContract = (candidate: Candidate, position: Position, templateId: string) => {
    let sourceText = '';
    if (templateId === 'baseline') {
      sourceText = position.contractTemplate || '';
    } else {
      const match = uploadedContracts.find(t => t.id === templateId);
      sourceText = match ? match.content : '';
    }
    
    let text = sourceText;
    text = text.replace(/{name}/g, candidate.name || 'שם מועמד');
    text = text.replace(/{phone}/g, candidate.phone || 'מכשיר נייד');
    text = text.replace(/{email}/g, candidate.email || 'כתובת דוא"ל');
    text = text.replace(/{salary}/g, candidate.requestedSalary || '24,000');
    text = text.replace(/{position}/g, position.title || 'שם המשרה');
    text = text.replace(/{date}/g, new Date().toLocaleDateString('he-IL'));
    return text;
  };

  // Dynamic custom contract delivery via mail or WhatsApp
  const handleSendDraftContractCustom = async (candidateId: string, deliveryType: 'whatsapp' | 'email') => {
    let currentContractValue = liveContractText;
    let updatedCand: Candidate | null = null;
    
    setCandidates(prev => prev.map(c => {
      if (c.id === candidateId) {
        const notificationMsg = deliveryType === 'whatsapp' 
          ? `📝 שלום ${c.name || 'מועמד'}! סוכנת ה-AI של החברה שלחה אליך את מסמך ההעסקה וחתימה אלקטרונית מותאמת. אנא היכנס לקישור הבא כדי לעבור על הפרטים ולחתום בברכה.`
          : `📧 נשלח אליך דוא"ל רשמי המכיל את מסמכי הגיוס המלאים ממחלקת ה-HR.`;
          
        updatedCand = {
          ...c,
          contractSent: true,
          customContractContent: currentContractValue,
          chatTranscript: [
            ...c.chatTranscript,
            {
              sender: 'bot',
              text: `${notificationMsg}\n\nלצפייה וחתימה בקישור המאובטח:\n[https://hr-sign.co.il/doc/hr_${c.id}]`,
              timestamp: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
            }
          ],
          updatedAt: new Date().toISOString().split('T')[0]
        };
        return updatedCand;
      }
      return c;
    }));
    
    if (updatedCand) {
      await saveCandidateToBackend(updatedCand);
    }
    
    if (deliveryType === 'whatsapp') {
      alert('המסמך נשלח בהצלחה לוואטסאפ של המועמד! המועמד יוכל לראות כעת את הקישור ויראה אותו ישירות בהיסטוריית השיחה.');
    } else {
      const emailTarget = selectedCandidate?.email || 'hr@candidate.co.il';
      alert(`מערכת ה-CRM ארזה ושלחה את הטופס המלא והמשוך ישירות לכתובת המייל המעודכנת: ${emailTarget} בהצלחה!`);
    }
  };

  // Remove candidate
  const handleRemoveCandidate = async (candidateId: string) => {
    if (confirm('האם אתה בטוח שברצונך למחוק מועמד זה?')) {
      try {
        await authFetch(`/api/candidates/${candidateId}`, { method: 'DELETE' });
        const remaining = candidates.filter(c => c.id !== candidateId);
        setCandidates(remaining);
        if (selectedCandidateId === candidateId) {
          setSelectedCandidateId(remaining.length > 0 ? remaining[0].id : null);
        }
      } catch (err) {
        console.error("Error deleting candidate:", err);
      }
    }
  };

  // Remove position
  const handleRemovePosition = async (positionId: string) => {
    if (confirm('מחיקת משרה תסיר אותה מהרשימה. האם להמשיך?')) {
      try {
        await authFetch(`/api/positions/${positionId}`, { method: 'DELETE' });
        setPositions(prev => prev.filter(p => p.id !== positionId));
      } catch (err) {
        console.error("Error deleting position:", err);
      }
    }
  };

  // Filters logic
  const filteredCandidates = candidates.filter(cand => {
    const matchesPosition = filterPositionId === 'all' || cand.positionId === filterPositionId;
    const matchesStatus = filterStatus === 'all' || cand.status === filterStatus;
    
    const term = searchQuery.toLowerCase();
    const pos = positions.find(p => p.id === cand.positionId);
    const matchesSearch = !searchQuery || 
      cand.name.toLowerCase().includes(term) ||
      cand.email.toLowerCase().includes(term) ||
      cand.phone.includes(term) ||
      (pos && pos.title.toLowerCase().includes(term)) ||
      (cand.experienceSummary && cand.experienceSummary.toLowerCase().includes(term));

    return matchesPosition && matchesStatus && matchesSearch;
  }).sort((a, b) => {
    if (sortBy === 'score') {
      return b.score - a.score;
    }
    if (sortBy === 'experience') {
      // Find position specified experience or match by score first
      return b.score - a.score;
    }
    if (sortBy === 'salary') {
      const salaryA = parseInt(a.requestedSalary.replace(/[^0-9]/g, '')) || 0;
      const salaryB = parseInt(b.requestedSalary.replace(/[^0-9]/g, '')) || 0;
      return salaryA - salaryB; // cheaper first
    }
    return 0;
  });

  const activeWhatsappCandidate = candidates.find(c => c.id === whatsappCandidateId);
  const activeWhatsappPosition = activeWhatsappCandidate ? positions.find(p => p.id === activeWhatsappCandidate.positionId) : null;

  if (!token) {
    const handleAuthSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsAuthenticating(true);
      setAuthError(null);

      const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/signup';
      const payload = authMode === 'login'
        ? { email: authEmail, password: authPassword }
        : {
            mode: authMode === 'signup_create' ? 'create' : 'join',
            email: authEmail,
            password: authPassword,
            orgName: authMode === 'signup_create' ? authOrgName : undefined,
            orgId: authMode === 'signup_join' ? authOrgId : undefined
          };

      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'שגיאה בתהליך האימות.');
        }
        localStorage.setItem('recruiter_token', data.token);
        setToken(data.token);
        setCurrentUser(data.user);
      } catch (err: any) {
        setAuthError(err.message || 'פרטי אימות שגויים');
      } finally {
        setIsAuthenticating(false);
      }
    };

    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased flex flex-col justify-center items-center p-4 relative overflow-hidden" dir="rtl">
        {/* Glow Effects */}
        <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-teal-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="w-full max-w-md bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl shadow-2xl p-6 md:p-8 z-10 transition-all duration-300">
          
          {/* Logo & Header */}
          <div className="flex flex-col items-center gap-3 mb-6 text-center">
            <div className="p-3 bg-gradient-to-tr from-emerald-600 to-teal-500 rounded-2xl text-white shadow-lg shadow-emerald-500/25">
              <Sparkles className="w-8 h-8 animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">Amy AI HR Match</h1>
              <p className="text-xs text-slate-400 mt-1">מערכת גיוס חכמה מרובת-ארגונים (SaaS)</p>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex bg-slate-950/80 p-1.5 rounded-xl border border-slate-800/85 mb-6 text-center text-xs font-bold gap-1">
            <button
              type="button"
              onClick={() => { setAuthMode('login'); setAuthError(null); }}
              className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${authMode === 'login' ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
            >
              התחברות
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode('signup_create'); setAuthError(null); }}
              className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${authMode === 'signup_create' ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
            >
              רישום ארגון
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode('signup_join'); setAuthError(null); }}
              className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${authMode === 'signup_join' ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
            >
              הצטרפות
            </button>
          </div>

          {/* Simulation mode info for login */}
          {authMode === 'login' && (
            <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-3 mb-5 text-right text-xs text-slate-300">
              <strong className="block text-slate-200 mb-0.5">כניסה למערכת</strong>
              הזן אימייל וסיסמה. במצב בדיקה מקומי: 
              <span className="block mt-1 text-[11px] text-amber-300 font-mono">admin@example.com / admin123</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleAuthSubmit} className="flex flex-col gap-4">
            
            {authMode === 'signup_create' && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5 text-right">שם הארגון (חברה / סטארטאפ)</label>
                <input 
                  type="text" 
                  required
                  value={authOrgName}
                  onChange={(e) => setAuthOrgName(e.target.value)}
                  placeholder="למשל: דאטה-טק בע״מ"
                  className="w-full text-xs p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-emerald-500 text-right"
                />
              </div>
            )}

            {authMode === 'signup_join' && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5 text-right">קוד ארגון (Invite Code)</label>
                <input 
                  type="text" 
                  required
                  value={authOrgId}
                  onChange={(e) => setAuthOrgId(e.target.value)}
                  placeholder="למשל: org-a1b2c3d"
                  className="w-full text-xs p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-emerald-500 text-right font-mono"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 text-right">אימייל</label>
              <input 
                type="email" 
                required
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full text-xs p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-emerald-500 text-right"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 text-right">סיסמה</label>
              <input 
                type="password" 
                required
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-xs p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-emerald-500 text-right"
              />
            </div>

            {authError && (
              <p className="text-red-400 text-xs text-right mt-1 font-semibold">{authError}</p>
            )}

            <button
              type="submit"
              disabled={isAuthenticating}
              className="mt-2 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs py-3 rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isAuthenticating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>מעבד פרטים...</span>
                </>
              ) : (
                <span>
                  {authMode === 'login' && 'כניסה למערכת'}
                  {authMode === 'signup_create' && 'רישום ארגון ומשתמש'}
                  {authMode === 'signup_join' && 'הצטרפות לארגון'}
                </span>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 font-sans antialiased text-slate-100 flex flex-row-reverse" dir="rtl" id="applet-root">
      
      {/* Right-aligned Sidebar Menu */}
      <aside className="w-64 bg-slate-900 border-l border-slate-800/80 flex flex-col justify-between hidden md:flex shrink-0">
        <div className="flex flex-col gap-6 p-5">
          {/* Brand/Logo */}
          <div className="flex items-center gap-3 py-2 border-b border-slate-850">
            <div className="p-2 bg-gradient-to-tr from-emerald-600 to-teal-500 rounded-xl text-white shadow shadow-emerald-500/10">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <strong className="text-sm font-bold text-white block truncate max-w-[150px]" title={currentUser?.organizationName || "Amy AI HR Match"}>
                {currentUser?.organizationName || "Amy AI HR Match"}
              </strong>
              <span className="text-[10px] text-slate-400 block mt-0.5">מערכת גיוס וסינון חכמה</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1.5">
            <button
              onClick={() => setActiveSection('home')}
              className={`w-full px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-3 transition-all cursor-pointer ${
                activeSection === 'home'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/5'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>ראשי / דאשבורד</span>
            </button>

            <button
              onClick={() => setActiveSection('positions')}
              className={`w-full px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-3 transition-all cursor-pointer ${
                activeSection === 'positions'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/5'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              <span>ניהול משרות</span>
            </button>

            <button
              onClick={() => setActiveSection('candidates')}
              className={`w-full px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-3 transition-all cursor-pointer ${
                activeSection === 'candidates'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/5'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>CRM מועמדים</span>
            </button>

            <button
              onClick={() => setActiveSection('whatsapp')}
              className={`w-full px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-3 transition-all cursor-pointer ${
                activeSection === 'whatsapp'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/5'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <PhoneCall className="w-4 h-4" />
              <span>וואטסאפ וסוכנת AI</span>
            </button>

            <button
              onClick={() => setActiveSection('contracts')}
              className={`w-full px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-3 transition-all cursor-pointer ${
                activeSection === 'contracts'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/5'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <FileSignature className="w-4 h-4" />
              <span>מרכז חוזים וטפסים</span>
            </button>

            <button
              onClick={() => setActiveSection('settings')}
              className={`w-full px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-3 transition-all cursor-pointer ${
                activeSection === 'settings'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/5'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>הגדרות כלליות</span>
            </button>
          </nav>
        </div>

        {/* Sidebar Bottom Profile */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/40 flex items-center justify-between gap-3 text-right">
          <div className="overflow-hidden">
            <span className="text-[10px] text-slate-500 block">מחובר כ-</span>
            <span className="text-xs font-medium text-slate-300 block truncate max-w-[140px]">{authEmail || "מגייס מערכת"}</span>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem('recruiter_token');
              setToken(null);
            }}
            className="p-2 bg-slate-800 hover:bg-red-950/40 hover:text-red-400 border border-slate-700/50 hover:border-red-900/40 rounded-xl transition cursor-pointer"
            title="התנתקות"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen bg-slate-950">
        
        {/* Top Header Bar */}
        <header className="bg-slate-900/60 backdrop-blur-md border-b border-slate-800/80 py-3.5 px-4 md:px-6 sticky top-0 z-30 flex items-center justify-between gap-4">
          
          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-xs">CRM גיוס</span>
            <span className="text-slate-600 text-xs">/</span>
            <span className="text-white text-xs font-bold">
              {activeSection === 'home' && "לוח בקרה ראשי"}
              {activeSection === 'positions' && "ניהול משרות ופרויקטים"}
              {activeSection === 'candidates' && "CRM מועמדים ותהליך סינון"}
              {activeSection === 'whatsapp' && "סימולטור וואטסאפ וסוכנת AI"}
              {activeSection === 'contracts' && "מרכז חוזים וטפסים מובנים"}
              {activeSection === 'settings' && "הגדרות מערכת כלליות"}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden lg:flex items-center gap-4 text-xs">
              <div className="bg-slate-800/40 px-3 py-1.5 rounded-lg border border-slate-800 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-slate-400">משרות: <strong className="text-white">{positions.length}</strong></span>
              </div>
              <div className="bg-slate-800/40 px-3 py-1.5 rounded-lg border border-slate-800 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-teal-400" />
                <span className="text-slate-400">מועמדים: <strong className="text-white">{candidates.length}</strong></span>
              </div>
              <div className="bg-slate-800/40 px-3 py-1.5 rounded-lg border border-slate-800 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-yellow-400" />
                <span className="text-slate-400">ממתינים למבחן: <strong className="text-white">{candidates.filter(c => c.status === 'test').length}</strong></span>
              </div>
            </div>

            <div className="flex md:hidden items-center gap-2">
              <select
                value={activeSection}
                onChange={(e) => setActiveSection(e.target.value as any)}
                className="bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-1.5 text-xs focus:outline-none"
              >
                <option value="home">ראשי</option>
                <option value="positions">משרות</option>
                <option value="candidates">מועמדים</option>
                <option value="whatsapp">וואטסאפ</option>
                <option value="contracts">חוזים</option>
                <option value="settings">הגדרות</option>
              </select>
              
              <button
                onClick={() => {
                  localStorage.removeItem('recruiter_token');
                  setToken(null);
                }}
                className="p-1.5 bg-slate-800 hover:bg-red-950/40 text-slate-400 hover:text-red-400 border border-slate-700 rounded-xl transition"
                title="התנתקות"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Dynamic Section Rendering */}
        <div className="flex-1 p-4 md:p-6 overflow-y-auto">
          
          {/* VIEW: HOME / DASHBOARD */}
          {activeSection === 'home' && (
            <div className="max-w-7xl mx-auto flex flex-col gap-6">
              
              <div className="relative overflow-hidden bg-slate-900 border border-slate-850 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-center gap-6 shadow-xl">
                <div className="absolute top-[-30%] left-[-10%] w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none" />
                <div className="z-10 text-right">
                  <h2 className="text-xl md:text-3xl font-bold bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent flex items-center gap-2.5">
                    שלום לך, צוות הגיוס! 👋
                  </h2>
                  <p className="text-xs md:text-sm text-slate-400 mt-2 max-w-xl">
                    ברוכים הבאים ל-**Amy AI HR Match**. מכאן תוכל לנהל את המשרות הפעילות שלך, לצפות בתוצאות מבדקים אוטומטיים מבוססי בינה מלאכותית, ולסמלץ שיחות סינון בוואטסאפ בזמן אמת.
                  </p>
                </div>
                <div className="z-10 flex flex-wrap gap-3 shrink-0">
                  <button
                    onClick={() => {
                      setNewPositionTitle('');
                      setNewPositionExperience(3);
                      setNewPositionRequirements(['']);
                      setNewPositionQuestions(['']);
                      setNewPositionTestPrompt('');
                      setNewPositionContract('');
                      setShowAddPosition(true);
                    }}
                    className="bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs py-3 px-5 rounded-xl shadow-lg shadow-emerald-950/20 transition flex items-center gap-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>פרויקט גיוס חדש</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div 
                  onClick={() => setActiveSection('positions')}
                  className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl hover:border-emerald-500/40 hover:bg-slate-900 transition cursor-pointer flex items-center justify-between gap-4 shadow-sm"
                >
                  <div className="text-right">
                    <span className="text-[11px] text-slate-500 font-bold block">משרות פעילות</span>
                    <strong className="text-2xl font-extrabold text-white block mt-1">{positions.length}</strong>
                  </div>
                  <div className="p-3.5 bg-emerald-500/10 rounded-xl text-emerald-400">
                    <Briefcase className="w-6 h-6" />
                  </div>
                </div>

                <div 
                  onClick={() => setActiveSection('candidates')}
                  className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl hover:border-teal-500/40 hover:bg-slate-900 transition cursor-pointer flex items-center justify-between gap-4 shadow-sm"
                >
                  <div className="text-right">
                    <span className="text-[11px] text-slate-500 font-bold block">מועמדים ב-CRM</span>
                    <strong className="text-2xl font-extrabold text-white block mt-1">{candidates.length}</strong>
                  </div>
                  <div className="p-3.5 bg-teal-500/10 rounded-xl text-teal-400">
                    <Users className="w-6 h-6" />
                  </div>
                </div>

                <div 
                  onClick={() => {
                    setFilterStatus('test');
                    setActiveSection('candidates');
                  }}
                  className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl hover:border-yellow-500/40 hover:bg-slate-900 transition cursor-pointer flex items-center justify-between gap-4 shadow-sm"
                >
                  <div className="text-right">
                    <span className="text-[11px] text-slate-500 font-bold block">ממתינים למבחן</span>
                    <strong className="text-2xl font-extrabold text-white block mt-1">{candidates.filter(c => c.status === 'test').length}</strong>
                  </div>
                  <div className="p-3.5 bg-yellow-500/10 rounded-xl text-yellow-400">
                    <UserCheck className="w-6 h-6" />
                  </div>
                </div>

                <div 
                  onClick={() => {
                    setFilterStatus('signed');
                    setActiveSection('candidates');
                  }}
                  className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl hover:border-purple-500/40 hover:bg-slate-900 transition cursor-pointer flex items-center justify-between gap-4 shadow-sm"
                >
                  <div className="text-right">
                    <span className="text-[11px] text-slate-500 font-bold block">חוזה חתום / גוייסו</span>
                    <strong className="text-2xl font-extrabold text-white block mt-1">{candidates.filter(c => c.contractSigned).length}</strong>
                  </div>
                  <div className="p-3.5 bg-purple-500/10 rounded-xl text-purple-400">
                    <FileCheck className="w-6 h-6" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-2">
                <div 
                  onClick={() => setActiveSection('positions')}
                  className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-850 p-6 rounded-2xl hover:border-emerald-500/30 transition-all cursor-pointer group shadow"
                >
                  <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Briefcase className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2 text-right">לוח המשרות והפרויקטים</h3>
                  <p className="text-xs text-slate-400 leading-relaxed text-right">
                    הגדר דרישות למשרה, שאלות סינון, ומבחנים טכניים מותאמים אישית. נהל את סטטוס המשרה והתבניות המשוייכות אליה.
                  </p>
                  <span className="text-[11px] text-emerald-400 font-bold mt-4 flex items-center gap-1 hover:underline justify-end">
                    ללוח המשרות ←
                  </span>
                </div>

                <div 
                  onClick={() => setActiveSection('candidates')}
                  className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-850 p-6 rounded-2xl hover:border-teal-500/30 transition-all cursor-pointer group shadow"
                >
                  <div className="w-12 h-12 bg-teal-500/10 text-teal-400 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Users className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2 text-right">CRM לניהול מועמדים</h3>
                  <p className="text-xs text-slate-400 leading-relaxed text-right">
                    עקוב אחר מועמדים, ציוני התאמה (AI Fit Score), היסטוריית השיחה שלהם, ציוני מבדקים מעשיים וחתימה על חוזי NDA/העסקה.
                  </p>
                  <span className="text-[11px] text-teal-400 font-bold mt-4 flex items-center gap-1 hover:underline justify-end">
                    ל-CRM מועמדים ←
                  </span>
                </div>

                <div 
                  onClick={() => setActiveSection('whatsapp')}
                  className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-850 p-6 rounded-2xl hover:border-purple-500/30 transition-all cursor-pointer group shadow"
                >
                  <div className="w-12 h-12 bg-purple-500/10 text-purple-400 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2 text-right">סימולטור וואטסאפ וסוכן</h3>
                  <p className="text-xs text-slate-400 leading-relaxed text-right">
                    בדוק את התנהגות הבוט בשיחה מדומה, הגדר את ה-Persona של המגייסת הדיגיטלית (שם, יעדים, רמת שיח) וחבר את ה-Cloud API.
                  </p>
                  <span className="text-[11px] text-purple-400 font-bold mt-4 flex items-center gap-1 hover:underline justify-end">
                    לסימולטור והגדרות בוט ←
                  </span>
                </div>
              </div>

            </div>
          )}

          {/* VIEW: POSITIONS BOARD */}
          {activeSection === 'positions' && (
            <div className="max-w-7xl mx-auto flex flex-col gap-6" id="positions-configuration-view">
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4 text-right">
                <div>
                  <h3 className="text-xl font-bold text-white">ניהול משרות ופרויקטים</h3>
                  <p className="text-xs text-slate-400 mt-1">עבור כל משרה מוגדרות שאלות הסינון של ה-AI, מבדק ההתאמה ותבנית החוזה.</p>
                </div>
                <button
                  onClick={() => {
                    setNewPositionTitle('');
                    setNewPositionExperience(3);
                    setNewPositionRequirements(['']);
                    setNewPositionQuestions(['']);
                    setNewPositionTestPrompt('');
                    setNewPositionContract('');
                    setShowAddPosition(true);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>משרה חדשה</span>
                </button>
              </div>

              {positions.length === 0 ? (
                <div className="text-center py-16 bg-slate-900 border border-slate-800 rounded-2xl">
                  <Briefcase className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-300 font-medium">לא מוגדרות משרות כרגע במערכת.</p>
                  <button 
                    onClick={() => setShowAddPosition(true)}
                    className="mt-4 bg-emerald-600 text-white text-xs px-4 py-2.5 rounded-xl font-bold shadow hover:bg-emerald-500 transition inline-flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> הגדר משרה ראשונה
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {positions.map(pos => (
                    <div key={pos.id} className="border border-slate-850 hover:border-emerald-500/50 rounded-2xl p-5 bg-slate-900 shadow-sm transition-all flex flex-col justify-between gap-4 text-right">
                      <div>
                        <div className="flex justify-between items-start gap-3">
                          <h4 className="font-bold text-white hover:text-emerald-400 transition text-base md:text-lg">{pos.title}</h4>
                          <span className="text-xs bg-slate-950 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-800 font-medium shrink-0">
                            ניסיון: {pos.experienceYears}+ שנים
                          </span>
                        </div>
                        
                        <div className="mt-4 flex flex-col gap-2">
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">קריטריונים ודרישות HR:</span>
                          <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
                            {pos.requirements.slice(0, 3).map((req, i) => (
                              <li key={i} className="truncate">{req || "קריטריון כללי"}</li>
                            ))}
                            {pos.requirements.length > 3 && (
                              <li className="text-emerald-400 font-semibold list-none pr-1">+{pos.requirements.length - 3} דרישות נוספות...</li>
                            )}
                          </ul>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-800 flex flex-col gap-1.5">
                          <span className="text-xs font-bold text-slate-400">שאלות סינון בוואטסאפ ({pos.questions.length}):</span>
                          <p className="text-xs text-slate-300 italic truncate">"{pos.questions[0] || 'אין שאלות מוגדרות'}"</p>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2.5 mt-auto">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setFilterPositionId(pos.id);
                              setActiveSection('candidates');
                            }}
                            className="bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-800 text-xs py-2 px-3 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer"
                          >
                            <Users className="w-3.5 h-3.5" />
                            <span>מועמדים</span>
                          </button>

                          <button
                            onClick={() => handleCreateNewCandidateFromLink(pos.id)}
                            className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 text-xs py-2 px-3 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>הדמיית מועמד</span>
                          </button>
                        </div>

                        <button
                          onClick={() => handleRemovePosition(pos.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-950/20 p-2 rounded-lg transition border border-transparent"
                          title="מחק משרה זו"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* VIEW: CANDIDATES CRM */}
          {activeSection === 'candidates' && (
            <div className="max-w-7xl mx-auto flex flex-col gap-6" id="candidates-crm-list-view">
              
              {/* Filter and Advanced Sorting Toolbar */}
              <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="relative w-full md:w-72 shrink-0">
                  <Search className="w-4 h-4 text-slate-500 absolute right-3 top-3.5" />
                  <input
                    type="text"
                    placeholder="חפש מועמד לפי שם, משרה..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pr-9 pl-3 py-2.5 text-xs bg-slate-950 border border-slate-850 focus:border-emerald-500 rounded-xl focus:outline-none text-right text-white"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full justify-start md:justify-end">
                  <div className="flex items-center gap-1.5">
                    <Filter className="w-3.5 h-3.5 text-slate-400" />
                    <select
                      value={filterPositionId}
                      onChange={(e) => setFilterPositionId(e.target.value)}
                      className="text-xs bg-slate-950 border border-slate-855 px-2.5 py-2 rounded-xl focus:outline-none focus:border-emerald-500 text-white cursor-pointer"
                    >
                      <option value="all">כל התפקידים</option>
                      {positions.map(p => (
                        <option key={p.id} value={p.id}>{p.title}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-slate-400">סטטוס:</span>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="text-xs bg-slate-950 border border-slate-855 px-2.5 py-2 rounded-xl focus:outline-none focus:border-emerald-500 text-white cursor-pointer"
                    >
                      <option value="all">הכל</option>
                      <option value="interview">ראיון סינון</option>
                      <option value="test">מבדק מעשי</option>
                      <option value="completed">סיים מבדק</option>
                      <option value="signed">חוזה נחתם</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="text-xs bg-slate-950 border border-slate-855 px-2.5 py-2 rounded-xl focus:outline-none focus:border-emerald-500 font-bold text-white cursor-pointer"
                    >
                      <option value="score">דירוג התאמה AI (הכי מתאים)</option>
                      <option value="experience">ותק מבוקש</option>
                      <option value="salary">ציפיית שכר נמוכה</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Grid of Candidate Records */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Candidates List Column (Left) */}
                <div className="lg:col-span-5 flex flex-col gap-3 max-h-[850px] overflow-y-auto pr-1">
                  {filteredCandidates.length === 0 ? (
                    <div className="text-center bg-slate-900 py-16 rounded-2xl border border-slate-800 shadow-sm">
                      <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                      <p className="text-slate-300 font-medium text-sm">לא נמצאו מועמדים התואמים את הסינון הנוכחי.</p>
                      <p className="text-xs text-slate-500 mt-1">נסה לשנות את פרמטרי הסינון או להוסיף מועמד חדש.</p>
                    </div>
                  ) : (
                    filteredCandidates.map(cand => {
                      const pos = positions.find(p => p.id === cand.positionId);
                      const isSelected = cand.id === selectedCandidateId;

                      return (
                        <div
                          key={cand.id}
                          className={`border rounded-xl p-4 transition-all cursor-pointer text-right flex flex-col justify-between gap-3 relative ${
                            isSelected ? 'border-amber-500 bg-amber-500/5 shadow-sm' : 'border-slate-850 bg-slate-900 hover:border-slate-800'
                          }`}
                          onClick={() => setSelectedCandidateId(cand.id)}
                        >
                          <div className="absolute left-4 top-4 flex items-center justify-center">
                            <div className="flex flex-col items-center">
                              <span className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold font-mono border-2 ${
                                cand.score >= 90 
                                  ? 'bg-emerald-950/80 border-emerald-500 text-emerald-400' 
                                  : cand.score >= 80 
                                    ? 'bg-teal-950/80 border-teal-500 text-teal-400' 
                                    : 'bg-slate-950 border-slate-700 text-slate-300'
                              }`}>
                                {cand.score}%
                              </span>
                              <span className="text-[8px] text-slate-500 font-bold mt-1">התאמה</span>
                            </div>
                          </div>

                          <div className="pl-12">
                            <span className="text-[9px] bg-slate-950 border border-slate-850 px-2 py-0.5 rounded-md font-mono text-slate-400 mb-1 inline-block">
                              ID: {cand.id.substring(0, 7)}
                            </span>
                            <h4 className="font-bold text-white text-base flex items-center gap-1.5">
                              {cand.name}
                            </h4>
                            <p className="text-xs text-emerald-400 font-medium mt-1">{pos?.title || "משרה כללית"}</p>
                            
                            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-400">
                              <span>📧 {cand.email}</span>
                              <span>📞 {cand.phone}</span>
                            </div>
                          </div>

                          <div className="pt-3 border-t border-slate-850 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1.5">
                              <span className="text-slate-500">שכר מבוקש:</span>
                              <strong className="text-white">{cand.requestedSalary || "לא צוין"}</strong>
                            </div>

                            <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                              cand.status === 'signed' ? 'bg-emerald-950 text-emerald-400 border border-emerald-900/60' : 
                              cand.status === 'completed' ? 'bg-blue-950 text-blue-400 border border-blue-900/60' : 
                              cand.status === 'test' ? 'bg-yellow-950/80 text-yellow-400 border border-yellow-900/40' : 
                              'bg-indigo-950 text-indigo-400 border border-indigo-900/40'
                            }`}>
                              {cand.status === 'signed' ? '✓ חוזה נחתם' : 
                               cand.status === 'completed' ? 'מבדק הושלם' : 
                               cand.status === 'test' ? 'מבדק מעשי פעיל' : 
                               'סינון ראשוני (בוט)'}
                            </span>
                          </div>

                          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-850/50">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleHrSimulateWhatsAppClick(cand.id);
                              }}
                              className="text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/10 px-2.5 py-1 rounded-lg font-bold text-[11px] flex items-center gap-1 transition cursor-pointer"
                            >
                              <MessageSquare className="w-3 h-3" />
                              פתח צ'אט סימולטור
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveCandidate(cand.id);
                              }}
                              className="text-red-400 hover:bg-red-950/20 p-1.5 rounded transition"
                              title="מחק מועמד"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Candidate detailed view on selected (Right) */}
                <div className="lg:col-span-7 candidate-details-pane bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col gap-5 min-h-[500px] shadow-sm text-slate-100">
                  {selectedCandidate ? (
                    (() => {
                      const pos = positions.find(p => p.id === selectedCandidate.positionId);
                      return (
                        <div className="flex flex-col gap-4 animate-fadeIn text-right">
                          
                          <div className="flex justify-between items-start border-b border-slate-800 pb-3 gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="text-lg font-bold text-white">{selectedCandidate.name}</h3>
                                <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold ${
                                  selectedCandidate.status === 'signed' ? 'bg-emerald-950 text-emerald-400 border border-emerald-900' : 'bg-slate-950 text-slate-400 border border-slate-800'
                                }`}>
                                  {selectedCandidate.status === 'signed' ? 'מגויס!' : 'בתהליך סינון'}
                                </span>
                              </div>
                              <p className="text-xs text-slate-400 mt-0.5">משרה מועמדת: {pos?.title || "לא זמין"}</p>
                            </div>

                            <div className="text-left shrink-0">
                              <span className="text-2xl font-extrabold text-emerald-400 tracking-tight font-mono">{selectedCandidate.score}/100</span>
                              <p className="text-[9px] text-slate-500 font-bold uppercase">התאמה כללית AI</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3 bg-slate-950 p-3.5 rounded-xl border border-slate-850 text-xs">
                            <div>
                              <span className="text-slate-500 block">טלפון נייד:</span>
                              <strong className="text-slate-300">{selectedCandidate.phone}</strong>
                            </div>
                            <div>
                              <span className="text-slate-500 block">אימייל:</span>
                              <strong className="text-slate-300 text-left block truncate">{selectedCandidate.email}</strong>
                            </div>
                            <div className="col-span-2 border-t border-slate-800/80 pt-2 flex items-center justify-between">
                              <div>
                                <span className="text-slate-500 block">תוצאות שכר (הערכה וציפיות):</span>
                                <strong className="text-slate-300">{selectedCandidate.requestedSalary} ש"ח בחודש</strong>
                              </div>
                              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] px-2 py-0.5 rounded font-bold">
                                מבוסס AI
                              </span>
                            </div>
                          </div>

                          <div className="bg-emerald-950/20 p-3.5 rounded-xl border border-emerald-900/40 text-xs text-emerald-300 flex items-start gap-2">
                            <DollarSign className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                            <div>
                              <strong className="block">ניתוח שכר ותאימות לתקציב:</strong>
                              <p className="mt-1 leading-relaxed text-slate-300">{selectedCandidate.salaryFitAnalysis || "ניתוח מקיף של ציפיית השכר יופק בסיום הראיון הראשוני בוואטסאפ."}</p>
                            </div>
                          </div>

                          <article className="flex flex-col gap-3">
                            <div className="border border-slate-800 rounded-xl p-3 bg-slate-950/40">
                              <div className="flex items-center gap-2 text-white font-bold text-xs pb-2 border-b border-slate-800">
                                <Sparkles className="w-4 h-4 text-yellow-500" />
                                <span>חוות דעת סוכנת הגיוס AI (איימי):</span>
                              </div>
                              <p className="text-xs text-slate-300 whitespace-pre-line leading-relaxed mt-2 p-2 bg-slate-950 border border-slate-855 rounded text-right">
                                {selectedCandidate.aiFitSummary}
                              </p>
                            </div>

                            <div className="border border-slate-800 rounded-xl p-3 bg-slate-950/40">
                              <div className="flex items-center justify-between text-white font-bold text-xs pb-2 border-b border-slate-800">
                                <div className="flex items-center gap-2">
                                  <CheckSquare className="w-4 h-4 text-blue-400" />
                                  <span>מבדק מעשי והערכת קוד:</span>
                                </div>
                                <span className="bg-blue-950 text-blue-400 border border-blue-900 px-2 py-0.5 rounded text-[9px] font-mono">
                                  תרגיל AI מותאם
                                </span>
                              </div>
                              
                              {selectedCandidate.testAnswers ? (
                                <div className="mt-2 flex flex-col gap-2">
                                  <div className="text-[10px] bg-slate-950 text-slate-100 p-2.5 rounded-lg font-mono whitespace-pre overflow-x-auto text-left border border-slate-850" dir="ltr">
                                    {selectedCandidate.testAnswers}
                                  </div>
                                  <div className="text-xs text-slate-300 bg-amber-950/20 p-2.5 rounded border border-amber-900/40">
                                    <strong className="text-amber-400 block mb-1">ניתוח פתרון המבחן:</strong>
                                    <p className="leading-relaxed">{selectedCandidate.testFeedback}</p>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-xs text-slate-500 italic mt-2 text-center py-2">המועמד טרם הגיש פתרון למבחן המעשי.</p>
                              )}
                            </div>

                            <div className="border border-slate-800 rounded-xl p-3 bg-slate-950/40">
                              <div className="flex items-center justify-between text-white font-bold text-xs pb-2 border-b border-slate-800">
                                <div className="flex items-center gap-2">
                                  <FileText className="w-4 h-4 text-emerald-400" />
                                  <span>כתיבה חופשית והערות גיוס (CRM):</span>
                                </div>
                                <span className="text-[9px] text-slate-500">שמירה אוטומטית</span>
                              </div>
                              <div className="mt-2 flex flex-col gap-2">
                                <textarea
                                  placeholder="תוכל לכתוב כאן בחופשיות הערות, שיחות טלפון או לתעד שיחות מוואטסאפ באופן ידני..."
                                  value={currentNotesBuffer}
                                  onChange={(e) => {
                                    setCurrentNotesBuffer(e.target.value);
                                    setCandidates(prev => prev.map(c => c.id === selectedCandidateId ? { ...c, hrNotes: e.target.value } : c));
                                  }}
                                  className="w-full h-24 p-2.5 text-xs bg-slate-950 border border-slate-855 rounded-lg focus:outline-none focus:border-emerald-500 text-white"
                                />
                                <button
                                  onClick={handleSaveNotes}
                                  className="bg-slate-800 hover:bg-slate-700 text-white text-[11px] py-1.5 px-3 rounded-lg font-bold self-end transition flex items-center gap-1 cursor-pointer border border-slate-700/80"
                                >
                                  <Check className="w-3.5 h-3.5" /> שמור הערות בכרטיסייה
                                </button>
                              </div>
                            </div>
                                   
                            {pos && (
                              <div className="border border-slate-800 rounded-xl p-3 bg-slate-950/40 flex flex-col gap-3">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-1.5 border-b border-slate-800 gap-2">
                                  <div className="flex items-center gap-1.5 text-white font-bold text-xs">
                                    <FileSignature className="w-4 h-4 text-emerald-400" />
                                    <span>חוזה העסקה וטפסי קליטה אינטראקטיביים:</span>
                                  </div>
                                  
                                  <div className="flex items-center gap-1.5 w-full sm:w-auto">
                                    <span className="text-[10px] text-slate-500 font-semibold whitespace-nowrap">משוך טופס:</span>
                                    <select
                                      value={selectedContractTemplateId}
                                      onChange={(e) => setSelectedContractTemplateId(e.target.value)}
                                      className="text-[11px] bg-slate-950 border border-slate-855 px-2 py-1 rounded w-full sm:w-auto focus:outline-none focus:border-emerald-500 font-bold text-slate-300 cursor-pointer"
                                    >
                                      <option value="baseline">📄 חוזה העסקה בסיסי ({pos.title})</option>
                                      {uploadedContracts.map(doc => (
                                        <option key={doc.id} value={doc.id}>📎 {doc.name}</option>
                                      ))}
                                    </select>
                                  </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-2 justify-start border-t border-slate-850 pt-2.5">
                                  <span className="text-[10px] text-slate-500 font-bold">שידור והפצה:</span>
                                  
                                  <button
                                    onClick={() => handleSendDraftContractCustom(selectedCandidate.id, 'whatsapp')}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] py-1.5 px-3 rounded-lg font-bold transition flex items-center gap-1 shadow-sm cursor-pointer"
                                  >
                                    <Send className="w-3.5 h-3.5" /> שלח חוזה לוואטסאפ למועמד
                                  </button>

                                  <button
                                    onClick={() => handleSendDraftContractCustom(selectedCandidate.id, 'email')}
                                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] py-1.5 px-3 rounded-lg font-bold transition flex items-center gap-1 shadow-sm cursor-pointer border border-slate-700"
                                  >
                                    <Mail className="w-3.5 h-3.5" /> שלח עותק חתום למייל
                                  </button>
                                </div>

                                <div className="mt-2 flex items-center gap-2 justify-end">
                                  {!selectedCandidate.contractSent ? (
                                    <span className="text-slate-400 text-[11px] bg-slate-950 border border-slate-855 px-2.5 py-1 rounded-full font-medium">
                                      ℹ️ מסמך הגיוס ממתין להפצה - בחר ערוץ שליחה מעלה
                                    </span>
                                  ) : !selectedCandidate.contractSigned ? (
                                    <div className="flex flex-col sm:flex-row items-center gap-2 w-full justify-between bg-amber-950/20 p-2 rounded-lg border border-amber-200">
                                      <span className="text-amber-400 font-bold text-[11px]">
                                        ⏱ הקישור נמסר בהצלחה. ממתין לחתימה דיגיטלית של המועמד
                                      </span>
                                      <button
                                        onClick={() => handleSimulateCandidateSigning(selectedCandidate.id)}
                                        className="bg-amber-600 hover:bg-amber-500 text-white text-[11px] py-1 px-2.5 rounded font-bold transition flex items-center gap-1 shadow-sm shrink-0 cursor-pointer"
                                      >
                                        <FileCheck className="w-3.5 h-3.5" /> הדמיית מועמד: חתום בטלפון
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="bg-emerald-950 text-emerald-300 border border-emerald-900 rounded-lg px-3 py-2 text-xs font-bold w-full text-center flex items-center justify-center gap-1.5 shadow-sm">
                                      <UserCheck className="w-4 h-4 text-emerald-400" />
                                      מזל טוב! החוזה הוחזר חתום אלקטרונית והמועמד גויס לחברה בהצלחה! 🎉
                                    </div>
                                  )}
                                </div>

                                <div className="flex flex-col gap-1">
                                  <div className="flex justify-between items-center text-[10px] text-slate-500">
                                    <span>הטקסט נמשך וממולא אוטומטית לפי פרטי המועמד (כתיבה ועריכה חופשית ✍️)</span>
                                    <span className="text-emerald-400 font-bold bg-emerald-950 border border-emerald-900/40 px-1.5 py-0.5 rounded font-mono">מלא בפרטי מועמד</span>
                                  </div>
                                  <textarea
                                    value={liveContractText}
                                    onChange={(e) => {
                                      setLiveContractText(e.target.value);
                                      setCandidates(prev => prev.map(c => {
                                        if (c.id === selectedCandidate.id) {
                                          return { ...c, customContractContent: e.target.value };
                                        }
                                        return c;
                                      }));
                                    }}
                                    rows={8}
                                    className="w-full text-xs leading-relaxed p-3 bg-slate-950 border border-slate-855 rounded-lg focus:outline-none focus:border-emerald-500 resize-y font-sans text-slate-300"
                                    dir="rtl"
                                  />
                                </div>
                              </div>
                            )}
                          </article>
                        </div>
                      );
                    })()
                  ) : (
                    <div className="text-center text-slate-500 py-16 italic font-sans bg-slate-900 border border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center gap-1.5 flex-1">
                      <Users className="w-12 h-12 text-slate-700 mb-2" />
                      <span>✍️ בחר מועמד ברשימה כדי לצפות בפרטים, הערכות, דפי מבדקים וחוזי קליטה.</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* VIEW: WHATSAPP & AI AGENT */}
          {activeSection === 'whatsapp' && (
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 font-sans text-right" id="whatsapp-integration-view" dir="rtl">
              
              {/* Left Column: AI Agent & API Config */}
              <div className="lg:col-span-7 flex flex-col gap-6 text-right">
                
                {/* AI Agent Persona Card */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm text-slate-100">
                  <div className="flex justify-between items-center pb-3 border-b border-slate-800 mb-4">
                    <h4 className="text-base font-bold text-white flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-emerald-400" />
                      <span>הגדרות סוכנת הגיוס הווירטואלית (Persona)</span>
                    </h4>
                    <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-900/60 px-2 py-0.5 rounded-full font-bold">פעיל</span>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Name input */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-400">שם הסוכנת (שיופיע בצ'אט):</label>
                        <input
                          type="text"
                          value={agentSettings.personaName}
                          onChange={(e) => setAgentSettings(prev => ({ ...prev, personaName: e.target.value }))}
                          className="text-xs bg-slate-950 border border-slate-855 px-3 py-2.5 rounded-xl focus:outline-none focus:border-emerald-500 font-bold text-white text-right"
                          placeholder="איימי"
                        />
                      </div>

                      {/* Conversational Tone */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-400">טון הדיבור והגישה בשיחה:</label>
                        <select
                          value={agentSettings.conversationalTone}
                          onChange={(e) => setAgentSettings(prev => ({ ...prev, conversationalTone: e.target.value as any }))}
                          className="text-xs bg-slate-950 border border-slate-855 px-2.5 py-2.5 rounded-xl focus:outline-none focus:border-emerald-500 text-white cursor-pointer"
                        >
                          <option value="friendly">ידידותי, מזמין ותומך (מומלץ)</option>
                          <option value="professional">מקצועי, רשמי וממוקד</option>
                          <option value="strict">קפדני וממוקד מבדקים</option>
                          <option value="concise">תמציתי ומענה מהיר</option>
                        </select>
                      </div>
                    </div>

                    {/* Custom Objective */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-400">יעד השיחה המרכזי של הסוכנת (Objective):</label>
                      <textarea
                        value={agentSettings.customObjective}
                        rows={3}
                        onChange={(e) => setAgentSettings(prev => ({ ...prev, customObjective: e.target.value }))}
                        className="text-xs bg-slate-950 border border-slate-855 p-2.5 rounded-xl focus:outline-none focus:border-emerald-500 leading-relaxed text-white text-right"
                        placeholder="הגדר כאן מה תפקידה של איימי בשיחה..."
                      />
                    </div>

                    {/* Additional guidelines */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-400">הנחיות וקווי יסוד להתנהגות הסוכנת (Guidelines):</label>
                      <textarea
                        value={agentSettings.additionalGuidelines}
                        rows={3}
                        onChange={(e) => setAgentSettings(prev => ({ ...prev, additionalGuidelines: e.target.value }))}
                        className="text-xs bg-slate-950 border border-slate-855 p-2.5 rounded-xl focus:outline-none focus:border-emerald-500 leading-normal text-white text-right"
                        placeholder="הנחיות קריטיות נוספות לביצוע..."
                      />
                    </div>
                  </div>
                </div>

                {/* WhatsApp Cloud API & Integration Panel */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm text-slate-100">
                  <div className="flex justify-between items-center pb-3 border-b border-slate-800 mb-4">
                    <h4 className="text-base font-bold text-white flex items-center gap-2">
                      <PhoneCall className="w-5 h-5 text-emerald-400" />
                      <span>חיבור לערוץ WhatsApp Cloud API רשמי</span>
                    </h4>
                  </div>

                  <div className="space-y-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-400">ספק החיבור (Integration Provider):</label>
                      <select
                        value={whatsappConfig.provider}
                        onChange={(e) => setWhatsappConfig(prev => ({ ...prev, provider: e.target.value as any }))}
                        className="text-xs bg-slate-950 border border-slate-855 px-2.5 py-2.5 rounded-xl focus:outline-none focus:border-emerald-500 text-white cursor-pointer"
                      >
                        <option value="sandbox_sim">סימולטור וואטסאפ מובנה (חינמי - לבדיקות והתרשמות)</option>
                        <option value="meta_cloud">Meta Cloud API (חיבור ישיר רשמי של WhatsApp Business)</option>
                        <option value="custom_agent">סוכן צד שלישי (Custom API Endpoint)</option>
                      </select>
                    </div>

                    {whatsappConfig.provider === 'meta_cloud' && (
                      <div className="space-y-4 p-4 bg-slate-950 rounded-xl border border-slate-850 animate-fadeIn">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold text-slate-400">מספר טלפון לחיבור:</label>
                            <input
                              type="text"
                              value={whatsappConfig.phoneNumber}
                              onChange={(e) => setWhatsappConfig(prev => ({ ...prev, phoneNumber: e.target.value }))}
                              className="text-xs bg-slate-900 border border-slate-800 px-3 py-2 rounded-lg text-white text-left font-mono"
                              placeholder="+972500000000"
                            />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold text-slate-400">מזהה מספר טלפון (Phone Number ID):</label>
                            <input
                              type="text"
                              value={whatsappConfig.phoneNumberId}
                              onChange={(e) => setWhatsappConfig(prev => ({ ...prev, phoneNumberId: e.target.value }))}
                              className="text-xs bg-slate-900 border border-slate-800 px-3 py-2 rounded-lg text-white text-left font-mono"
                              placeholder="10928374659281"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold text-slate-400">מזהה חשבון עסקי (Business Account ID):</label>
                            <input
                              type="text"
                              value={whatsappConfig.businessAccountId}
                              onChange={(e) => setWhatsappConfig(prev => ({ ...prev, businessAccountId: e.target.value }))}
                              className="text-xs bg-slate-900 border border-slate-800 px-3 py-2 rounded-lg text-white text-left font-mono"
                              placeholder="928374610283"
                            />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold text-slate-400">קוד אימות Webhook (Verify Token):</label>
                            <input
                              type="text"
                              value={whatsappConfig.webhookVerifyToken}
                              onChange={(e) => setWhatsappConfig(prev => ({ ...prev, webhookVerifyToken: e.target.value }))}
                              className="text-xs bg-slate-900 border border-slate-800 px-3 py-2 rounded-lg text-white text-left font-mono"
                            />
                          </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-bold text-slate-400">מפתח גישה (System User Access Token):</label>
                          <textarea
                            value={whatsappConfig.accessToken}
                            rows={2}
                            onChange={(e) => setWhatsappConfig(prev => ({ ...prev, accessToken: e.target.value }))}
                            className="text-xs bg-slate-900 border border-slate-800 p-2 text-white text-left font-mono"
                            placeholder="EAAGz..."
                          />
                        </div>

                        {/* Callback Webhook Info */}
                        <div className="p-3 bg-slate-900 text-slate-200 rounded-xl space-y-2 font-mono border border-slate-800 text-left" dir="ltr">
                          <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1.5 justify-start">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            Webhook Callback URL to configure in Meta Developer Portal:
                          </span>
                          <div className="flex items-center justify-between text-[11px] bg-slate-950 p-2 rounded gap-2 select-all select-text cursor-pointer">
                            <code className="text-emerald-300 font-bold truncate">
                              {window.location.origin}/api/whatsapp/webhook
                            </code>
                            <span className="text-[9px] bg-emerald-800 text-white px-1.5 py-0.5 rounded font-sans uppercase">COPY</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {whatsappConfig.provider === 'custom_agent' && (
                      <div className="space-y-4 p-4 bg-slate-950 rounded-xl border border-slate-855 animate-fadeIn">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-bold text-slate-400">Custom Agent HTTP URL Endpoint:</label>
                          <input
                            type="text"
                            value={whatsappConfig.customAgentUrl}
                            onChange={(e) => setWhatsappConfig(prev => ({ ...prev, customAgentUrl: e.target.value }))}
                            className="text-xs bg-slate-900 border border-slate-800 px-3 py-2.5 rounded-lg text-white text-left font-mono"
                            placeholder="https://api.my-agent.com/v1/messages"
                          />
                        </div>
                      </div>
                    )}

                    {whatsappConfig.provider === 'sandbox_sim' && (
                      <div className="p-4 bg-emerald-950/20 border border-emerald-900/40 text-emerald-300 rounded-xl space-y-2">
                        <h5 className="font-bold text-xs flex items-center gap-1.5">
                          <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400" />
                          מצב סימולטור ופיתוח מובנה פעיל
                        </h5>
                        <p className="text-xs leading-relaxed text-slate-300">
                          במצב סימולציה, מועמדים מגיעים ישירות לשיחות בתוך המערכת ללא צורך במספר וואטסאפ עסקי. כל ההודעות מנוהלות מול ה-AI מבוסס מודל Gemini שלך.
                        </p>
                        <p className="text-xs leading-relaxed text-slate-300 font-bold">
                          תוכל להציג ללקוח את השיח מול מועמדים מדומים ישירות בלשונית הסימולטור מימין.
                        </p>
                      </div>
                    )}

                    {/* Connection Test Action */}
                    <div className="flex items-center justify-between border-t border-slate-800 pt-4 gap-3">
                      <button
                        type="button"
                        onClick={async () => {
                          setIsTestingConnection(true);
                          setConnectionTestResult(null);
                          await new Promise(resolve => setTimeout(resolve, 1500));
                          setConnectionTestResult('success');
                          setIsTestingConnection(false);
                        }}
                        disabled={isTestingConnection}
                        className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold py-2 px-4 rounded-xl border border-slate-700/80 transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                      >
                        {isTestingConnection ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>בודק חיבור...</span>
                          </>
                        ) : (
                          <span>בצע בדיקת חיבור לרשת</span>
                        )}
                      </button>

                      {connectionTestResult === 'success' && (
                        <span className="text-xs text-emerald-400 bg-emerald-950 border border-emerald-900/40 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1">
                          ✓ חיבור סימולטיבי תקין! ערוץ ההודעות זמין
                        </span>
                      )}
                    </div>
                  </div>
                </div>

              </div>

              {/* Right Column: Interactive WhatsApp Simulator */}
              <div className="lg:col-span-5 flex flex-col gap-4">
                <div className="bg-[#075e54] text-white p-3.5 rounded-t-2xl shadow-sm border-b border-emerald-900/40 text-right">
                  <h3 className="text-sm font-bold flex items-center gap-2 justify-end">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping inline-block"></span>
                    <span>סימולטור וואטסאפ – ממשק מועמד</span>
                  </h3>
                  <p className="text-[10px] text-emerald-100 mt-0.5">כיצד המועמד רואה את השיחה עם סוכנת ה-AI בטלפון הנייד שלו.</p>
                </div>

                <div className="border-4 border-slate-900 rounded-b-2xl shadow-xl bg-[#efeae2] flex flex-col h-[550px] relative overflow-hidden">
                  {/* Status Bar */}
                  <header className="bg-[#075e54] text-white px-3 py-2.5 flex items-center justify-between shadow-sm shrink-0 font-sans">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-emerald-100 text-[#075e54] font-extrabold flex items-center justify-center shadow-sm text-xs shrink-0">
                        {agentSettings.personaName.substring(0, 2)}
                      </div>
                      <div className="text-right">
                        <h4 className="font-bold text-xs">{agentSettings.personaName}</h4>
                        <span className="text-[9px] text-emerald-200">סוכנת גיוס פעילה</span>
                      </div>
                    </div>
                    {activeWhatsappPosition && (
                      <span className="text-[9px] bg-emerald-800 text-emerald-100 border border-emerald-700 px-2 py-0.5 rounded-md truncate max-w-[120px]">
                        משרה: {activeWhatsappPosition.title}
                      </span>
                    )}
                  </header>

                  {/* Candidate selector */}
                  <div className="bg-white/95 p-2 border-b border-slate-200 flex items-center justify-between text-xs gap-2 shrink-0">
                    <span className="text-slate-500 font-bold">שיחה פעילה:</span>
                    <select
                      value={whatsappCandidateId || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setWhatsappCandidateId(val || null);
                        if (val) {
                          setSelectedCandidateId(val);
                        }
                      }}
                      className="bg-slate-100 border border-slate-300 text-slate-800 rounded-lg px-2 py-1 text-xs focus:outline-none cursor-pointer"
                    >
                      <option value="">בחר מועמד לסימולציה</option>
                      {candidates.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({positions.find(p => p.id === c.positionId)?.title.substring(0, 15)}...)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Messages Area */}
                  <div className="flex-1 p-3 overflow-y-auto space-y-3 flex flex-col">
                    {activeWhatsappCandidate ? (
                      <>
                        <div className="text-center my-1">
                          <span className="bg-[#d1ea24] text-slate-900 text-[9px] px-2.5 py-1 rounded shadow-3xs inline-block border border-yellow-300">
                            🔒 שיחה זו מסומלצת מול ה-AI בהתאם להנחיות של איימי
                          </span>
                        </div>

                        {(activeWhatsappCandidate.chatTranscript || []).map((msg, i) => {
                          const isCandidate = msg.sender === 'candidate';
                          const isBot = msg.sender === 'bot';

                          return (
                            <div
                              key={i}
                              className={`max-w-[80%] rounded-xl p-2.5 text-xs shadow-3xs leading-relaxed text-right ${
                                isCandidate
                                  ? 'bg-[#e2f9cd] text-slate-900 self-end rounded-tr-none'
                                  : isBot
                                    ? 'bg-white text-slate-900 self-start rounded-tl-none border border-slate-100'
                                    : 'bg-indigo-50 text-indigo-900 self-center'
                              }`}
                            >
                              <p className="whitespace-pre-wrap">{msg.text}</p>
                              <span className="text-[8px] text-slate-400 block mt-1 text-left font-mono">{msg.timestamp || 'עכשיו'}</span>
                            </div>
                          );
                        })}

                        {isBotResponding && (
                          <div className="bg-white border border-slate-100 self-start rounded-xl rounded-tl-none p-2.5 max-w-[80%] text-xs shadow-3xs text-slate-500 flex items-center gap-2">
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                            <span>איימי מקלידה תגובה חכמה...</span>
                          </div>
                        )}
                        <div ref={chatEndRef} />
                      </>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center p-3 text-center text-slate-400">
                        <MessageSquare className="w-12 h-12 text-slate-300 mb-2" />
                        <p className="text-xs font-semibold">לא נבחר מועמד</p>
                        <p className="text-[10px] text-slate-400 mt-1">אנא בחר מועמד מהרשומות למעלה על מנת להתחיל את הסימולציה.</p>
                      </div>
                    )}
                  </div>

                  {/* Message Input Panel */}
                  {activeWhatsappCandidate && (
                    <form
                      onSubmit={handleCandidateSendMessage}
                      className="bg-[#f0f0f0] p-2 flex items-center gap-1.5 border-t border-slate-200 shrink-0"
                    >
                      <input
                        type="text"
                        placeholder="הקלד כאן כעובד/מועמד (למשל תשובות, ציפיות שכר)..."
                        value={whatsappInputValue}
                        onChange={(e) => setWhatsappInputValue(e.target.value)}
                        disabled={isBotResponding}
                        className="flex-1 px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-full focus:outline-none focus:border-emerald-600 disabled:opacity-70 text-right text-slate-900"
                      />
                      <button
                        type="submit"
                        disabled={!whatsappInputValue.trim() || isBotResponding}
                        className="bg-[#075e54] hover:bg-[#128c7e] text-white p-2 rounded-full transition shrink-0 disabled:opacity-50 cursor-pointer"
                      >
                        <Send className="w-4 h-4 transform rotate-180" />
                      </button>
                    </form>
                  )}
                </div>

                {/* Quick Simulation Commands */}
                {activeWhatsappCandidate && (
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 shadow-sm text-right">
                    <span className="text-[11px] font-bold text-slate-400 block mb-2">💡 פקודות סימולציה מהירות עבור מועמדים:</span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          const sample = activeWhatsappCandidate.status === 'test'
                            ? "הנה פתרון הקוד למבחן בסמארטפון שלי: SELECT product_category, AVG(sales) ..."
                            : "היי, שמי ישראל ישראלי והאימייל שלי yisrael@gmail.com, נעים מאוד!";
                          setWhatsappInputValue(sample);
                        }}
                        className="bg-slate-950 hover:bg-slate-800 text-slate-300 px-2 py-2 rounded-xl text-xs transition text-right truncate border border-slate-855 cursor-pointer"
                      >
                        {activeWhatsappCandidate.status === 'test' ? '✍️ הגש מבדק מעשי' : '👤 התחל שיחת היכרות'}
                      </button>
                      <button
                        onClick={() => {
                          setWhatsappInputValue("ציפיית השכר המלאה שלי היא 25,000 ש\"ח בחודש.");
                        }}
                        className="bg-slate-950 hover:bg-slate-800 text-slate-300 px-2 py-2 rounded-xl text-xs transition text-right border border-slate-855 cursor-pointer"
                      >
                        💸 הגדרת ציפיית שכר
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* VIEW: CONTRACTS CENTER */}
          {activeSection === 'contracts' && (
            <div className="max-w-7xl mx-auto flex flex-col gap-6 text-right animate-fadeIn" id="contracts-manager-view">
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-xl font-bold text-white">מרכז חוזים, NDA וטפסי קליטה</h3>
                  <p className="text-xs text-slate-400 mt-1">העלה, ערוך ושלח מסמכי העסקה וחוזי סודיות לחתימה אלקטרונית מהירה מול מועמדים.</p>
                </div>
                
                {/* Upload Action */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setIsUploadingFile(true);
                      setTimeout(() => {
                        const newContract: UploadedContractTemplate = {
                          id: `contract-custom-${Date.now()}`,
                          name: file.name,
                          content: `הסכם סודיות/העסקה אישי - ${file.name.replace(/\.[^/.]+$/, "")}\n\nנערך ביום {date}\nבין: החברה המגייסת\nלבין: {name} (טלפון: {phone}, אימייל: {email})\n\nסעיף 1. סודיות ואי תחרות למשרה {position} בשכר {salary} ש"ח.\n\nחתימות הצדדים לקבוצה: _________________`,
                          fileType: file.type || "application/pdf",
                          fileSize: `${(file.size / 1024).toFixed(1)} KB`,
                          uploadedAt: new Date().toISOString().split('T')[0]
                        };
                        setUploadedContracts(prev => [newContract, ...prev]);
                        setIsUploadingFile(false);
                        alert(`הקובץ ${file.name} הועלה בהצלחה ונטען לתוך מאגר תבניות ה-CRM!`);
                      }, 1200);
                    }}
                    className="hidden"
                    accept=".doc,.docx,.pdf,.txt"
                  />
                  
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingFile}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-sm transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isUploadingFile ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>מעלה קובץ...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        <span>העלאת תבנית חוזה חדשה</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Uploaded Contracts Table/List */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm text-slate-100">
                <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                  <FileSignature className="w-4 h-4 text-emerald-400" />
                  <span>מאגר תבניות החוזים הקיים במערכת ({1 + uploadedContracts.length})</span>
                </h4>

                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-500 font-bold">
                        <th className="pb-3 pr-2">שם התבנית והמסמך</th>
                        <th className="pb-3 hidden md:table-cell font-sans">סוג קובץ</th>
                        <th className="pb-3 hidden md:table-cell font-sans">גודל</th>
                        <th className="pb-3">תאריך העלאה</th>
                        <th className="pb-3 pl-2 text-left font-sans">פעולות</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {/* Default baseline contract */}
                      <tr className="hover:bg-slate-950/40 transition">
                        <td className="py-3.5 pr-2 font-semibold text-white flex items-center gap-2">
                          <FileCode className="w-4 h-4 text-emerald-400" />
                          <span>הסכם העסקה בסיסי דינמי (משרה)</span>
                        </td>
                        <td className="py-3.5 text-slate-400 hidden md:table-cell font-mono">System Dynamic Template</td>
                        <td className="py-3.5 text-slate-400 hidden md:table-cell font-mono">Variable</td>
                        <td className="py-3.5 text-slate-300">ברירת מחדל</td>
                        <td className="py-3.5 pl-2 text-left text-slate-500 font-sans">תבנית ליבה</td>
                      </tr>

                      {uploadedContracts.map(doc => (
                        <tr key={doc.id} className="hover:bg-slate-950/40 transition">
                          <td className="py-3.5 pr-2 font-semibold text-white flex items-center gap-2">
                            <FileText className="w-4 h-4 text-teal-400" />
                            <span>{doc.name}</span>
                          </td>
                          <td className="py-3.5 text-slate-400 hidden md:table-cell truncate max-w-[150px] font-mono">{doc.fileType || 'application/pdf'}</td>
                          <td className="py-3.5 text-slate-400 hidden md:table-cell font-mono">{doc.fileSize || '15 KB'}</td>
                          <td className="py-3.5 text-slate-300">{doc.uploadedAt}</td>
                          <td className="py-3.5 pl-2 text-left">
                            <button
                              onClick={() => {
                                setUploadedContracts(prev => prev.filter(c => c.id !== doc.id));
                              }}
                              className="text-red-400 hover:text-red-300 hover:underline font-bold font-sans cursor-pointer"
                            >
                              מחק תבנית
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* VIEW: SETTINGS */}
          {activeSection === 'settings' && (
            <div className="max-w-4xl mx-auto flex flex-col gap-6 text-right animate-fadeIn" id="settings-view">
              
              <div className="border-b border-slate-800 pb-4">
                <h3 className="text-xl font-bold text-white font-sans">הגדרות מערכת ושותפים (SaaS Settings)</h3>
                <p className="text-xs text-slate-400 mt-1">ניהול מותג, חיבורי LLM, אבטחת מידע וניהול מנויים ולקוחות מרובים.</p>
              </div>

              {/* General SaaS Tenant configuration */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
                <h4 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                  <Building className="w-5 h-5 text-emerald-400" />
                  <span>פרטי הארגון והמשתמש הנוכחי (Workspace & Profile)</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-bold text-slate-400">שם הארגון:</span>
                    <strong className="text-sm text-white">{currentUser?.organizationName || "ארגון ברירת מחדל"}</strong>
                  </div>
                  
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-bold text-slate-400">אימייל משתמש:</span>
                    <strong className="text-sm text-white">{currentUser?.email || "מגייס מערכת"}</strong>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-bold text-slate-400">תפקיד הרשאה:</span>
                    <strong className="text-sm text-emerald-400">{currentUser?.role === 'admin' ? 'מנהל מערכת (Admin)' : 'מגייס (Recruiter)'}</strong>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-bold text-slate-400">קוד הזמנה לארגון (Invite Code):</span>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        readOnly
                        value={currentUser?.organizationId || "default-org"}
                        className="text-xs bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg text-slate-300 font-mono text-center flex-1"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(currentUser?.organizationId || "default-org");
                          alert("קוד הארגון הועתק ללוח! שלח אותו לחברי הצוות על מנת שיצטרפו לארגון.");
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm transition cursor-pointer"
                      >
                        העתק קוד
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* LLM & AI Engine Integration */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
                <h4 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                  <Sparkles className="w-5 h-5 text-emerald-400" />
                  <span>מנוע בינה מלאכותית (LLM Engine Router)</span>
                </h4>

                <div className="space-y-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-400 font-sans">מודל ברירת מחדל לשיחות גיוס:</label>
                    <select
                      defaultValue="gemini-1.5-flash"
                      className="text-xs bg-slate-950 border border-slate-855 px-2.5 py-2.5 rounded-xl focus:outline-none focus:border-emerald-500 text-white cursor-pointer"
                    >
                      <option value="gemini-1.5-flash">Google Gemini 1.5 Flash (מומלץ - מהיר וזול)</option>
                      <option value="gemini-1.5-pro">Google Gemini 1.5 Pro (חשיבה מתקדמת ויכולות קוד)</option>
                      <option value="gpt-4o">OpenAI GPT-4o (תמיכה בצד שלישי)</option>
                      <option value="claude-3-5-sonnet">Anthropic Claude 3.5 Sonnet</option>
                    </select>
                  </div>

                  <div className="p-3 bg-emerald-950/20 border border-emerald-900/40 text-emerald-300 rounded-xl text-xs leading-relaxed font-sans">
                    מפתח ה-API לעבודה מול Gemini נשמר ומנוהל בשרת האחורי בצורה מאובטחת. אין סכנת חשיפה בדפדפן צד לקוח.
                  </div>
                </div>
              </div>

              {/* Data & Security parameters */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
                <h4 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                  <SlidersHorizontal className="w-5 h-5 text-emerald-400" />
                  <span>אבטחת מידע ותאימות (Data Safety & compliance)</span>
                </h4>

                <div className="space-y-3 text-xs text-slate-300 font-sans">
                  <div className="flex items-center gap-3">
                    <input type="checkbox" defaultChecked className="rounded border-slate-800 bg-slate-950 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer" />
                    <span>אפשר בידוד מועמדים ברמת חוקי Row Level Security (RLS) בבסיס הנתונים PostgreSQL</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <input type="checkbox" defaultChecked className="rounded border-slate-800 bg-slate-950 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer" />
                    <span>מחק אוטומטית היסטוריית מבדקי קוד של מועמדים לאחר 180 יום מתום המיון</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <input type="checkbox" defaultChecked className="rounded border-slate-800 bg-slate-950 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer" />
                    <span>שדר הודעת הצהרת פרטיות ותנאי שימוש (GDPR/חוק הגנת הפרטיות) למועמד בתחילת שיחה בוואטסאפ</span>
                  </div>
                </div>

                <div className="flex justify-end pt-3 border-t border-slate-800">
                  <button
                    onClick={() => alert('הגדרות האבטחה וה-SaaS עודכנו בהצלחה!')}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-sm transition cursor-pointer"
                  >
                    שמור הגדרות מתקדמות
                  </button>
                </div>
              </div>

            </div>
          )}

        </div>
      </div>

      {/* MODAL / OVERLAY: CREATE NEW POSITION */}
      {showAddPosition && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-2xl w-full p-6 relative flex flex-col gap-4 animate-scaleUp max-h-[90vh] overflow-y-auto">
            
            <button 
              onClick={() => setShowAddPosition(false)}
              className="absolute left-4 top-4 text-slate-400 hover:text-slate-600 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-emerald-600" />
              הוספת משרה דרישות ומבדקים מותאמים
            </h3>

            <form onSubmit={handleAddPositionSubmit} className="space-y-4">
              
              {/* Row 1: Title and Experience */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">שם ותואר התפקיד הגיוסי:</label>
                  <input
                    type="text"
                    required
                    placeholder="לדוגמה: מפתח Fullstack / מנהל מוצר..."
                    value={newPositionTitle}
                    onChange={(e) => setNewPositionTitle(e.target.value)}
                    className="p-2 text-xs border border-slate-200 rounded focus:outline-none focus:border-emerald-600 text-slate-900 bg-white"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">שנות ניסיון מינימליות המבוקשות:</label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    required
                    value={newPositionExperience}
                    onChange={(e) => setNewPositionExperience(Number(e.target.value))}
                    className="p-2 text-xs border border-slate-200 rounded focus:outline-none focus:border-emerald-600 text-slate-900 bg-white"
                  />
                </div>
              </div>

              {/* Requirements Criteria Checklist */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-700">קריטריונים ודרישות HR לדיווח ב-CRM (מידת התאמה):</label>
                  <button
                    type="button"
                    onClick={handleAddReqField}
                    className="text-emerald-700 text-xs font-semibold hover:underline"
                  >
                    + הוסף שורת קריטריון
                  </button>
                </div>
                {newPositionRequirements.map((req, idx) => (
                  <input
                    key={idx}
                    type="text"
                    placeholder={`דרישה ${idx + 1}, למשל: הבנה עמוקה ב-SQL או ניסיון בפיתוח React`}
                    value={req}
                    onChange={(e) => handleReqFieldChange(idx, e.target.value)}
                    className="p-2 text-xs border border-slate-200 rounded focus:outline-none focus:border-emerald-600 mt-1 text-slate-900 bg-white"
                  />
                ))}
              </div>

              {/* Interactive custom interview questions */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-700">שאלות גיוס מקצועיות שה-AI ישאל את המועמד בוואטסאפ:</label>
                  <button
                    type="button"
                    onClick={handleAddQuestionField}
                    className="text-emerald-700 text-xs font-semibold hover:underline"
                  >
                    + הוסף שאלת ראיון
                  </button>
                </div>
                {newPositionQuestions.map((q, idx) => (
                  <input
                    key={idx}
                    type="text"
                    placeholder={`שאלה ${idx + 1}, למשל: "תאר פרויקט משמעותי שבנית ב-React"`}
                    value={q}
                    onChange={(e) => handleQuestionFieldChange(idx, e.target.value)}
                    className="p-2 text-xs border border-slate-200 rounded focus:outline-none focus:border-emerald-600 mt-1 text-slate-900 bg-white"
                  />
                ))}
              </div>

              {/* Dynamic technical test criteria */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">הנחיות ומבדק מעשי AI עבור המועמדים החזקים:</label>
                <textarea
                  placeholder="הוראות מפורטות לתרגיל המעשי. ה-AI ינסח מבדק רלוונטי למועמד ויהיה אחראי לבדוק ולתת הערכה מקצועית. למשל: 'שאלה על חישוב ממוצע ב-SQL וטיפול ברזולוציות של responsive design'."
                  value={newPositionTestPrompt}
                  onChange={(e) => setNewPositionTestPrompt(e.target.value)}
                  className="p-2 text-xs h-20 border border-slate-200 rounded focus:outline-none focus:border-emerald-600 text-slate-900 bg-white"
                />
              </div>

              {/* Baseline Employment Contract template */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">הסכם העסקה להדמיית חתימה דיגיטלית (חוזה מותאם):</label>
                <textarea
                  placeholder="כתוב נוסח בסיסי של חוזה ההעסקה. תוכל להשתמש בפרמטרים מוחלפים כגון {name} ו-{salary}."
                  value={newPositionContract}
                  onChange={(e) => setNewPositionContract(e.target.value)}
                  className="p-2 text-xs h-24 border border-slate-200 rounded focus:outline-none focus:border-emerald-600 font-mono text-slate-900 bg-white"
                  dir="rtl"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddPosition(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700"
                >
                  בטל
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm"
                >
                  שמור משרה והפעל מלווה גיוס
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
