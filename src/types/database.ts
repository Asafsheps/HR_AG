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
// Migration 014
export type DbAgentTone           = "friendly" | "professional" | "strict" | "concise";
export type DbConversationChannel = "web" | "whatsapp";
export type DbGender              = "male" | "female" | "other" | "undisclosed";
// Migration 015
export type DbSubmissionMethod = "email" | "web_form" | "portal" | "manual";
export type DbClientJobStatus  = "open" | "paused" | "filled" | "expired";

// --------------------------------------------------
// Database interface
// --------------------------------------------------
interface RawDatabase {
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
          agent_profile_id:         string | null;   // migration 014
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
          agent_profile_id?:         string | null;   // migration 014
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
          agent_profile_id?:         string | null;   // migration 014
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
          birth_year:         number | null;   // migration 014
          gender:             DbGender | null; // migration 014
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

      // Renamed from whatsapp_messages in migration 017: the web chat is
      // now the primary channel, and the old name described a table that
              // mostly holds web transcripts.
      messages: {
        Row: {
          id:                   string;
          candidate_id:         string;
          organization_id:      string;
          direction:            DbMessageDirection;
          sender:               DbMessageSender;
          content:              string;
          media_url:            string | null;
          provider_message_id:  string | null;
          channel:              DbConversationChannel;
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
          provider_message_id?:  string | null;
          channel?:              DbConversationChannel;
          sent_at?:              string;
        };
        Update: never;  // messages are immutable
      };

