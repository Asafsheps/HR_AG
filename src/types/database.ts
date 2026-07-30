// ==================================================
// HR Project — Supabase Database Types
// ==================================================
// Reflects the schema defined in supabase/migrations/.
// Run `npm run db:generate-types` after connecting Supabase
// to auto-regenerate this file from the live schema.
// ==================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// --------------------------------------------------
// Enum mirror types (match PostgreSQL enums)
// --------------------------------------------------
export type DbUserRole         = "super_admin" | "admin" | "recruiter" | "viewer";
export type DbJobStatus        = "draft" | "active" | "paused" | "closed" | "archived";
export type DbEmploymentType   = "full_time" | "part_time" | "contract" | "internship";
export type DbCandidateStatus  =
  | "new" | "screening" | "whatsapp_interview"
  | "assignment_sent" | "assignment_submitted" | "under_review"
  | "shortlisted" | "rejected" | "hired" | "withdrawn";
export type DbMessageDirection = "inbound" | "outbound";
export type DbMessageSender    = "candidate" | "ai" | "recruiter";
export type DbAssignmentStatus = "pending" | "sent" | "submitted" | "evaluated" | "expired";
export type DbAiRecommendation = "proceed" | "borderline" | "reject";

// --------------------------------------------------
// Database interface
// --------------------------------------------------
export interface Database {
  public: {
    Tables: {

      organizations: {
        Row: {
          id:         string;
          name:       string;
          slug:       string;
          logo_url:   string | null;
          plan:       string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?:        string;
          name:       string;
          slug:       string;
          logo_url?:  string | null;
          plan?:      string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?:      string;
          slug?:      string;
          logo_url?:  string | null;
          plan?:      string;
          updated_at?: string;
        };
      };

      recruiter_profiles: {
        Row: {
          id:              string;
          organization_id: string;
          full_name:       string;
          avatar_url:      string | null;
          role:            DbUserRole;
          is_active:       boolean;
          created_at:      string;
          updated_at:      string;
        };
        Insert: {
          id:              string;
          organization_id: string;
          full_name:       string;
          avatar_url?:     string | null;
          role?:           DbUserRole;
          is_active?:      boolean;
          created_at?:     string;
          updated_at?:     string;
        };
        Update: {
          full_name?:  string;
          avatar_url?: string | null;
          role?:       DbUserRole;
          is_active?:  boolean;
          updated_at?: string;
        };
      };

      jobs: {
        Row: {
          id:                       string;
          organization_id:          string;
          created_by:               string;
          title:                    string;
          description:              string;
          requirements:             string[];
          culture_fit_expectations: string | null;
          status:                   DbJobStatus;
          slug:                     string;
          department:               string | null;
          location:                 string | null;
          employment_type:          DbEmploymentType | null;
          salary_range:             Json | null;
          screening_questions:      Json;
          rejection_rules:          Json;
          ai_instructions:          string | null;
          created_at:               string;
          updated_at:               string;
        };
        Insert: {
          id?:                       string;
          organization_id:           string;
          created_by:                string;
          title:                     string;
          description?:              string;
          requirements?:             string[];
          culture_fit_expectations?: string | null;
          status?:                   DbJobStatus;
          slug:                      string;
          department?:               string | null;
          location?:                 string | null;
          employment_type?:          DbEmploymentType | null;
          salary_range?:             Json | null;
          screening_questions?:      Json;
          rejection_rules?:          Json;
          ai_instructions?:          string | null;
          created_at?:               string;
          updated_at?:               string;
        };
        Update: {
          title?:                    string;
          description?:              string;
          requirements?:             string[];
          culture_fit_expectations?: string | null;
          status?:                   DbJobStatus;
          slug?:                     string;
          department?:               string | null;
          location?:                 string | null;
          employment_type?:          DbEmploymentType | null;
          salary_range?:             Json | null;
          screening_questions?:      Json;
          rejection_rules?:          Json;
          ai_instructions?:          string | null;
          updated_at?:               string;
        };
      };

      candidates: {
        Row: {
          id:                 string;
          job_id:             string;
          organization_id:    string;
          full_name:          string;
          email:              string;
          phone:              string;
          whatsapp_number:    string | null;
          cv_url:             string | null;
          cv_parsed_data:     Json | null;
          status:             DbCandidateStatus;
          ai_score:           number | null;
          ai_summary:         string | null;
          recruiter_notes:    string | null;
          is_ai_active:       boolean;
          linkedin_url:       string | null;
          portfolio_url:      string | null;
          cover_letter:       string | null;
          whatsapp_consent:   boolean;
          screening_answers:  Json;
          source:             string;
          applied_at:         string;
          updated_at:         string;
        };
        Insert: {
          id?:                string;
          job_id:             string;
          organization_id:    string;
          full_name:          string;
          email:              string;
          phone:              string;
          whatsapp_number?:   string | null;
          cv_url?:            string | null;
          cv_parsed_data?:    Json | null;
          status?:            DbCandidateStatus;
          ai_score?:          number | null;
          ai_summary?:        string | null;
          recruiter_notes?:   string | null;
          is_ai_active?:      boolean;
          linkedin_url?:      string | null;
          portfolio_url?:     string | null;
          cover_letter?:      string | null;
          whatsapp_consent?:  boolean;
          screening_answers?: Json;
          source?:            string;
          applied_at?:        string;
          updated_at?:        string;
        };
        Update: {
          full_name?:         string;
          email?:             string;
          phone?:             string;
          whatsapp_number?:   string | null;
          cv_url?:            string | null;
          cv_parsed_data?:    Json | null;
          status?:            DbCandidateStatus;
          ai_score?:          number | null;
          ai_summary?:        string | null;
          recruiter_notes?:   string | null;
          is_ai_active?:      boolean;
          linkedin_url?:      string | null;
          portfolio_url?:     string | null;
          cover_letter?:      string | null;
          whatsapp_consent?:  boolean;
          screening_answers?: Json;
          source?:            string;
          updated_at?:        string;
        };
      };

      whatsapp_messages: {
        Row: {
          id:                   string;
          candidate_id:         string;
          organization_id:      string;
          direction:            DbMessageDirection;
          sender:               DbMessageSender;
          content:              string;
          media_url:            string | null;
          whatsapp_message_id:  string | null;
          sent_at:              string;
        };
        Insert: {
          id?:                   string;
          candidate_id:          string;
          organization_id:       string;
          direction:             DbMessageDirection;
          sender:                DbMessageSender;
          content:               string;
          media_url?:            string | null;
          whatsapp_message_id?:  string | null;
          sent_at?:              string;
        };
        Update: never;  // messages are immutable
      };

      conversation_contexts: {
        Row: {
          id:                     string;
          candidate_id:           string;
          organization_id:        string;
          current_question_index: number;
          is_complete:            boolean;
          metadata:               Json;
          updated_at:             string;
        };
        Insert: {
          id?:                     string;
          candidate_id:            string;
          organization_id:         string;
          current_question_index?: number;
          is_complete?:            boolean;
          metadata?:               Json;
          updated_at?:             string;
        };
        Update: {
          current_question_index?: number;
          is_complete?:            boolean;
          metadata?:               Json;
          updated_at?:             string;
        };
      };

      assignments: {
        Row: {
          id:              string;
          job_id:          string;
          candidate_id:    string;
          organization_id: string;
          title:           string;
          description:     string;
          instructions:    string;
          deadline_hours:  number;
          status:          DbAssignmentStatus;
          submission_url:  string | null;
          submission_text: string | null;
          ai_evaluation:        Json | null;
          evaluation_criteria:  Json;
          submission_metadata:  Json;
          sent_at:              string | null;
          submitted_at:         string | null;
          created_at:           string;
        };
        Insert: {
          id?:                  string;
          job_id:               string;
          candidate_id:         string;
          organization_id:      string;
          title:                string;
          description:          string;
          instructions:         string;
          deadline_hours?:      number;
          status?:              DbAssignmentStatus;
          submission_url?:      string | null;
          submission_text?:     string | null;
          ai_evaluation?:       Json | null;
          evaluation_criteria?: Json;
          submission_metadata?: Json;
          sent_at?:             string | null;
          submitted_at?:        string | null;
          created_at?:          string;
        };
        Update: {
          status?:              DbAssignmentStatus;
          submission_url?:      string | null;
          submission_text?:     string | null;
          ai_evaluation?:       Json | null;
          evaluation_criteria?: Json;
          submission_metadata?: Json;
          sent_at?:             string | null;
          submitted_at?:        string | null;
        };
      };

      ai_usage_logs: {
        Row: {
          id:              string;
          organization_id: string;
          feature:         string;
          prompt_version:  string;
          provider:        string;
          model:           string;
          input_tokens:    number;
          output_tokens:   number;
          candidate_id:    string | null;
          job_id:          string | null;
          created_at:      string;
        };
        Insert: {
          id?:              string;
          organization_id:  string;
          feature:          string;
          prompt_version?:  string;
          provider:         string;
          model:            string;
          input_tokens?:    number;
          output_tokens?:   number;
          candidate_id?:    string | null;
          job_id?:          string | null;
          created_at?:      string;
        };
        Update: never;  // logs are immutable
      };

      candidate_notes: {
        Row: {
          id:           string;
          candidate_id: string;
          recruiter_id: string;
          content:      string;
          created_at:   string;
          updated_at:   string;
        };
        Insert: {
          id?:          string;
          candidate_id: string;
          recruiter_id: string;
          content:      string;
          created_at?:  string;
          updated_at?:  string;
        };
        Update: {
          content?:     string;
          updated_at?:  string;
        };
      };

      audit_logs: {
        Row: {
          id:              string;
          organization_id: string;
          actor_id:        string | null;
          action:          string;
          resource_type:   string;
          resource_id:     string | null;
          metadata:        Json;
          created_at:      string;
        };
        Insert: {
          id?:              string;
          organization_id:  string;
          actor_id?:        string | null;
          action:           string;
          resource_type:    string;
          resource_id?:     string | null;
          metadata?:        Json;
          created_at?:      string;
        };
        Update: never;  // logs are immutable
      };

    };
    Views:     Record<string, never>;
    Functions: {
      get_current_org_id: {
        Args:    Record<string, never>;
        Returns: string;
      };
      get_current_user_role: {
        Args:    Record<string, never>;
        Returns: DbUserRole;
      };
    };
    Enums: {
      user_role:          DbUserRole;
      job_status:         DbJobStatus;
      employment_type:    DbEmploymentType;
      candidate_status:   DbCandidateStatus;
      message_direction:  DbMessageDirection;
      message_sender:     DbMessageSender;
      assignment_status:  DbAssignmentStatus;
      ai_recommendation:  DbAiRecommendation;
    };
  };
}
