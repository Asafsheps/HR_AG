// ==================================================
// Application Constants
// ==================================================

export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "HR AG";
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// Candidate pipeline stages in display order
export const CANDIDATE_STAGES = [
  { key: "new",                   label: "New",                  color: "neutral" },
  { key: "screening",             label: "Screening",            color: "info" },
  { key: "whatsapp_interview",    label: "WhatsApp Interview",   color: "info" },
  { key: "assignment_sent",       label: "Assignment Sent",      color: "warning" },
  { key: "assignment_submitted",  label: "Assignment Submitted", color: "warning" },
  { key: "under_review",          label: "Under Review",         color: "warning" },
  { key: "shortlisted",           label: "Shortlisted",          color: "success" },
  { key: "rejected",              label: "Rejected",             color: "danger" },
  { key: "hired",                 label: "Hired",                color: "success" },
  { key: "withdrawn",             label: "Withdrawn",            color: "neutral" },
] as const;

export const JOB_STATUS_LABELS: Record<string, string> = {
  draft:    "Draft",
  active:   "Active",
  paused:   "Paused",
  closed:   "Closed",
  archived: "Archived",
};

// AI scoring thresholds
export const AI_SCORE_THRESHOLDS = {
  HIGH:   80,  // Strongly recommend proceeding
  MEDIUM: 55,  // Borderline — human review recommended
  LOW:    0,   // Below this: likely reject
} as const;

// Pagination
export const DEFAULT_PAGE_SIZE = 20;

// Assignment deadlines (hours)
export const ASSIGNMENT_DEADLINE_OPTIONS = [24, 48, 72, 120, 168] as const;
