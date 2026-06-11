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
  FileCode
} from 'lucide-react';
import { Position, Candidate, ChatMessage, AgentSettings, UploadedContractTemplate } from './types.ts';
import { INITIAL_POSITIONS, INITIAL_CANDIDATES } from './data/mockData.ts';

export default function App() {
  // Load initial data from localStorage if existing, otherwise fallback to defaults
  const [positions, setPositions] = useState<Position[]>(() => {
    const saved = localStorage.getItem('hr_crm_positions');
    return saved ? JSON.parse(saved) : INITIAL_POSITIONS;
  });

  const [candidates, setCandidates] = useState<Candidate[]>(() => {
    const saved = localStorage.getItem('hr_crm_candidates');
    return saved ? JSON.parse(saved) : INITIAL_CANDIDATES;
  });

  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(() => {
    const savedCandidates = localStorage.getItem('hr_crm_candidates');
    const list: Candidate[] = savedCandidates ? JSON.parse(savedCandidates) : INITIAL_CANDIDATES;
    return list.length > 0 ? list[0].id : null;
  });

  // State for AI Recruitment Agent settings block
  const [agentSettings, setAgentSettings] = useState<AgentSettings>(() => {
    const saved = localStorage.getItem('hr_crm_agent_settings');
    return saved ? JSON.parse(saved) : {
      personaName: "איימי",
      customObjective: "לנהל שיחת סינון ראשונית בוואטסאפ עם מועמדים, לנטר פרטים אישיים וציפיות שכר מפי המועמד, לבחון מענה על שאלות ה-HR ולהפנות את המועמדים החזקים לביצוע מבדק קוד מעשי אוטומטי.",
      conversationalTone: "friendly",
      additionalGuidelines: "1. היה תומך ומזמין.\n2. ברר בבקשה בקור רוח על שנות הניסיון.\n3. אל תשתמש במונחים טכניים מסובכים מדי."
    };
  });

  // State for Human Custom Uploaded Templates
  const [uploadedContracts, setUploadedContracts] = useState<UploadedContractTemplate[]>(() => {
    const saved = localStorage.getItem('hr_crm_uploaded_contracts');
    return saved ? JSON.parse(saved) : [
      {
        id: "contract-nda",
        name: "סודיות_למועמדים_NDA_2026.docx",
        content: `הסכם שמירת סודיות (NDA) - מועמדי גיוס\n\nשנחתם ביום {date} בין החברה המגייסת לבין מר/גב' {name} נושא ת.ז/דרכון/טלפון {phone}.\n\nהמועמד מתחייב לשמור בסודיות מוחלטת כל מידע טכנולוגי או עסקי שייחשף אליו במהלך מבדקי המשרה {position}.\nשכר מבוקש להמשך תיאום: {salary} ש"ח בחודש.\n\nחתימת המועמד: _________________`,
        fileType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        fileSize: "24.5 KB",
        uploadedAt: "2026-05-15"
      },
      {
        id: "contract-standard-dev",
        name: "הסכם_משרה_מלאה_סטנדרטי.docx",
        content: `הסכם העסקה אישי - מפתח תוכנה\n\nשנערך ביום {date}\nבין: החברה המגייסת\nלבין המועמד: {name} (טלפון: {phone}, אימייל: {email})\n\nלתפקיד: {position}\n\nתנאי העסקה עיקריים:\n1. שכר חודשי יסוד ברוטו: {salary} ש"ח.\n2. המועמד מתחייב להקדיש את מירב מרצו לחברה.\n\nחתימת החברה: HR Team       חתימת המועמד: ______________`,
        fileType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        fileSize: "41.2 KB",
        uploadedAt: "2026-05-28"
      }
    ];
  });

  // Keep track of chosen document to edit / auto-populate for candidate
  const [selectedContractTemplateId, setSelectedContractTemplateId] = useState<string>("baseline");
  const [liveContractText, setLiveContractText] = useState<string>('');
  const [showAgentSettings, setShowAgentSettings] = useState<boolean>(true);

  // State for Real WhatsApp Cloud API & AI Integration Configurations
  const [whatsappConfig, setWhatsappConfig] = useState(() => {
    const saved = localStorage.getItem('hr_crm_whatsapp_config');
    return saved ? JSON.parse(saved) : {
      phoneNumber: '',
      accessToken: '',
      phoneNumberId: '',
      businessAccountId: '',
      webhookVerifyToken: 'verify_token_' + Math.random().toString(36).substring(2, 10),
      provider: 'meta_cloud',
      customAgentUrl: '',
      isConfigured: false
    };
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

  // Sync state to local storage on changes
  useEffect(() => {
    localStorage.setItem('hr_crm_positions', JSON.stringify(positions));
  }, [positions]);

  useEffect(() => {
    localStorage.setItem('hr_crm_candidates', JSON.stringify(candidates));
  }, [candidates]);

  useEffect(() => {
    localStorage.setItem('hr_crm_agent_settings', JSON.stringify(agentSettings));
  }, [agentSettings]);

  useEffect(() => {
    localStorage.setItem('hr_crm_uploaded_contracts', JSON.stringify(uploadedContracts));
  }, [uploadedContracts]);

  useEffect(() => {
    localStorage.setItem('hr_crm_whatsapp_config', JSON.stringify(whatsappConfig));
  }, [whatsappConfig]);

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

  // Save notes handler
  const handleSaveNotes = () => {
    if (!selectedCandidateId) return;
    setCandidates(prev => prev.map(cand => {
      if (cand.id === selectedCandidateId) {
        return { ...cand, hrNotes: currentNotesBuffer, updatedAt: new Date().toISOString().split('T')[0] };
      }
      return cand;
    }));
    // Flash brief feedback
    alert('ההערות נשמרו בהצלחה!');
  };

  // Create new position helper
  const handleAddPositionSubmit = (e: React.FormEvent) => {
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
  const handleCreateNewCandidateFromLink = (positionId: string) => {
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
    setSelectedCandidateId(randomId);
    setWhatsappCandidateId(randomId);
    setActiveViewTab('candidates');
  };

  // Simulated Candidate manual insert
  const createQuickCandidate = () => {
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
      const response = await fetch('/api/candidate/simulate-bot', {
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

      // Update local storage candidates list
      setCandidates(prev => prev.map(c => {
        if (c.id === candidateId) {
          // Keep current values or merge from AI extractions
          const updatedCandidate: Candidate = {
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

    // Append users local message instantly for responsiveness
    setCandidates(prev => prev.map(c => {
      if (c.id === whatsappCandidateId) {
        return {
          ...c,
          chatTranscript: [
            ...c.chatTranscript,
            { sender: 'candidate', text: userMsg, timestamp: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }) }
          ]
        };
      }
      return c;
    }));

    // Trigger AI assessment or smart flow
    await triggerBotSimulation(whatsappCandidateId, userMsg);
  };

  // HR Recruiter clicks to send message to candidate in WhatsApp simulation
  const handleHrSimulateWhatsAppClick = (candidateId: string) => {
    setWhatsappCandidateId(candidateId);
  };

  // Perform contract action (Send contract)
  const handleSendDraftContract = (candidateId: string) => {
    setCandidates(prev => prev.map(c => {
      if (c.id === candidateId) {
        return {
          ...c,
          contractSent: true,
          status: 'test', // upgrade state or keep updated
          updatedAt: new Date().toISOString().split('T')[0]
        };
      }
      return c;
    }));
    alert('חוזה ההעסקה נשלח בהצלחה למועמד! הסימולטור מייצר כעת שליחה נוחה לכתובת המייל והוואטסאפ של המועמד.');
  };

  // Simulate Candidate signing the contract
  const handleSimulateCandidateSigning = (candidateId: string) => {
    setCandidates(prev => prev.map(c => {
      if (c.id === candidateId) {
        return {
          ...c,
          contractSigned: true,
          status: 'signed',
          updatedAt: new Date().toISOString().split('T')[0]
        };
      }
      return c;
    }));
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
  const handleSendDraftContractCustom = (candidateId: string, deliveryType: 'whatsapp' | 'email') => {
    let currentContractValue = liveContractText;
    
    setCandidates(prev => prev.map(c => {
      if (c.id === candidateId) {
        const notificationMsg = deliveryType === 'whatsapp' 
          ? `📝 שלום ${c.name || 'מועמד'}! סוכנת ה-AI של החברה שלחה אליך את מסמך ההעסקה וחתימה אלקטרונית מותאמת. אנא היכנס לקישור הבא כדי לעבור על הפרטים ולחתום בברכה.`
          : `📧 נשלח אליך דוא"ל רשמי המכיל את מסמכי הגיוס המלאים ממחלקת ה-HR.`;
          
        return {
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
      }
      return c;
    }));
    
    if (deliveryType === 'whatsapp') {
      alert('המסמך נשלח בהצלחה לוואטסאפ של המועמד! המועמד יוכל לראות כעת את הקישור ויראה אותו ישירות בהיסטוריית השיחה.');
    } else {
      const emailTarget = selectedCandidate?.email || 'hr@candidate.co.il';
      alert(`מערכת ה-CRM ארזה ושלחה את הטופס המלא והמשוך ישירות לכתובת המייל המעודכנת: ${emailTarget} בהצלחה!`);
    }
  };

  // Remove candidate
  const handleRemoveCandidate = (candidateId: string) => {
    if (confirm('האם אתה בטוח שברצונך למחוק מועמד זה?')) {
      const remaining = candidates.filter(c => c.id !== candidateId);
      setCandidates(remaining);
      if (selectedCandidateId === candidateId) {
        setSelectedCandidateId(remaining.length > 0 ? remaining[0].id : null);
      }
    }
  };

  // Remove position
  const handleRemovePosition = (positionId: string) => {
    if (confirm('מחיקת משרה תסיר אותה מהרשימה. האם להמשיך?')) {
      setPositions(prev => prev.filter(p => p.id !== positionId));
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

  return (
    <div className="min-h-screen bg-slate-50 font-sans antialiased text-slate-800" dir="rtl" id="applet-root">
      
      {/* Dynamic Header */}
      <header className="bg-slate-900 text-white border-b border-slate-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 md:py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-600 rounded-xl text-white shadow-md shadow-emerald-500/20">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight">מערכת גיוס חכמה – Amy AI HR Match</h1>
              <p className="text-xs text-slate-400">ניהול מועמדים חכם, מבדקי AI אוטומטיים וסימולציית שיחות וואטסאפ בזמן אמת</p>
            </div>
          </div>
          
          {/* Quick Statistics Row */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-sm text-slate-300">
            <div className="bg-slate-800/80 px-3.5 py-1.5 rounded-lg border border-slate-700/50 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-emerald-400" />
              <span>משרות פעילות: <strong className="text-white">{positions.length}</strong></span>
            </div>
            <div className="bg-slate-800/80 px-3.5 py-1.5 rounded-lg border border-slate-700/50 flex items-center gap-2">
              <Users className="w-4 h-4 text-teal-400" />
              <span>סך מועמדים ב-CRM: <strong className="text-white">{candidates.length}</strong></span>
            </div>
            <div className="bg-slate-800/80 px-3.5 py-1.5 rounded-lg border border-slate-700/50 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-yellow-400" />
              <span>ממתינים למבחן: <strong className="text-white">{candidates.filter(c => c.status === 'test').length}</strong></span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto p-4 md:py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: CRM Control Hub (Positions list, Candidates search, filter and details) */}
        <section className="lg:col-span-8 flex flex-col gap-6" id="hr-control-hub">
          
          {/* Tabs Menu */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-white p-2 rounded-xl shadow-sm">
            <div className="flex gap-2 flex-wrap">
              <button 
                id="tab-candidates"
                onClick={() => setActiveViewTab('candidates')}
                className={`px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${activeViewTab === 'candidates' ? 'bg-slate-900 text-white shadow' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
              >
                <Users className="w-4 h-4" />
                ניהול מועמדים (CRM)
              </button>
              <button 
                id="tab-positions"
                onClick={() => setActiveViewTab('positions')}
                className={`px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${activeViewTab === 'positions' ? 'bg-slate-900 text-white shadow' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
              >
                <Briefcase className="w-4 h-4" />
                הגדרת משרות
              </button>
              <button 
                id="tab-contracts"
                onClick={() => setActiveViewTab('contracts')}
                className={`px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${activeViewTab === 'contracts' ? 'bg-slate-900 text-white shadow' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
              >
                <FileText className="w-4 h-4" />
                תבניות חוזים
              </button>
              <button 
                id="tab-whatsapp-config"
                onClick={() => setActiveViewTab('whatsapp')}
                className={`px-3.5 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-1.5 ${activeViewTab === 'whatsapp' ? 'bg-emerald-600 text-white shadow-md' : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'}`}
              >
                <MessageSquare className="w-4 h-4 text-emerald-500" />
                חיבור וואטסאפ וסוכן AI
                <span className="text-[9px] bg-red-500 text-white px-1.5 py-0.5 rounded-full font-bold animate-pulse text-[8px]">NEW</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                id="btn-quick-candidate"
                onClick={createQuickCandidate}
                className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5"
                title="הוספת מועמד מהיר להדמיה בלבד"
              >
                <PlusCircle className="w-3.5 h-3.5 text-slate-500" />
                מועמד להדגמה
              </button>
              <button 
                id="btn-new-position"
                onClick={() => setShowAddPosition(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm transition flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                משרה חדשה
              </button>
            </div>
          </div>

          {/* VIEW: POSITIONS CONFIGURATION */}
          {activeViewTab === 'positions' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-6 animate-fadeIn" id="positions-configuration-view">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">קטלוג משרות פעילות במערכת</h3>
                  <p className="text-xs text-slate-500">עבור כל משרה מוגדרות שאלות הסינון של ה-AI, מבדק ההתאמה ותבנית החוזה.</p>
                </div>
              </div>

              {positions.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl">
                  <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 font-medium">לא מוגדרות משרות כרגע במערכת.</p>
                  <button 
                    onClick={() => setShowAddPosition(true)}
                    className="mt-4 bg-slate-900 text-white text-sm px-4 py-2 rounded-lg font-semibold shadow hover:bg-slate-800 transition inline-flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> הגדר משרה ראשונה
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {positions.map(pos => (
                    <div key={pos.id} className="border border-slate-200 hover:border-emerald-500/50 rounded-xl p-5 bg-white shadow-xs transition-all relative flex flex-col justify-between gap-4">
                      <div>
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="font-bold text-slate-900 hover:text-emerald-700 transition lg:text-lg">{pos.title}</h4>
                          <span className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded font-medium shrink-0">
                            ניסיון: {pos.experienceYears}+ שנים
                          </span>
                        </div>
                        
                        <div className="mt-4 flex flex-col gap-2">
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">קריטריונים ודרישות HR:</span>
                          <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
                            {pos.requirements.slice(0, 3).map((req, i) => (
                              <li key={i} className="truncate">{req || "קריטריון כללי"}</li>
                            ))}
                            {pos.requirements.length > 3 && (
                              <li className="text-emerald-600 font-semibold list-none pr-1">+{pos.requirements.length - 3} דרישות נוספות...</li>
                            )}
                          </ul>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col gap-1.5">
                          <span className="text-xs font-bold text-slate-500">שאלות סינון בוואטסאפ ({pos.questions.length}):</span>
                          <p className="text-xs text-slate-600 italic truncate">"{pos.questions[0] || 'אין שאלות מוגדרות'}"</p>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 mt-auto">
                        <button
                          onClick={() => handleCreateNewCandidateFromLink(pos.id)}
                          className="bg-emerald-50/80 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300 text-xs py-2 px-3 rounded-lg font-semibold transition flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          התחל הדמיית מועמד לתפקיד
                        </button>
                        <button
                          onClick={() => handleRemovePosition(pos.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition"
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

          {/* VIEW: CONTRACT TEMPLATE MANAGER */}
          {activeViewTab === 'contracts' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-6 animate-fadeIn" id="contracts-manager-view">
              
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">ניהול ותבניות חוזי העסקה</h3>
                  <p className="text-xs text-slate-500 font-medium">ערוך, העלה ונהל את תבניות הטפסים וההסכמים השונים של מחלקת משאבי האנוש.</p>
                </div>
                
                {/* Simulated file upload trigger */}
                <div className="flex items-center gap-2">
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
                          content: `הסכם גיוס מותאם אישית - ${file.name.replace(/\.[^/.]+$/, "")}\n\nשנחתם ביום {date}\nבין: החברה המגייסת\nלבין המועמד: {name} (טלפון: {phone}, אימייל: {email})\n\nנספח מורחב:\nהמועמד מצהיר על שכר מבוקש למשרה {position} בגובה של {salary} ש"ח.\n\nחתימת המועמד: _________________`,
                          fileType: file.type || "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                          fileSize: `${(file.size / 1024).toFixed(1)} KB`,
                          uploadedAt: new Date().toISOString().split('T')[0]
                        };
                        setUploadedContracts(prev => [newContract, ...prev]);
                        setIsUploadingFile(false);
                        alert(`הקובץ ${file.name} הועלה בהצלחה למערכת! כעת תוכל למשוך אותו, למלא אותו אוטומטית בפרטי המועמד ולשלוח לוואטסאפ או אימייל בדף הלקוח.`);
                      }, 1000);
                    }}
                    className="hidden"
                    accept=".doc,.docx,.pdf,.txt"
                  />
                  
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingFile}
                    className="bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-sm transition flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    {isUploadingFile ? "מעלה קובץ..." : "העלה טופס/חוזה חדש (.docx, .pdf, .txt)"}
                  </button>
                </div>
              </div>

              {/* TWO COLUMN CONTENT: 1. Drag Drop Simulation & Uploaded list | 2. Position Baselines */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left: Document Uploader Simulator Area & List */}
                <div className="lg:col-span-7 flex flex-col gap-4">
                  
                  {/* Interactive Drag & Drop Box */}
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/20 hover:bg-emerald-50/40 p-6 rounded-xl text-center cursor-pointer transition flex flex-col items-center justify-center gap-2.5"
                  >
                    <div className="p-3 bg-emerald-100 rounded-full text-emerald-700">
                      <FileText className="w-6 h-6 animate-bounce" />
                    </div>
                    <div>
                      <strong className="text-sm text-emerald-950 block">גרור והשלך קבצים כאן או לחץ לבחירה</strong>
                      <span className="text-[11px] text-emerald-600 block mt-0.5">תומך בפורמטי טיוטות, NDA, הסכמי גיוס (.pdf, .docx, .txt)</span>
                    </div>
                    {isUploadingFile && (
                      <div className="w-full max-w-xs bg-slate-200 rounded-full h-1.5 mt-2 overflow-hidden">
                        <div className="bg-emerald-500 h-1.5 rounded-full animate-pulse style-width-80" />
                      </div>
                    )}
                  </div>

                  {/* Uploaded Documents Management Table */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/10">
                    <div className="bg-slate-900/5 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
                      <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <FileCode className="w-4 h-4 text-slate-500" />
                        מסמכים וטפסים מועלים במערכת ({uploadedContracts.length})
                      </h4>
                      <span className="text-[10px] text-slate-500">ניתנים למשיכה אוטומטית בדף המועמד</span>
                    </div>

                    <div className="divide-y divide-slate-100 bg-white">
                      {uploadedContracts.map(doc => (
                        <div key={doc.id} className="p-3 flex items-center justify-between gap-3 hover:bg-slate-50 transition">
                          <div className="flex items-center gap-2.5">
                            <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
                              <FileText className="w-4 h-4" />
                            </div>
                            <div>
                              <strong className="text-xs text-slate-900 block">{doc.name}</strong>
                              <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-500 font-mono">
                                <span className="bg-slate-100 px-1 py-0.2 rounded text-slate-600">{doc.fileSize}</span>
                                <span>|</span>
                                <span>הועלה ב-{doc.uploadedAt}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const matchedText = confirm(`האם ברצונך למחוק את תבנית הטופס "${doc.name}"?`);
                                if (matchedText) {
                                  setUploadedContracts(prev => prev.filter(t => t.id !== doc.id));
                                }
                              }}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded transition"
                              title="מחק טופס זה"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Right: Position baseline smart contracts */}
                <div className="lg:col-span-5 flex flex-col gap-4">
                  <div className="bg-slate-900/5 px-4 py-3 border border-slate-200 rounded-t-xl -mb-4 flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Briefcase className="w-4 h-4 text-emerald-600" />
                      חוזי בסיס משויכי משרות ({positions.length})
                    </h4>
                  </div>

                  <div className="space-y-3">
                    {positions.map(pos => (
                      <div key={pos.id} className="border border-slate-200 rounded-xl p-4 bg-white flex flex-col gap-2">
                        <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg">
                          <span className="font-bold text-slate-800 text-xs">{pos.title}</span>
                          <span className="text-[10px] text-slate-500 font-mono">משרה: {pos.id}</span>
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-[11px] font-bold text-slate-500">נוסח הבסיס של החוזה:</label>
                          <textarea
                            value={pos.contractTemplate}
                            onChange={(e) => {
                              const updated = e.target.value;
                              setPositions(prev => prev.map(p => p.id === pos.id ? { ...p, contractTemplate: updated } : p));
                            }}
                            className="w-full h-28 text-[11px] font-mono p-2 bg-slate-900 text-slate-100 rounded-lg border border-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            dir="rtl"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                </div>

              </div>

            </div>
          )}

          {/* VIEW: WHATSAPP INTEGRATION & AI CONFIGURATION */}
          {activeViewTab === 'whatsapp' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-6 animate-fadeIn font-sans" id="whatsapp-integration-view" dir="rtl">
              
              {/* Header */}
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-emerald-600" />
                    חיבור וואטסאפ (Meta API) והגדרות סוכן ה-AI
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    חבר את ה-CRM למספר וואטסאפ אמיתי או למנוע מותאם אישית כדי לאפשר לסוכנת ה-AI לנהל שיחות ישירות עם המועמדים בחברה שלך.
                  </p>
                </div>
                <div className="bg-emerald-50 text-emerald-800 text-xs px-3 py-1.5 rounded-full font-bold flex items-center gap-1.5 border border-emerald-100">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  חיבור רשת פעיל ומאובטח
                </div>
              </div>

              {/* Main Content Layout Grid */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                
                {/* Right Side: Setup Form */}
                <div className="xl:col-span-7 flex flex-col gap-6">
                  
                  <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl">
                    <h4 className="text-sm font-bold text-emerald-950 mb-1 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                      כיצד פועל הסוכן?
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      כאשר המועמד לוחץ על קישור ההצטרפות במודעת הדרושים שלך (בפורמט: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-emerald-700">https://wa.me/&lt;number&gt;</code>) או שולח הודעה ראשונה, סוכנת ה-AI מקבלת את ההודעה, רושמת אותו ב-CRM ומנהלת איתו את שיחת המיון, הראיון והמבחן המעשי על פי ההנחיות והדרישות שהגדרת בכרטיסיית המשרות.
                    </p>
                  </div>

                  <form onSubmit={(e) => { e.preventDefault(); alert("הגדרות וואטסאפ נשמרו בהצלחה בזיכרון הדפדפן!"); setWhatsappConfig(prev => ({ ...prev, isConfigured: true })); }} className="space-y-4">
                    <h4 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-1.5 flex items-center gap-2">
                      <SlidersHorizontal className="w-4 h-4 text-slate-500" />
                      פרטי חיבור API וסודות Meta
                    </h4>

                    {/* Choose Provider Type */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-700">בחר ספק חיבור:</label>
                      <select
                        value={whatsappConfig.provider}
                        onChange={(e) => setWhatsappConfig(prev => ({ ...prev, provider: e.target.value }))}
                        className="text-xs bg-white border border-slate-200 px-3 py-2 rounded-lg focus:ring-1 focus:ring-emerald-500"
                      >
                        <option value="meta_cloud">Meta Cloud API (אינטגרציה רשמית מול פייסבוק מפתחים)</option>
                        <option value="custom_agent">מנוע סוכן חיצוני מותאם אישית / Webhook נפרד</option>
                        <option value="sandbox_sim">סימולטור בדיקות מובנה בלבד (מומלץ להתנסות מיידית)</option>
                      </select>
                    </div>

                    {whatsappConfig.provider === 'meta_cloud' && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Phone Number */}
                          <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold text-slate-700">מספר הטלפון בוואטסאפ (כולל קידומת מדינה):</label>
                            <input
                              type="text"
                              value={whatsappConfig.phoneNumber}
                              onChange={(e) => setWhatsappConfig(prev => ({ ...prev, phoneNumber: e.target.value }))}
                              className="text-xs bg-white border border-slate-200 px-3 py-2 rounded-lg focus:ring-1 focus:ring-emerald-500 font-mono"
                              placeholder="e.g. 972541234567"
                            />
                            <span className="text-[10px] text-slate-400">חובה להסיר את ה-0 הראשון (להשאיר 972 בהתחלה).</span>
                          </div>

                          {/* Phone Number ID */}
                          <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold text-slate-700">מזהה מספר טלפון (Phone Number ID):</label>
                            <input
                              type="text"
                              value={whatsappConfig.phoneNumberId}
                              onChange={(e) => setWhatsappConfig(prev => ({ ...prev, phoneNumberId: e.target.value }))}
                              className="text-xs bg-white border border-slate-200 px-3 py-2 rounded-lg focus:ring-1 focus:ring-emerald-500 font-mono"
                              placeholder="מזהה מספר טלפון מ-Meta Developers"
                            />
                            <span className="text-[10px] text-slate-400">העתק מספר בן 15 ספרות ממסך 'WhatsApp Getting Started'.</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* WABA ID */}
                          <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold text-slate-700">מזהה חשבון עסקי (WhatsApp Business Account ID):</label>
                            <input
                              type="text"
                              value={whatsappConfig.businessAccountId}
                              onChange={(e) => setWhatsappConfig(prev => ({ ...prev, businessAccountId: e.target.value }))}
                              className="text-xs bg-white border border-slate-200 px-3 py-2 rounded-lg focus:ring-1 focus:ring-emerald-500 font-mono"
                              placeholder="מזהה WABA ממפתח פייסבוק"
                            />
                          </div>

                          {/* Verify Token */}
                          <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold text-slate-700">ביטוי אימות וובבוק (Verification Token):</label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                readOnly
                                value={whatsappConfig.webhookVerifyToken}
                                className="text-xs bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg font-mono text-slate-600 flex-1 cursor-default focus:outline-none"
                              />
                            </div>
                            <span className="text-[10px] text-slate-400">העתק ביטוי אבטחה זה והזן אותו בדף הגדרות ה-Webhook של Meta Developers.</span>
                          </div>
                        </div>

                        {/* System Access Token */}
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-bold text-slate-700">אסימון גישה מערכתי קבוע (System User Access Token):</label>
                          <textarea
                            rows={3}
                            value={whatsappConfig.accessToken}
                            onChange={(e) => setWhatsappConfig(prev => ({ ...prev, accessToken: e.target.value }))}
                            className="text-xs bg-white border border-slate-200 p-2.5 rounded-lg focus:ring-1 focus:ring-emerald-500 font-mono"
                            placeholder="הזן כאן את ה-Access Token (מתחיל לרוב ב-EAAd...)"
                          />
                          <span className="text-[10px] text-slate-400">מומלץ להנפיק אסימון קבוע (Never Expire Token) באמצעות משתמש מערכת (System User) על מנת שהחיבור לא יתנתק לאחר מספר ימים.</span>
                        </div>
                      </div>
                    )}

                    {whatsappConfig.provider === 'custom_agent' && (
                      <div className="space-y-4">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-bold text-slate-700">כתובת ה-API של הסוכן החיצוני (Custom Endpoint URL):</label>
                          <input
                            type="url"
                            value={whatsappConfig.customAgentUrl}
                            onChange={(e) => setWhatsappConfig(prev => ({ ...prev, customAgentUrl: e.target.value }))}
                            className="text-xs bg-white border border-slate-200 px-3 py-2 rounded-lg focus:ring-1 focus:ring-emerald-500 font-mono"
                            placeholder="https://api.yourcompany.com/webhook/candidate-chat"
                          />
                          <span className="text-[10px] text-slate-400">במידה ותרצה לנתב את השיחות מול המועמדים לשרת חיצוני שונה הנושא את הבוטים שלכם, הזן כאן את קישור הוובבוק שלו.</span>
                        </div>
                      </div>
                    )}

                    {whatsappConfig.provider === 'sandbox_sim' && (
                      <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl space-y-2">
                        <h5 className="font-bold text-xs flex items-center gap-1.5">
                          <SlidersHorizontal className="w-3.5 h-3.5 text-amber-600" />
                          מצב סימולטור דמו משוער
                        </h5>
                        <p className="text-xs leading-relaxed">
                          כל זרימת ספיחת המועמדים, שיחת הוואטסאפ ושלבי מבדקי הקוד מופעלים עם שכל ובינה מלאכותית מוחלטים באמצעות מנוע ה-AI הראשי של גוגל ישירות דרך <strong>סימולטור קליינט הוואטסאפ המובחר בצד שמאל</strong>.
                        </p>
                        <p className="text-xs leading-relaxed font-bold">
                          תוכלו להתחיל לעבוד, לפרסם ולהריץ שיחות בלחיצה פשוטה על "התחל הדמיית מועמד לתפקיד" בדף הראשי ללא צורך במפתח Meta.
                        </p>
                      </div>
                    )}

                    {/* Callback Webhook URL block under Meta */}
                    {whatsappConfig.provider === 'meta_cloud' && (
                      <div className="p-3 bg-slate-900 text-slate-200 rounded-xl space-y-2 font-mono">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                            כתובת ה-Callback (Webhook URL) להזנה ב-Meta:
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] bg-slate-950 p-2 rounded gap-2 select-all select-text cursor-pointer">
                          <code className="text-emerald-300 font-bold truncate">
                            {window.location.origin}/api/whatsapp/webhook
                          </code>
                          <span className="text-[9px] bg-emerald-800 text-white px-1.5 py-0.5 rounded uppercase font-sans">העתק קישור</span>
                        </div>
                      </div>
                    )}

                    {/* Actions and Testing section */}
                    <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                      <button
                        type="submit"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 px-5 rounded-lg shadow-sm transition-all"
                      >
                        שמור הגדרות מנוע וואטסאפ
                      </button>

                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setIsTestingConnection(true);
                            setConnectionTestResult(null);
                            setTimeout(() => {
                              setIsTestingConnection(false);
                              setConnectionTestResult('success');
                            }, 1200);
                          }}
                          disabled={isTestingConnection}
                          className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs py-2 px-3.5 rounded-lg font-bold transition flex items-center gap-1.5 disabled:opacity-60"
                        >
                          {isTestingConnection ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              מבצע אימות מול שרתי Meta...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="w-3.5 h-3.5" />
                              בצע בדיקת סנכרון ואימות חיבור
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Result toast-inline inside config */}
                    {connectionTestResult === 'success' && (
                      <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-950 rounded-xl flex items-start gap-2 animate-fadeIn">
                        <Check className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <h5 className="font-bold text-xs text-emerald-900">אימות שלבי סנכרון תקין לחלוטין! (Simulated Verified)</h5>
                          <p className="text-[11px] text-emerald-800 leading-normal mt-0.5">
                            כל ערוצי ה-API, אימות ה-Verify Token על ידי Webhook השרת, והרשאת שליחת הודעת Handshake מול מנוע ה-AI בוצעו בהצלחה. החיבור של {whatsappConfig.phoneNumber || 'מספר הדמו'} מוכן לשימוש.
                          </p>
                        </div>
                      </div>
                    )}
                  </form>
                </div>

                {/* Left Side: Rich explanatory FAQ on user questions */}
                <div className="xl:col-span-5 flex flex-col gap-4">
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col gap-4">
                    <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1">
                      <HelpCircle className="w-4 h-4 text-slate-500" />
                      מדריך שאלות ותשובות למגייסים
                    </h4>

                    {/* Question Unit 1 */}
                    <div className="border-b border-slate-100 pb-3">
                      <h5 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-700"></span>
                        איך גורמים לסוכן ה-AI לפעול בוואטסאפ בפועל?
                      </h5>
                      <p className="text-[11px] text-slate-600 leading-relaxed mt-1">
                        יוצרים חשבון מפתח בפורטל פייסבוק מפתחים (<a href="https://developers.facebook.com" target="_blank" rel="noreferrer" className="text-blue-600 font-medium underline inline-flex items-center gap-0.5">developers.facebook.com <ExternalLink className="w-2.5 h-2.5" /></a>), מייצרים App מסוג Business/WhatsApp ומקבלים מפתח גישה ואת מזהה המספר. מעתיקים את הנתונים עבור ה-API לכאן, ומגדירים את ה-Callback URL וה-Verify Token בפורטל מול פייסבוק כדי שההודעות יתנבו לשרת שלנו.
                      </p>
                    </div>

                    {/* Question Unit 2 */}
                    <div className="border-b border-slate-100 pb-3">
                      <h5 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-700"></span>
                        אם אני שם מספר וואטסאפ שלי שקיים זה יעבוד?
                      </h5>
                      <p className="text-[11px] text-slate-600 leading-relaxed mt-1">
                        <strong>חשיבות עליונה:</strong> לא מומלץ להשתמש במספר המשמש אותך בטלפון הנייד האישי. ברגע שמספר טלפון מחובר ל-WhatsApp Cloud API הרשמי של Meta, <strong>לא ניתן להשתמש בו באפליקציית וואטסאפ הרגילה בטלפון</strong> והוא יתנתק ממנה מיד. חובה להשתמש במספר וירטואלי/נקי, או במספר הניסויים ש-Meta מעניקה בחינם.
                      </p>
                    </div>

                    {/* Question Unit 3 */}
                    <div className="border-b border-slate-100 pb-3">
                      <h5 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-700"></span>
                        האם בכרטיסייה של כל מועמד אראה גם את היסטוריית השיחה?
                      </h5>
                      <p className="text-[11px] text-slate-600 leading-relaxed mt-1">
                        <strong>כן, באופן מלא!</strong> כל הודעה המתקבלת מהמועמד בוואטסאפ מעדכנת את לוח ה-CRM של המגייסת בזמן אמת, והתגובות של סוכנת ה-AI מתווספות לצ'אט בהתאם. מערכת ההתראות תתריע על שינוי בסטטוס המועמד (התקדמות למבחן קוד, ציפיות שכר לא תואמות וכד').
                      </p>
                    </div>

                    {/* Question Unit 4 */}
                    <div className="border-b border-slate-100 pb-3">
                      <h5 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-700"></span>
                        מבחינת תשלום ועלויות - האם זה בתשלום או חינם?
                      </h5>
                      <p className="text-[11px] text-slate-600 leading-relaxed mt-1">
                        המערכת והסימולטור נועדו לפעול מיידית ללא תשלום. מנוח ה-AI (Gemini) מעניק מכסות חינמיות רחבות במיוחד ב-AI Studio. Meta מעניקה לכל עסק <strong>1,000 שיחות וואטסאפ חינמיות לחלוטין בכל חודש מחדש</strong>! מעבר לכך, העלויות הן מספר אגורות בודד לכל שיחה מרובת הודעות מול מועמד על פי התמחור הרשמי של Meta.
                      </p>
                    </div>

                    {/* Question Unit 5 */}
                    <div>
                      <h5 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-700"></span>
                        האם יש אפשרות לחבר בוט או סוכן עצמאי של חברות?
                      </h5>
                      <p className="text-[11px] text-slate-600 leading-relaxed mt-1">
                        בהחלט. המערכת עוצבה עם עקרון הארכיטקטורה הפתוחה. בקשר של ספק מותאם אישית (Custom Provider), חברות יכולות לקשר את לוח הבקרה ויכולות מנהל משאבי האנוש לבוטים פנימיים משלהן באמצעות שרתי Webhook שלהן, ובכך ליהנות משילוב מושלם של CRM הגיוס יחד עם קוד ה-AI הקיים של הארגון.
                      </p>
                    </div>

                  </div>
                </div>

              </div>

            </div>
          )}

          {activeViewTab === 'candidates' && (
            <div className="flex flex-col gap-6" id="candidates-crm-list-view">
              
              {/* Filter and Advanced Sorting Toolbar */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
                
                <div className="relative w-full md:w-72 shrink-0">
                  <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                  <input
                    type="text"
                    placeholder="חפש מועמד לפי שם, משרה..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pr-9 pl-3 py-2 text-xs bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-lg focus:outline-none"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full justify-start md:justify-end">
                  <div className="flex items-center gap-1.5">
                    <Filter className="w-3.5 h-3.5 text-slate-500" />
                    <select
                      value={filterPositionId}
                      onChange={(e) => setFilterPositionId(e.target.value)}
                      className="text-xs bg-slate-50 border border-slate-200 px-2 py-1.5 rounded-lg focus:outline-none focus:border-emerald-500"
                    >
                      <option value="all">כל התפקידים</option>
                      {positions.map(p => (
                        <option key={p.id} value={p.id}>{p.title}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-slate-500">סטטוס:</span>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="text-xs bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-emerald-500"
                    >
                      <option value="all">הכל</option>
                      <option value="interview">ראיון סינון</option>
                      <option value="test">מבדק מעשי</option>
                      <option value="completed">סיים מבדק</option>
                      <option value="signed">חוזה נחתם</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="text-xs bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-emerald-500 font-semibold"
                    >
                      <option value="score">דירוג התאמה AI (הכי מתאים)</option>
                      <option value="experience">ותק מבוקש</option>
                      <option value="salary">ציפיית שכר נמוכה</option>
                    </select>
                  </div>
                </div>

              </div>

              {/* קובית הגדרות הסוכן (Agent Settings Segment) */}
              <div className="bg-emerald-50/40 border border-emerald-200 rounded-2xl p-4 md:p-5 flex flex-col gap-3.5 shadow-xs transition-all duration-300">
                <div 
                  onClick={() => setShowAgentSettings(!showAgentSettings)}
                  className="flex items-center justify-between cursor-pointer select-none"
                >
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-emerald-600 rounded-lg text-white">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-emerald-950 flex items-center gap-2">
                        קוביית שליטה והנחיות – סוכנת ה-AI הגיוס
                        <span className="text-[10px] bg-emerald-600 text-teal-50 px-2 py-0.2 rounded-full font-bold">מכוון מטרה</span>
                      </h4>
                      <p className="text-[11px] text-emerald-700">שלוט בזמן אמת בזהות, במטרות ובטון איתו ה-AI מדבר עם המועמדים בוואטסאפ</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-emerald-800 bg-emerald-100/50 px-2 py-1 rounded">סוכנת פעילה: {agentSettings.personaName}</span>
                    <button className="text-xs text-emerald-800 hover:text-emerald-950 underline font-bold">
                      {showAgentSettings ? "▲ כווץ הגדרות" : "▼ הרחב הגדרות"}
                    </button>
                  </div>
                </div>

                {showAgentSettings && (
                  <div className="space-y-3.5 pt-3.5 border-t border-emerald-100 ease-in-out">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Persona Name */}
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-slate-700">שם הסוכנת (הבוט בסימולטור):</label>
                        <input
                          type="text"
                          value={agentSettings.personaName}
                          onChange={(e) => setAgentSettings(prev => ({ ...prev, personaName: e.target.value }))}
                          className="text-xs bg-white border border-slate-200 px-3 py-2 rounded-lg focus:outline-none focus:border-emerald-500 font-bold"
                          placeholder="איימי"
                        />
                      </div>

                      {/* Conversational Tone */}
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-slate-700">טון וסגנון השיחה עם מועמדים:</label>
                        <select
                          value={agentSettings.conversationalTone}
                          onChange={(e) => setAgentSettings(prev => ({ ...prev, conversationalTone: e.target.value as any }))}
                          className="text-xs bg-white border border-slate-200 px-2.5 py-2 rounded-lg focus:outline-none focus:border-emerald-500 font-medium"
                        >
                          <option value="friendly">😊 חברותי, חם ומעודד (מומלץ)</option>
                          <option value="professional">💼 ייצוגי ורשמי מאוד</option>
                          <option value="strict">🔍 קפדני ואנליטי</option>
                          <option value="concise">⚡ קצר, תמציתי וממוקד שאלות</option>
                        </select>
                      </div>
                    </div>

                    {/* Custom Objective */}
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-slate-700">מטרת העל של הראיון (Objective):</label>
                      <textarea
                        value={agentSettings.customObjective}
                        rows={2}
                        onChange={(e) => setAgentSettings(prev => ({ ...prev, customObjective: e.target.value }))}
                        className="text-xs bg-white border border-slate-200 p-2.5 rounded-lg focus:outline-none focus:border-emerald-500 leading-relaxed"
                        placeholder="כתוב מה ה-AI צריך להשיג מכל מועמד..."
                      />
                    </div>

                    {/* Critical Guidelines */}
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-slate-700">הנחיות קריטיות ודגשים מיוחדים (Guidelines):</label>
                      <textarea
                        value={agentSettings.additionalGuidelines}
                        rows={2}
                        onChange={(e) => setAgentSettings(prev => ({ ...prev, additionalGuidelines: e.target.value }))}
                        className="text-xs bg-white border border-slate-200 p-2.5 rounded-lg focus:outline-none focus:border-emerald-500 leading-normal"
                        placeholder="רישום הנחיות קשיחות לשיחה..."
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Grid of Candidate Records */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Candidates List Column */}
                <div className="card-list flex flex-col gap-3 max-h-[850px] overflow-y-auto pr-1">
                  {filteredCandidates.length === 0 ? (
                    <div className="text-center bg-white py-12 rounded-2xl border border-slate-200 shadow-xs">
                      <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-500 font-medium text-sm">לא נמצאו מועמדים התואמים את הסינון הנוכחי.</p>
                      <p className="text-xs text-slate-400 mt-1">נסה לשנות את פרמטרי הסינון או להוסיף מועמד חדש.</p>
                    </div>
                  ) : (
                    filteredCandidates.map(cand => {
                      const pos = positions.find(p => p.id === cand.positionId);
                      const isSelected = cand.id === selectedCandidateId;

                      return (
                        <div
                          key={cand.id}
                          className={`border rounded-xl p-4 transition-all cursor-pointer text-right flex flex-col justify-between gap-3 relative ${isSelected ? 'border-amber-500 bg-amber-50/20 shadow-xs' : 'border-slate-200 bg-white hover:border-slate-300 shadow-2xs'}`}
                          onClick={() => setSelectedCandidateId(cand.id)}
                        >
                          {/* Score visual badge */}
                          <div className="absolute left-4 top-4 flex items-center justify-center">
                            <div className="flex flex-col items-center">
                              <span className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold font-mono border-2 ${cand.score >= 90 ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : cand.score >= 80 ? 'bg-teal-50 border-teal-500 text-teal-700' : 'bg-slate-50 border-slate-400 text-slate-700'}`}>
                                {cand.score}%
                              </span>
                              <span className="text-[9px] text-slate-400 font-semibold mt-1">התאמה</span>
                            </div>
                          </div>

                          <div className="pl-12">
                            <span className="text-xs bg-slate-100 px-2 py-0.5 rounded font-mono text-slate-600 mb-1 inline-block">
                              ID: {cand.id.substring(0, 7)}
                            </span>
                            <h4 className="font-bold text-slate-900 text-base flex items-center gap-1.5">
                              {cand.name}
                            </h4>
                            <p className="text-xs text-emerald-800 font-medium mt-1">{pos?.title || "משרה כללית"}</p>
                            
                            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-500">
                              <span>📧 {cand.email}</span>
                              <span>📞 {cand.phone}</span>
                            </div>
                          </div>

                          {/* Status and salary pill */}
                          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1.5">
                              <span className="text-slate-400">שכר מבוקש:</span>
                              <strong className="text-slate-800">{cand.requestedSalary || "לא צוין"}</strong>
                            </div>

                            <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                              cand.status === 'signed' ? 'bg-emerald-100 text-emerald-800' : 
                              cand.status === 'completed' ? 'bg-blue-100 text-blue-800' : 
                              cand.status === 'test' ? 'bg-yellow-100 text-yellow-800' : 
                              'bg-indigo-50 text-indigo-700'
                            }`}>
                              {cand.status === 'signed' ? '✓ חוזה נחתם' : 
                               cand.status === 'completed' ? 'מבדק הושלם' : 
                               cand.status === 'test' ? 'מבדק מעשי פעיל' : 
                               'סינון ראשוני (בוט)'}
                            </span>
                          </div>

                          {/* Simulators Quick actions */}
                          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100/50">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleHrSimulateWhatsAppClick(cand.id);
                              }}
                              className="text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded font-semibold text-[11px] flex items-center gap-1 transition"
                            >
                              <MessageSquare className="w-3 h-3" />
                              פתח צ'אט סימולטור
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveCandidate(cand.id);
                              }}
                              className="text-red-600 hover:bg-red-50 p-1.5 rounded transition"
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

                {/* Candidate detailed view on selected */}
                <div className="candidate-details-pane bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col gap-5 min-h-[500px]">
                  {selectedCandidate ? (
                    (() => {
                      const pos = positions.find(p => p.id === selectedCandidate.positionId);
                      return (
                        <div className="flex flex-col gap-4 animate-fadeIn">
                          
                          {/* Pane Header */}
                          <div className="flex justify-between items-start border-b border-slate-100 pb-3 gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="text-lg font-bold text-slate-950">{selectedCandidate.name}</h3>
                                <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${selectedCandidate.status === 'signed' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'}`}>
                                  {selectedCandidate.status === 'signed' ? 'מגויס!' : 'בתהליך סינון'}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 italic mt-0.5">משרה מועמדת: {pos?.title || "לא זמין"}</p>
                            </div>

                            <div className="text-left shrink-0">
                              <span className="text-2xl font-extrabold text-emerald-600 tracking-tight font-mono">{selectedCandidate.score}/100</span>
                              <p className="text-[10px] text-slate-400 font-bold uppercase">התאמה כללית AI</p>
                            </div>
                          </div>

                          {/* Quick Contact Info */}
                          <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                            <div>
                              <span className="text-slate-400 block">טלפון נייד:</span>
                              <strong className="text-slate-800">{selectedCandidate.phone}</strong>
                            </div>
                            <div>
                              <span className="text-slate-400 block">אימייל:</span>
                              <strong className="text-slate-800 text-left block truncate">{selectedCandidate.email}</strong>
                            </div>
                            <div className="col-span-2 border-t border-slate-200/50 pt-2 flex items-center justify-between">
                              <div>
                                <span className="text-slate-400 block">תוצאות שכר (הערכה וציפיות):</span>
                                <strong className="text-slate-800">{selectedCandidate.requestedSalary} ש"ח בחודש</strong>
                              </div>
                              <span className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.5 rounded font-bold">
                                מבוסס AI
                              </span>
                            </div>
                          </div>

                          {/* Salary Analysis feedback from AI */}
                          <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100/50 text-xs text-emerald-900 flex items-start gap-2">
                            <DollarSign className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            <div>
                              <strong className="block">ניתוח שכר ותאימות לתקציב:</strong>
                              <p className="mt-1 leading-relaxed text-slate-700">{selectedCandidate.salaryFitAnalysis || "ניתוח מקיף של ציפיית השכר יופק בסיום הראיון הראשוני בוואטסאפ."}</p>
                            </div>
                          </div>

                          {/* Tabs within Detail view */}
                          <article className="flex flex-col gap-3">
                            
                            {/* Segment 1: AI Evaluation */}
                            <div className="border border-slate-200 rounded-xl p-3 bg-white">
                              <div className="flex items-center gap-2 text-slate-900 font-bold text-xs pb-2 border-b border-slate-100">
                                <Sparkles className="w-4 h-4 text-slate-500 text-yellow-500" />
                                <span>חוות דעת סוכנת הגיוס AI (איימי):</span>
                              </div>
                              <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed mt-2 p-1.5 bg-slate-50 rounded">
                                {selectedCandidate.aiFitSummary}
                              </p>
                            </div>

                            {/* Segment 2: Practical test feedback */}
                            <div className="border border-slate-200 rounded-xl p-3 bg-white">
                              <div className="flex items-center justify-between text-slate-900 font-bold text-xs pb-2 border-b border-slate-100">
                                <div className="flex items-center gap-2">
                                  <CheckSquare className="w-4 h-4 text-slate-500 text-blue-500" />
                                  <span>מבדק מעשי והערכת קוד:</span>
                                </div>
                                <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded text-[10px] font-mono">
                                  תרגיל AI מותאם
                                </span>
                              </div>
                              
                              {selectedCandidate.testAnswers ? (
                                <div className="mt-2 flex flex-col gap-2">
                                  <div className="text-[11px] bg-slate-900 text-slate-100 p-2 rounded-lg font-mono whitespace-pre overflow-x-auto text-left" dir="ltr">
                                    {selectedCandidate.testAnswers}
                                  </div>
                                  <div className="text-xs text-slate-700 bg-amber-50/50 p-2.5 rounded border border-amber-100">
                                    <strong className="text-amber-900 block mb-1">ניתוח פתרון המבחן:</strong>
                                    <p className="leading-relaxed">{selectedCandidate.testFeedback}</p>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-xs text-slate-500 italic mt-2 text-center py-2">המועמד טרם הגיש פתרון למבחן המעשי.</p>
                              )}
                            </div>

                            {/* Segment 3: HR Recruiter Manual Notepad */}
                            <div className="border border-slate-200 rounded-xl p-3 bg-white">
                              <div className="flex items-center justify-between text-slate-900 font-bold text-xs pb-2 border-b border-slate-100">
                                <div className="flex items-center gap-2">
                                  <FileText className="w-4 h-4 text-emerald-600" />
                                  <span>כתיבה חופשית והערות גיוס (CRM):</span>
                                </div>
                                <span className="text-[10px] text-slate-400">שמירה מקומית אוטומטית</span>
                              </div>
                              <div className="mt-2 flex flex-col gap-2">
                                <textarea
                                  placeholder="תוכל לכתוב כאן בחופשיות הערות, שיחות טלפון או לתעד שיחות מוואטסאפ באופן ידני..."
                                  value={currentNotesBuffer}
                                  onChange={(e) => {
                                    setCurrentNotesBuffer(e.target.value);
                                    // Live edit update candidate state
                                    setCandidates(prev => prev.map(c => c.id === selectedCandidateId ? { ...c, hrNotes: e.target.value } : c));
                                  }}
                                  className="w-full h-24 p-2 text-xs bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:bg-white"
                                />
                                <button
                                  onClick={handleSaveNotes}
                                  className="bg-slate-900 hover:bg-slate-800 text-white text-[11px] py-1.5 px-3 rounded font-semibold self-end transition flex items-center gap-1 cursor-pointer"
                                >
                                  <Check className="w-3.5 h-3.5" /> שמור הערות בכרטיסייה
                                </button>
                              </div>
                            </div>
                                   
                                   {/* Segment 4: Dynamic Employment Contract workflow */}
                            {pos && (
                              <div className="border border-slate-200 rounded-xl p-3 bg-white flex flex-col gap-3">
                                
                                {/* Header with Title and Dropdown selection */}
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-1.5 border-b border-slate-100 gap-2">
                                  <div className="flex items-center gap-1.5 text-slate-900 font-bold text-xs" id="interactive-contract-workspace">
                                    <FileSignature className="w-4 h-4 text-emerald-600" />
                                    <span>חוזה העסקה וטפסי קליטה אינטראקטיביים (משוך ואכלס):</span>
                                  </div>
                                  
                                  {/* Dropdown to pool different document structures */}
                                  <div className="flex items-center gap-1.5 w-full sm:w-auto">
                                    <span className="text-[10px] text-slate-500 font-semibold whitespace-nowrap">משוך טופס:</span>
                                    <select
                                      value={selectedContractTemplateId}
                                      onChange={(e) => setSelectedContractTemplateId(e.target.value)}
                                      className="text-[11px] bg-slate-50 border border-slate-200 px-2 py-1 rounded w-full sm:w-auto focus:outline-none focus:border-emerald-500 font-bold text-slate-700 cursor-pointer"
                                    >
                                      <option value="baseline">📄 חוזה העסקה בסיסי ({pos.title})</option>
                                      {uploadedContracts.map(doc => (
                                        <option key={doc.id} value={doc.id}>📎 {doc.name}</option>
                                      ))}
                                    </select>
                                  </div>
                                </div>

                                {/* Channel Selection Buttons */}
                                   <div className="flex flex-wrap items-center gap-2 justify-start border-t border-slate-100 pt-2.5">
                                     <span className="text-[10px] text-slate-500 font-bold">שידור והפצה:</span>
                                     
                                     <button
                                       onClick={() => handleSendDraftContractCustom(selectedCandidate.id, 'whatsapp')}
                                       className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] py-1.5 px-3 rounded font-bold transition flex items-center gap-1 shadow-xs cursor-pointer"
                                     >
                                       <Send className="w-3.5 h-3.5" /> שלח חוזה לוואטסאפ למועמד
                                     </button>

                                     <button
                                       onClick={() => handleSendDraftContractCustom(selectedCandidate.id, 'email')}
                                       className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] py-1.5 px-3 rounded font-semibold transition flex items-center gap-1 shadow-xs cursor-pointer"
                                     >
                                       <Mail className="w-3.5 h-3.5" /> שלח עותק חתום למייל
                                     </button>
                                   </div>

                                   {/* Signing Status Flow indicator */}
                                   <div className="mt-2 flex items-center gap-2 justify-end">
                                     {!selectedCandidate.contractSent ? (
                                       <span className="text-slate-500 text-[11px] bg-slate-100 px-2.5 py-1 rounded-full font-medium">
                                         ℹ️ מסמך הגיוס ממתין להפצה - בחר ערוץ שליחה מעלה
                                       </span>
                                     ) : !selectedCandidate.contractSigned ? (
                                       <div className="flex flex-col sm:flex-row items-center gap-2 w-full justify-between bg-amber-50 p-2 rounded-lg border border-amber-200">
                                         <span className="text-amber-800 font-bold text-[11px]">
                                           ⏱ הקישור נמסר בהצלחה. ממתין לחתימה דיגיטלית של המועמד
                                         </span>
                                         <button
                                           onClick={() => handleSimulateCandidateSigning(selectedCandidate.id)}
                                           className="bg-amber-600 hover:bg-amber-700 text-white text-[11px] py-1 px-2.5 rounded font-bold transition flex items-center gap-1 shadow-sm shrink-0"
                                         >
                                           <FileCheck className="w-3.5 h-3.5" /> הדמיית מועמד: חתום בטלפון
                                         </button>
                                       </div>
                                     ) : (
                                       <div className="bg-emerald-100 text-emerald-950 border border-emerald-300 rounded-lg px-3 py-2 text-xs font-bold w-full text-center flex items-center justify-center gap-1.5 shadow-xs">
                                         <UserCheck className="w-4 h-4 text-emerald-800" />
                                         מזל טוב! החוזה הוחזר חתום אלקטרונית והמועמד גויס לחברה בהצלחה! 🎉
                                       </div>
                                     )}
                                   </div>

                                  <div className="flex flex-col gap-1">
                                  <div className="flex justify-between items-center text-[10px] text-slate-400">
                                    <span>הטקסט נמשך וממולא אוטומטית לפי פרטי המועמד (כתיבה ועריכה חופשית ✍️)</span>
                                    <span className="text-emerald-750 font-bold bg-emerald-50/75 px-1.5 py-0.5 rounded font-mono">מלא בפרטי מועמד</span>
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
                                    className="w-full text-xs font-serif leading-relaxed p-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:ring-1 focus:ring-emerald-500 resize-y font-medium font-sans"
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
                    <div className="text-center text-slate-400 py-16 italic font-sans bg-[#fafbfe]/40 rounded-xl border border-dashed border-slate-200 flex flex-col items-center justify-center gap-1">
                      <span>✍️ בחר מועמד ברשימה למעלה כדי לצפות בפרטים, הערכות, דפי מבדקים וחוזי קליטה.</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </section>

        {/* Right Side: Interactive WhatsApp Dialog Live Simulator */}
        <section className="lg:col-span-4 flex flex-col gap-4" id="whatsapp-phone-simulator">
          
          <div className="bg-emerald-950 text-white p-3.5 rounded-t-3xl shadow-sm border-b border-emerald-900/40">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping inline-block"></span>
              סימולטור וואטסאפ (AI Candidates Client)
            </h3>
            <p className="text-[11px] text-emerald-200 mt-0.5">כאן דמויות המועמדים משוחחות ישירות מול המלווה החכמה "איימי".</p>
          </div>

          {/* Virtual Mobile Screen */}
          <div className="border-4 border-slate-900 rounded-b-3xl shadow-xl bg-[#efeae2] flex flex-col h-[650px] relative overflow-hidden">
            
            {/* Mobile Status Bar */}
            <header className="bg-[#075e54] text-white px-3 py-2 flex items-center justify-between shadow-sm shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-slate-800 font-bold shrink-0 shadow-sm">
                  🤖
                </div>
                <div>
                  <h4 className="font-bold text-xs">איימי – סוכנת גיוס חכמה</h4>
                  <span className="text-[10px] text-emerald-200">מחוברת כעת (סוכן גיוס AI)</span>
                </div>
              </div>

              {/* Position Info display */}
              {activeWhatsappPosition && (
                <div className="text-left shrink-0 max-w-[120px]">
                  <span className="text-[9px] bg-emerald-800 text-teal-100 px-1.5 py-0.5 rounded block truncate" title={activeWhatsappPosition.title}>
                    {activeWhatsappPosition.title}
                  </span>
                </div>
              )}
            </header>

            {/* Candidate Selector display */}
            <div className="bg-white/90 p-2 border-b border-slate-200 flex items-center justify-between text-xs shrink-0">
              <span className="text-slate-500 font-semibold">שיחה מול:</span>
              <select
                value={whatsappCandidateId || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setWhatsappCandidateId(val || null);
                  if (val) {
                    setSelectedCandidateId(val);
                  }
                }}
                className="bg-slate-50 border border-slate-200 px-2 py-1 rounded text-slate-800 focus:outline-none"
              >
                <option value="">בחר מועמד לשיחה בסימולטור</option>
                {candidates.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({positions.find(p => p.id === c.positionId)?.title.substring(0, 15)}...)</option>
                ))}
              </select>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 p-3 overflow-y-auto space-y-3.5 flex flex-col">
              
              {activeWhatsappCandidate ? (
                <>
                  <div className="text-center">
                    <span className="bg-[#d1ea24]/90 text-slate-900 border border-yellow-200 text-[10px] px-2.5 py-1 rounded-md inline-block shadow-2xs">
                      🔒 שיחה זו מאובטחת ומנוהלת ישירות על ידי סוכן הגיוס החכם של HR
                    </span>
                  </div>

                  {(activeWhatsappCandidate.chatTranscript || []).map((msg, i) => {
                    const isCandidate = msg.sender === 'candidate';
                    const isBot = msg.sender === 'bot';
                    
                    return (
                      <div 
                        key={i} 
                        className={`max-w-[85%] rounded-lg p-2.5 text-xs shadow-3xs leading-relaxed transition-all ${
                          isCandidate 
                            ? 'bg-[#e2f9cd] text-slate-900 self-end rounded-tr-none' 
                            : isBot 
                              ? 'bg-white text-slate-900 self-start rounded-tl-none border border-slate-100'
                              : 'bg-indigo-50 text-indigo-900 self-center'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                        <span className="text-[9px] text-slate-400 text-left block mt-1 font-mono">{msg.timestamp || 'עכשיו'}</span>
                      </div>
                    );
                  })}

                  {isBotResponding && (
                    <div className="bg-white/80 border border-slate-100 self-start rounded-lg rounded-tl-none p-2 max-w-[80%] text-xs shadow-3xs text-slate-500 flex items-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                      <span>איימי מקלידה תגובה חכמה...</span>
                    </div>
                  )}

                  <div ref={chatEndRef} />
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-3 text-center text-slate-400">
                  <MessageSquare className="w-12 h-12 text-slate-300 mb-2" />
                  <p className="text-xs font-semibold">מידע לא טעון</p>
                  <p className="text-[10px] text-slate-400 mt-1">בחר מועמד מהרשימה למעלה או צור מועמד חדש כדי להתחיל את הדמיית השיחה.</p>
                </div>
              )}
            </div>

            {/* Input WhatsApp Message Panel */}
            {activeWhatsappCandidate && (
              <form 
                onSubmit={handleCandidateSendMessage}
                className="bg-[#f0f0f0] p-2 flex items-center gap-1.5 border-t border-slate-200 shrink-0"
              >
                <input
                  type="text"
                  placeholder="הקלד כאן כעובד/מועמד (למשל תשובה, ציפיות שכר או קוד מבדק)..."
                  value={whatsappInputValue}
                  onChange={(e) => setWhatsappInputValue(e.target.value)}
                  disabled={isBotResponding}
                  className="flex-1 px-3 py-2 text-xs bg-white border border-slate-300 rounded-full focus:outline-none focus:border-emerald-600 disabled:opacity-75"
                />
                <button
                  type="submit"
                  disabled={!whatsappInputValue.trim() || isBotResponding}
                  className="bg-[#075e54] hover:bg-[#128c7e] text-white p-2.5 rounded-full transition shrink-0 disabled:opacity-50"
                >
                  <Send className="w-4 h-4 transform rotate-180" />
                </button>
              </form>
            )}

          </div>

          {/* Quick Helper prompts for candidate testing */}
          {activeWhatsappCandidate && (
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-col gap-2">
              <span className="text-[11px] font-bold text-slate-500 block">💡 פקודות סימולציה מהירות עבור מועמדים ברגע זה:</span>
              
              <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                <button
                  onClick={() => {
                    const sample = activeWhatsappCandidate.status === 'test' 
                      ? "הנה פתרון הקוד למבחן בסמארטפון שלי: SELECT product_category, AVG(sales) ..." 
                      : "היי, שמי ישראל ישראלי והאימייל שלי yisrael@gmail.com, נעים מאוד!";
                    setWhatsappInputValue(sample);
                  }}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1.5 rounded transition text-right truncate"
                >
                  {activeWhatsappCandidate.status === 'test' ? '✍️ הדמיית הגשת מבדק' : '👤 הדמיית שיחת היכרות'}
                </button>
                <button
                  onClick={() => {
                    setWhatsappInputValue("ציפיית השכר המלאה שלי היא 25,000 ש\"ח בחודש.");
                  }}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1.5 rounded transition text-right"
                >
                  💸 הגדרת ציפיית שכר
                </button>
              </div>
            </div>
          )}

        </section>

      </main>

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
                    className="p-2 text-xs border border-slate-200 rounded focus:outline-none focus:border-emerald-600"
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
                    className="p-2 text-xs border border-slate-200 rounded focus:outline-none focus:border-emerald-600"
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
                    className="p-2 text-xs border border-slate-200 rounded focus:outline-none focus:border-emerald-600 mt-1"
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
                    className="p-2 text-xs border border-slate-200 rounded focus:outline-none focus:border-emerald-600 mt-1"
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
                  className="p-2 text-xs h-20 border border-slate-200 rounded focus:outline-none focus:border-emerald-600"
                />
              </div>

              {/* Baseline Employment Contract template */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">הסכם העסקה להדמיית חתימה דיגיטלית (חוזה מותאם):</label>
                <textarea
                  placeholder="כתוב נוסח בסיסי של חוזה ההעסקה. תוכל להשתמש בפרמטרים מוחלפים כגון {name} ו-{salary}."
                  value={newPositionContract}
                  onChange={(e) => setNewPositionContract(e.target.value)}
                  className="p-2 text-xs h-24 border border-slate-200 rounded focus:outline-none focus:border-emerald-600 font-mono"
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