      conversation_contexts: {
        Row: {
          id:                     string;
          // Nullable since migration 017: a web visitor starts talking
          // before we know who they are.
          candidate_id:           string | null;
          organization_id:        string;
          job_id:                 string | null;
          current_question_index: number;
          is_complete:            boolean;
          metadata:               Json;
          channel:                DbConversationChannel;
          session_token:          string | null;
          campaign_id:            string | null;
          transcript:             Json;
          cv_text:                string | null;
          flags:                  Json;
          started_at:             string;
          ended_at:               string | null;
          updated_at:             string;
        };
        Insert: {
          id?:                     string;
          candidate_id?:           string | null;
          organization_id:         string;
          job_id?:                 string | null;
          current_question_index?: number;
          is_complete?:            boolean;
          metadata?:               Json;
          channel?:                DbConversationChannel;
          session_token?:          string | null;
          campaign_id?:            string | null;
          transcript?:             Json;
          cv_text?:                string | null;
          flags?:                  Json;
          started_at?:             string;
          ended_at?:               string | null;
        };
        Update: {
          candidate_id?:           string | null;
          job_id?:                 string | null;
          current_question_index?: number;
          is_complete?:            boolean;
          metadata?:               Json;
          transcript?:             Json;
          cv_text?:                string | null;
          flags?:                  Json;
          ended_at?:               string | null;
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

      // ── Migration 019 ────────────────────────────────────────────────
      candidate_scores: {
        Row: {
          id:               string;
          candidate_id:     string;
          organization_id:  string;
          job_id:           string;
          overall:          number;
          tools_match:      number | null;
          domain_match:     number | null;
          seniority_match:  number | null;
          communication:    number | null;
          confidence:       number | null;
          motivation:       number | null;
          reasoning:        Json;
          summary:          string;
          strengths:        string[];
          concerns:         string[];
          evidence_quality: "strong" | "partial" | "thin";
          model:            string;
          provider:         string;
          prompt_version:   string;
          scored_at:        string;
        };
        Insert: {
          id?:               string;
          candidate_id:      string;
          organization_id:   string;
          job_id:            string;
          overall:           number;
          tools_match?:      number | null;
          domain_match?:     number | null;
          seniority_match?:  number | null;
          communication?:    number | null;
          confidence?:       number | null;
          motivation?:       number | null;
          reasoning:         Json;
          summary?:          string;
          strengths?:        string[];
          concerns?:         string[];
          evidence_quality?: "strong" | "partial" | "thin";
          model:             string;
          provider:          string;
          prompt_version?:   string;
          scored_at?:        string;
        };
        Update: {
          overall?:          number;
          tools_match?:      number | null;
          domain_match?:     number | null;
          seniority_match?:  number | null;
          communication?:    number | null;
          confidence?:       number | null;
          motivation?:       number | null;
          reasoning?:        Json;
          summary?:          string;
          strengths?:        string[];
          concerns?:         string[];
          evidence_quality?: "strong" | "partial" | "thin";
        };
      };

      // ── Migration 015 ────────────────────────────────────────────────
      client_companies: {
        Row: {
          id:                 string;
          organization_id:    string;
          name:               string;
          slug:               string;
          website:            string | null;
          careers_url:        string | null;
          submission_method:  DbSubmissionMethod;
          submission_config:  Json;
          bonus_amount_ils:   number | null;
          bonus_delay_months: number | null;
          bonus_notes:        string | null;
          status:             string;
          contact_name:       string | null;
          contact_email:      string | null;
          notes:              string | null;
          created_at:         string;
          updated_at:         string;
        };
        Insert: {
          id?:                 string;
          organization_id:     string;
          name:                string;
          slug:                string;
          website?:            string | null;
          careers_url?:        string | null;
          submission_method?:  DbSubmissionMethod;
          submission_config?:  Json;
          bonus_amount_ils?:   number | null;
          bonus_delay_months?: number | null;
          bonus_notes?:        string | null;
          status?:             string;
          contact_name?:       string | null;
          contact_email?:      string | null;
          notes?:              string | null;
        };
        Update: {
          name?:               string;
          slug?:               string;
          website?:            string | null;
          careers_url?:        string | null;
          submission_method?:  DbSubmissionMethod;
          submission_config?:  Json;
          bonus_amount_ils?:   number | null;
          bonus_delay_months?: number | null;
          bonus_notes?:        string | null;
          status?:             string;
          contact_name?:       string | null;
          contact_email?:      string | null;
          notes?:              string | null;
        };
      };

      client_jobs: {
        Row: {
          id:                     string;
          organization_id:        string;
          client_company_id:      string;
          agent_profile_id:       string | null;
          external_ref:           string | null;
          source_url:             string | null;
          title:                  string;
          location:               string | null;
          employment_type:        string | null;
          description:            string;
          core_skills:            string[];
          nice_to_have:           string[];
          min_years:              number | null;
          business_priority:      string | null;
          candidate_expectations: string | null;
          screening_notes:        string | null;
          extracted_at:           string | null;
          extraction_model:       string | null;
          is_reviewed:            boolean;
          salary_range:           Json | null;
          status:                 DbClientJobStatus;
          created_at:             string;
          updated_at:             string;
        };
        Insert: {
          id?:                     string;
          organization_id:         string;
          client_company_id:       string;
          agent_profile_id?:       string | null;
          external_ref?:           string | null;
          source_url?:             string | null;
          title:                   string;
          location?:               string | null;
          employment_type?:        string | null;
          description?:            string;
          core_skills?:            string[];
          nice_to_have?:           string[];
          min_years?:              number | null;
          business_priority?:      string | null;
          candidate_expectations?: string | null;
          screening_notes?:        string | null;
          extracted_at?:           string | null;
          extraction_model?:       string | null;
          is_reviewed?:            boolean;
          salary_range?:           Json | null;
          status?:                 DbClientJobStatus;
        };
        Update: {
          agent_profile_id?:       string | null;
          title?:                  string;
          location?:               string | null;
          employment_type?:        string | null;
          description?:            string;
          core_skills?:            string[];
          nice_to_have?:           string[];
          min_years?:              number | null;
          business_priority?:      string | null;
          candidate_expectations?: string | null;
          screening_notes?:        string | null;
          extracted_at?:           string | null;
          extraction_model?:       string | null;
          is_reviewed?:            boolean;
          salary_range?:           Json | null;
          status?:                 DbClientJobStatus;
        };
      };

      // ── Migration 014 ────────────────────────────────────────────────
      agent_profiles: {
        Row: {
          id:                  string;
          organization_id:     string;
          name:                string;
          persona_name:        string;
          objective:           string;
          tone:                DbAgentTone;
          guidelines:          string;
          language:            string;
          max_questions:       number;
          escalate_after:      number | null;
          never_discuss:       string[];
          stages:              Json;
          scoring_criteria:    Json;
          auto_score:          boolean;
          auto_escalate_score: number | null;
          reject_score:        number | null;
          is_default:          boolean;
          created_at:          string;
          updated_at:          string;
        };
        Insert: {
          id?:                  string;
          organization_id:      string;
          name:                 string;
          persona_name?:        string;
          objective?:           string;
          tone?:                DbAgentTone;
          guidelines?:          string;
          language?:            string;
          max_questions?:       number;
          escalate_after?:      number | null;
          never_discuss?:       string[];
          stages?:              Json;
          scoring_criteria?:    Json;
          auto_score?:          boolean;
          auto_escalate_score?: number | null;
          reject_score?:        number | null;
          is_default?:          boolean;
        };
        Update: {
          name?:                string;
          persona_name?:        string;
          objective?:           string;
          tone?:                DbAgentTone;
          guidelines?:          string;
          language?:            string;
          max_questions?:       number;
          escalate_after?:      number | null;
          never_discuss?:       string[];
          stages?:              Json;
          scoring_criteria?:    Json;
          auto_score?:          boolean;
          auto_escalate_score?: number | null;
          reject_score?:        number | null;
          is_default?:          boolean;
        };
      };

      campaigns: {
        Row: {
          id:              string;
          organization_id: string;
          // Exactly one of job_id / client_job_id is set (migration 015).
          job_id:          string | null;
          client_job_id:   string | null;
          code:            string;
          channel:         string;
          ad_copy:         string;
          landing_url:     string;
          wa_link:         string | null;
          clicks:          number;
          conversations:   number;
          qualified:       number;
          is_active:       boolean;
          created_at:      string;
        };
        Insert: {
          id?:             string;
          organization_id: string;
          job_id?:         string | null;
          client_job_id?:  string | null;
          code:            string;
          channel:         string;
          ad_copy?:        string;
          landing_url:     string;
          wa_link?:        string | null;
          clicks?:         number;
          conversations?:  number;
          qualified?:      number;
          is_active?:      boolean;
        };
        Update: {
          channel?:       string;
          ad_copy?:       string;
          landing_url?:   string;
          wa_link?:       string | null;
          clicks?:        number;
          conversations?: number;
          qualified?:     number;
          is_active?:     boolean;
        };
      };

      channel_settings: {
        Row: {
          organization_id:     string;
          whatsapp_number:     string | null;
          whatsapp_provider:   string | null;
          is_whatsapp_enabled: boolean;
          updated_at:          string;
        };
        Insert: {
          organization_id:      string;
          whatsapp_number?:     string | null;
          whatsapp_provider?:   string | null;
          is_whatsapp_enabled?: boolean;
        };
        Update: {
          whatsapp_number?:     string | null;
          whatsapp_provider?:   string | null;
          is_whatsapp_enabled?: boolean;
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
    Views: {
      // Migration 019. Read-only; security_invoker keeps RLS in force.
      candidate_rankings: {
        Row: {
          candidate_id:       string;
          organization_id:    string;
          job_id:             string;
          full_name:          string;
          email:              string;
          phone:              string;
          status:             DbCandidateStatus;
          cv_url:             string | null;
          birth_year:         number | null;
          gender:             DbGender | null;
          applied_at:         string;
          job_title:          string;
          overall:            number | null;
          tools_match:        number | null;
          domain_match:       number | null;
          seniority_match:    number | null;
          communication:      number | null;
          confidence:         number | null;
          motivation:         number | null;
          summary:            string | null;
          strengths:          string[] | null;
          concerns:           string[] | null;
          evidence_quality:   "strong" | "partial" | "thin" | null;
          scored_at:          string | null;
          age:                number | null;
          interview_complete: boolean;
          turn_count:         number;
          flag_count:         number;
        };
      };
    };
    Functions: {
      get_current_org_id: {
        Args:    Record<string, never>;
        Returns: string;
      };
      get_current_user_role: {
        Args:    Record<string, never>;
        Returns: DbUserRole;
      };
      // Migration 014. Security definer, so the public landing page can
      // bump a counter without holding write access to campaigns.
      increment_campaign_metric: {
        Args:    { p_code: string; p_metric: "clicks" | "conversations" | "qualified" };
        Returns: void;
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

type AddRelationships<T> = {
  [K in keyof T]: T[K] & { Relationships: never[] }
};

export type Database = {
  public: {
    Tables: AddRelationships<RawDatabase["public"]["Tables"]>;
    // Views need Relationships too, same as tables, or supabase-js resolves
    // every selected column to `never`.
    Views: AddRelationships<RawDatabase["public"]["Views"]>;
    Functions: RawDatabase["public"]["Functions"];
    Enums: RawDatabase["public"]["Enums"];
  };
};
