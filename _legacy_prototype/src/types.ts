/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ChatMessage {
  sender: 'candidate' | 'bot' | 'hr';
  text: string;
  timestamp: string;
}

export interface Position {
  id: string;
  title: string;
  experienceYears: number;
  requirements: string[]; // Criteria checklist defined by HR (e.g. "React development", "5 years Node.js")
  questions: string[]; // HR custom questions to ask the candidate in WhatsApp
  testPrompt: string; // Guidelines on what the dynamic test should examine (e.g. "Writing a simple SQL query and explaining closures in JS")
  contractTemplate: string; // The baseline contract text template
  isActive: boolean;
  createdAt: string;
}

export interface Candidate {
  id: string;
  positionId: string;
  name: string;
  phone: string;
  email: string;
  status: 'interview' | 'test' | 'completed' | 'signed' | 'rejected';
  requestedSalary: string;
  salaryFitAnalysis: string; // e.g. "In line with market average", "High, budget is 20k max"
  experienceSummary: string; // e.g. "5 years of analyst role"
  score: number; // Fit rating (0 - 100)
  aiFitSummary: string; // Feedback from recruitment AI agent
  testAnswers: string; // Candidate answers to the technical test
  testFeedback: string; // AI score and assessment of the test answers
  chatTranscript: ChatMessage[]; // Simulated WhatsApp message transcript
  hrNotes: string; // Free-text notes taken by the HR recruiter
  contractSent: boolean;
  contractSigned: boolean;
  updatedAt: string;
  customContractContent?: string; // Loaded from custom drafted contracts/uploaded files
}

export interface AgentSettings {
  personaName: string;
  customObjective: string; // Dynamic instructions representing AI agent target behavior
  conversationalTone: 'friendly' | 'professional' | 'strict' | 'concise';
  additionalGuidelines: string;
}

export interface UploadedContractTemplate {
  id: string;
  name: string;
  content: string;
  fileType: string;
  fileSize: string;
  uploadedAt: string;
}

export interface Organization {
  id: string;
  name: string;
  allowedDomains: string[];
  allowedEmails: string[];
  createdAt: string;
  // Stats
  userCount?: number;
  positionCount?: number;
  candidateCount?: number;
}

export interface UserProfile {
  id: string;
  email: string;
  role: 'superadmin' | 'admin' | 'recruiter';
  organizationId: string;
  organizationName: string;
  createdAt: string;
}

