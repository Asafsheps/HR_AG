export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      agent_profiles: {
        Row: {
          auto_escalate_score: number | null
          auto_score: boolean
          created_at: string
          escalate_after: number | null
          guidelines: string
          id: string
          is_default: boolean
          language: string
          max_questions: number
          name: string
          never_discuss: string[]
          objective: string
          organization_id: string
          persona_name: string
          reject_score: number | null
          scoring_criteria: Json
          stages: Json
          tone: Database["public"]["Enums"]["agent_tone"]
          updated_at: string
        }
        Insert: {
          auto_escalate_score?: number | null
          auto_score?: boolean
          created_at?: string
          escalate_after?: number | null
          guidelines?: string
          id?: string
          is_default?: boolean
          language?: string
          max_questions?: number
          name: string
          never_discuss?: string[]
          objective?: string
          organization_id: string
          persona_name?: string
          reject_score?: number | null
          scoring_criteria?: Json
          stages?: Json
          tone?: Database["public"]["Enums"]["agent_tone"]
          updated_at?: string
        }
        Update: {
          auto_escalate_score?: number | null
          auto_score?: boolean
          created_at?: string
          escalate_after?: number | null
          guidelines?: string
          id?: string
          is_default?: boolean
          language?: string
          max_questions?: number
          name?: string
          never_discuss?: string[]
          objective?: string
          organization_id?: string
          persona_name?: string
          reject_score?: number | null
          scoring_criteria?: Json
          stages?: Json
          tone?: Database["public"]["Enums"]["agent_tone"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_settings: {
        Row: {
          default_provider: string | null
          interview_model: string | null
          interview_provider: string | null
          organization_id: string
          scoring_model: string | null
          scoring_provider: string | null
          updated_at: string
        }
        Insert: {
          default_provider?: string | null
          interview_model?: string | null
          interview_provider?: string | null
          organization_id: string
          scoring_model?: string | null
          scoring_provider?: string | null
          updated_at?: string
        }
        Update: {
          default_provider?: string | null
          interview_model?: string | null
          interview_provider?: string | null
          organization_id?: string
          scoring_model?: string | null
          scoring_provider?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_usage_logs: {
        Row: {
          candidate_id: string | null
          created_at: string
          feature: string
          id: string
          input_tokens: number
          job_id: string | null
          model: string
          organization_id: string
          output_tokens: number
          prompt_version: string
          provider: string
        }
        Insert: {
          candidate_id?: string | null
          created_at?: string
          feature: string
          id?: string
          input_tokens?: number
          job_id?: string | null
          model: string
          organization_id: string
          output_tokens?: number
          prompt_version?: string
          provider: string
        }
        Update: {
          candidate_id?: string | null
          created_at?: string
          feature?: string
          id?: string
          input_tokens?: number
          job_id?: string | null
          model?: string
          organization_id?: string
          output_tokens?: number
          prompt_version?: string
          provider?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_usage_logs_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidate_rankings"
            referencedColumns: ["candidate_id"]
          },
          {
            foreignKeyName: "ai_usage_logs_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_usage_logs_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_usage_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      assignments: {
        Row: {
          ai_evaluation: Json | null
          candidate_id: string
          created_at: string
          deadline_hours: number
          description: string
          evaluation_criteria: Json
          id: string
          instructions: string
          job_id: string
          organization_id: string
          sent_at: string | null
          status: Database["public"]["Enums"]["assignment_status"]
          submission_metadata: Json
          submission_text: string | null
          submission_url: string | null
          submitted_at: string | null
          title: string
        }
        Insert: {
          ai_evaluation?: Json | null
          candidate_id: string
          created_at?: string
          deadline_hours?: number
          description: string
          evaluation_criteria?: Json
          id?: string
          instructions: string
          job_id: string
          organization_id: string
          sent_at?: string | null
          status?: Database["public"]["Enums"]["assignment_status"]
          submission_metadata?: Json
          submission_text?: string | null
          submission_url?: string | null
          submitted_at?: string | null
          title: string
        }
        Update: {
          ai_evaluation?: Json | null
          candidate_id?: string
          created_at?: string
          deadline_hours?: number
          description?: string
          evaluation_criteria?: Json
          id?: string
          instructions?: string
          job_id?: string
          organization_id?: string
          sent_at?: string | null
          status?: Database["public"]["Enums"]["assignment_status"]
          submission_metadata?: Json
          submission_text?: string | null
          submission_url?: string | null
          submitted_at?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignments_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: true
            referencedRelation: "candidate_rankings"
            referencedColumns: ["candidate_id"]
          },
          {
            foreignKeyName: "assignments_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: true
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          id: string
          metadata: Json
          organization_id: string
          resource_id: string | null
          resource_type: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          organization_id: string
          resource_id?: string | null
          resource_type: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          organization_id?: string
          resource_id?: string | null
          resource_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "recruiter_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          ad_copy: string
          channel: string
          clicks: number
          client_job_id: string | null
          code: string
          conversations: number
          created_at: string
          id: string
          is_active: boolean
          job_id: string | null
          landing_url: string
          organization_id: string
          qualified: number
          wa_link: string | null
        }
        Insert: {
          ad_copy?: string
          channel: string
          clicks?: number
          client_job_id?: string | null
          code: string
          conversations?: number
          created_at?: string
          id?: string
          is_active?: boolean
          job_id?: string | null
          landing_url: string
          organization_id: string
          qualified?: number
          wa_link?: string | null
        }
        Update: {
          ad_copy?: string
          channel?: string
          clicks?: number
          client_job_id?: string | null
          code?: string
          conversations?: number
          created_at?: string
          id?: string
          is_active?: boolean
          job_id?: string | null
          landing_url?: string
          organization_id?: string
          qualified?: number
          wa_link?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_client_job_id_fkey"
            columns: ["client_job_id"]
            isOneToOne: false
            referencedRelation: "client_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      candidate_notes: {
        Row: {
          candidate_id: string
          content: string
          created_at: string
          id: string
          recruiter_id: string
          updated_at: string
        }
        Insert: {
          candidate_id: string
          content: string
          created_at?: string
          id?: string
          recruiter_id: string
          updated_at?: string
        }
        Update: {
          candidate_id?: string
          content?: string
          created_at?: string
          id?: string
          recruiter_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "candidate_notes_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidate_rankings"
            referencedColumns: ["candidate_id"]
          },
          {
            foreignKeyName: "candidate_notes_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_notes_recruiter_id_fkey"
            columns: ["recruiter_id"]
            isOneToOne: false
            referencedRelation: "recruiter_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      candidate_scores: {
        Row: {
          candidate_id: string
          communication: number | null
          concerns: string[]
          confidence: number | null
          domain_match: number | null
          evidence_quality: string
          id: string
          job_id: string
          model: string
          motivation: number | null
          organization_id: string
          overall: number
          prompt_version: string
          provider: string
          reasoning: Json
          scored_at: string
          seniority_match: number | null
          strengths: string[]
          summary: string
          tools_match: number | null
        }
        Insert: {
          candidate_id: string
          communication?: number | null
          concerns?: string[]
          confidence?: number | null
          domain_match?: number | null
          evidence_quality?: string
          id?: string
          job_id: string
          model: string
          motivation?: number | null
          organization_id: string
          overall: number
          prompt_version?: string
          provider: string
          reasoning: Json
          scored_at?: string
          seniority_match?: number | null
          strengths?: string[]
          summary?: string
          tools_match?: number | null
        }
        Update: {
          candidate_id?: string
          communication?: number | null
          concerns?: string[]
          confidence?: number | null
          domain_match?: number | null
          evidence_quality?: string
          id?: string
          job_id?: string
          model?: string
          motivation?: number | null
          organization_id?: string
          overall?: number
          prompt_version?: string
          provider?: string
          reasoning?: Json
          scored_at?: string
          seniority_match?: number | null
          strengths?: string[]
          summary?: string
          tools_match?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "candidate_scores_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: true
            referencedRelation: "candidate_rankings"
            referencedColumns: ["candidate_id"]
          },
          {
            foreignKeyName: "candidate_scores_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: true
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_scores_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_scores_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      candidates: {
        Row: {
          ai_score: number | null
          ai_summary: string | null
          applied_at: string
          birth_year: number | null
          consent_at: string | null
          consent_version: string | null
          cover_letter: string | null
          cv_parsed_data: Json | null
          cv_url: string | null
          email: string
          full_name: string
          gender: string | null
          id: string
          is_ai_active: boolean
          job_id: string
          linkedin_url: string | null
          organization_id: string
          phone: string
          portfolio_url: string | null
          recruiter_notes: string | null
          screening_answers: Json
          source: string
          status: Database["public"]["Enums"]["candidate_status"]
          updated_at: string
          whatsapp_consent: boolean
          whatsapp_number: string | null
        }
        Insert: {
          ai_score?: number | null
          ai_summary?: string | null
          applied_at?: string
          birth_year?: number | null
          consent_at?: string | null
          consent_version?: string | null
          cover_letter?: string | null
          cv_parsed_data?: Json | null
          cv_url?: string | null
          email: string
          full_name: string
          gender?: string | null
          id?: string
          is_ai_active?: boolean
          job_id: string
          linkedin_url?: string | null
          organization_id: string
          phone: string
          portfolio_url?: string | null
          recruiter_notes?: string | null
          screening_answers?: Json
          source?: string
          status?: Database["public"]["Enums"]["candidate_status"]
          updated_at?: string
          whatsapp_consent?: boolean
          whatsapp_number?: string | null
        }
        Update: {
          ai_score?: number | null
          ai_summary?: string | null
          applied_at?: string
          birth_year?: number | null
          consent_at?: string | null
          consent_version?: string | null
          cover_letter?: string | null
          cv_parsed_data?: Json | null
          cv_url?: string | null
          email?: string
          full_name?: string
          gender?: string | null
          id?: string
          is_ai_active?: boolean
          job_id?: string
          linkedin_url?: string | null
          organization_id?: string
          phone?: string
          portfolio_url?: string | null
          recruiter_notes?: string | null
          screening_answers?: Json
          source?: string
          status?: Database["public"]["Enums"]["candidate_status"]
          updated_at?: string
          whatsapp_consent?: boolean
          whatsapp_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "candidates_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      channel_settings: {
        Row: {
          is_whatsapp_enabled: boolean
          organization_id: string
          updated_at: string
          whatsapp_number: string | null
          whatsapp_provider: string | null
        }
        Insert: {
          is_whatsapp_enabled?: boolean
          organization_id: string
          updated_at?: string
          whatsapp_number?: string | null
          whatsapp_provider?: string | null
        }
        Update: {
          is_whatsapp_enabled?: boolean
          organization_id?: string
          updated_at?: string
          whatsapp_number?: string | null
          whatsapp_provider?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "channel_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      client_companies: {
        Row: {
          bonus_amount_ils: number | null
          bonus_delay_months: number | null
          bonus_notes: string | null
          careers_url: string | null
          contact_email: string | null
          contact_name: string | null
          created_at: string
          id: string
          name: string
          notes: string | null
          organization_id: string
          slug: string
          status: string
          submission_config: Json
          submission_method: Database["public"]["Enums"]["submission_method"]
          updated_at: string
          website: string | null
        }
        Insert: {
          bonus_amount_ils?: number | null
          bonus_delay_months?: number | null
          bonus_notes?: string | null
          careers_url?: string | null
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          organization_id: string
          slug: string
          status?: string
          submission_config?: Json
          submission_method?: Database["public"]["Enums"]["submission_method"]
          updated_at?: string
          website?: string | null
        }
        Update: {
          bonus_amount_ils?: number | null
          bonus_delay_months?: number | null
          bonus_notes?: string | null
          careers_url?: string | null
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          organization_id?: string
          slug?: string
          status?: string
          submission_config?: Json
          submission_method?: Database["public"]["Enums"]["submission_method"]
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_companies_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      client_jobs: {
        Row: {
          agent_profile_id: string | null
          business_priority: string | null
          candidate_expectations: string | null
          client_company_id: string
          core_skills: string[]
          created_at: string
          description: string
          employment_type: string | null
          external_ref: string | null
          extracted_at: string | null
          extraction_model: string | null
          id: string
          is_reviewed: boolean
          location: string | null
          min_years: number | null
          nice_to_have: string[]
          organization_id: string
          salary_range: Json | null
          screening_notes: string | null
          source_url: string | null
          status: Database["public"]["Enums"]["client_job_status"]
          title: string
          updated_at: string
        }
        Insert: {
          agent_profile_id?: string | null
          business_priority?: string | null
          candidate_expectations?: string | null
          client_company_id: string
          core_skills?: string[]
          created_at?: string
          description?: string
          employment_type?: string | null
          external_ref?: string | null
          extracted_at?: string | null
          extraction_model?: string | null
          id?: string
          is_reviewed?: boolean
          location?: string | null
          min_years?: number | null
          nice_to_have?: string[]
          organization_id: string
          salary_range?: Json | null
          screening_notes?: string | null
          source_url?: string | null
          status?: Database["public"]["Enums"]["client_job_status"]
          title: string
          updated_at?: string
        }
        Update: {
          agent_profile_id?: string | null
          business_priority?: string | null
          candidate_expectations?: string | null
          client_company_id?: string
          core_skills?: string[]
          created_at?: string
          description?: string
          employment_type?: string | null
          external_ref?: string | null
          extracted_at?: string | null
          extraction_model?: string | null
          id?: string
          is_reviewed?: boolean
          location?: string | null
          min_years?: number | null
          nice_to_have?: string[]
          organization_id?: string
          salary_range?: Json | null
          screening_notes?: string | null
          source_url?: string | null
          status?: Database["public"]["Enums"]["client_job_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_jobs_agent_profile_id_fkey"
            columns: ["agent_profile_id"]
            isOneToOne: false
            referencedRelation: "agent_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_jobs_client_company_id_fkey"
            columns: ["client_company_id"]
            isOneToOne: false
            referencedRelation: "client_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_jobs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_contexts: {
        Row: {
          campaign_id: string | null
          candidate_id: string | null
          channel: Database["public"]["Enums"]["conversation_channel"]
          current_question_index: number
          cv_text: string | null
          ended_at: string | null
          flags: Json
          id: string
          is_complete: boolean
          job_id: string | null
          metadata: Json
          organization_id: string
          session_token: string | null
          started_at: string
          transcript: Json
          updated_at: string
        }
        Insert: {
          campaign_id?: string | null
          candidate_id?: string | null
          channel?: Database["public"]["Enums"]["conversation_channel"]
          current_question_index?: number
          cv_text?: string | null
          ended_at?: string | null
          flags?: Json
          id?: string
          is_complete?: boolean
          job_id?: string | null
          metadata?: Json
          organization_id: string
          session_token?: string | null
          started_at?: string
          transcript?: Json
          updated_at?: string
        }
        Update: {
          campaign_id?: string | null
          candidate_id?: string | null
          channel?: Database["public"]["Enums"]["conversation_channel"]
          current_question_index?: number
          cv_text?: string | null
          ended_at?: string | null
          flags?: Json
          id?: string
          is_complete?: boolean
          job_id?: string | null
          metadata?: Json
          organization_id?: string
          session_token?: string | null
          started_at?: string
          transcript?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_contexts_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_contexts_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidate_rankings"
            referencedColumns: ["candidate_id"]
          },
          {
            foreignKeyName: "conversation_contexts_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_contexts_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_contexts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          agent_profile_id: string | null
          ai_instructions: string | null
          created_at: string
          created_by: string
          culture_fit_expectations: string | null
          department: string | null
          description: string
          employment_type: Database["public"]["Enums"]["employment_type"] | null
          id: string
          location: string | null
          organization_id: string
          rejection_rules: Json
          requirements: string[]
          salary_range: Json | null
          screening_questions: Json
          slug: string
          status: Database["public"]["Enums"]["job_status"]
          title: string
          updated_at: string
        }
        Insert: {
          agent_profile_id?: string | null
          ai_instructions?: string | null
          created_at?: string
          created_by: string
          culture_fit_expectations?: string | null
          department?: string | null
          description?: string
          employment_type?:
            | Database["public"]["Enums"]["employment_type"]
            | null
          id?: string
          location?: string | null
          organization_id: string
          rejection_rules?: Json
          requirements?: string[]
          salary_range?: Json | null
          screening_questions?: Json
          slug: string
          status?: Database["public"]["Enums"]["job_status"]
          title: string
          updated_at?: string
        }
        Update: {
          agent_profile_id?: string | null
          ai_instructions?: string | null
          created_at?: string
          created_by?: string
          culture_fit_expectations?: string | null
          department?: string | null
          description?: string
          employment_type?:
            | Database["public"]["Enums"]["employment_type"]
            | null
          id?: string
          location?: string | null
          organization_id?: string
          rejection_rules?: Json
          requirements?: string[]
          salary_range?: Json | null
          screening_questions?: Json
          slug?: string
          status?: Database["public"]["Enums"]["job_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_agent_profile_id_fkey"
            columns: ["agent_profile_id"]
            isOneToOne: false
            referencedRelation: "agent_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "recruiter_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          candidate_id: string
          channel: Database["public"]["Enums"]["conversation_channel"]
          content: string
          direction: Database["public"]["Enums"]["message_direction"]
          id: string
          media_url: string | null
          organization_id: string
          provider_message_id: string | null
          sender: Database["public"]["Enums"]["message_sender"]
          sent_at: string
        }
        Insert: {
          candidate_id: string
          channel?: Database["public"]["Enums"]["conversation_channel"]
          content?: string
          direction: Database["public"]["Enums"]["message_direction"]
          id?: string
          media_url?: string | null
          organization_id: string
          provider_message_id?: string | null
          sender: Database["public"]["Enums"]["message_sender"]
          sent_at?: string
        }
        Update: {
          candidate_id?: string
          channel?: Database["public"]["Enums"]["conversation_channel"]
          content?: string
          direction?: Database["public"]["Enums"]["message_direction"]
          id?: string
          media_url?: string | null
          organization_id?: string
          provider_message_id?: string | null
          sender?: Database["public"]["Enums"]["message_sender"]
          sent_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidate_rankings"
            referencedColumns: ["candidate_id"]
          },
          {
            foreignKeyName: "whatsapp_messages_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_messages_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          logo_url: string | null
          name: string
          plan: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          plan?: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          plan?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      recruiter_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string
          id: string
          is_active: boolean
          organization_id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name: string
          id: string
          is_active?: boolean
          organization_id: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          is_active?: boolean
          organization_id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recruiter_profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      candidate_rankings: {
        Row: {
          age: number | null
          applied_at: string | null
          birth_year: number | null
          candidate_id: string | null
          communication: number | null
          concerns: string[] | null
          confidence: number | null
          cv_url: string | null
          domain_match: number | null
          email: string | null
          evidence_quality: string | null
          flag_count: number | null
          full_name: string | null
          gender: string | null
          interview_complete: boolean | null
          job_id: string | null
          job_title: string | null
          motivation: number | null
          organization_id: string | null
          overall: number | null
          phone: string | null
          scored_at: string | null
          seniority_match: number | null
          status: Database["public"]["Enums"]["candidate_status"] | null
          strengths: string[] | null
          summary: string | null
          tools_match: number | null
          turn_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "candidates_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      get_current_org_id: { Args: never; Returns: string }
      get_current_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      increment_campaign_metric: {
        Args: { p_code: string; p_metric: string }
        Returns: undefined
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      agent_tone: "friendly" | "professional" | "strict" | "concise"
      ai_recommendation: "proceed" | "borderline" | "reject"
      assignment_status:
        | "pending"
        | "sent"
        | "submitted"
        | "evaluated"
        | "expired"
      candidate_status:
        | "new"
        | "screening"
        | "whatsapp_interview"
        | "assignment_sent"
        | "assignment_submitted"
        | "under_review"
        | "shortlisted"
        | "rejected"
        | "hired"
        | "withdrawn"
      client_job_status: "open" | "paused" | "filled" | "expired"
      conversation_channel: "web" | "whatsapp"
      employment_type: "full_time" | "part_time" | "contract" | "internship"
      job_status: "draft" | "active" | "paused" | "closed" | "archived"
      message_direction: "inbound" | "outbound"
      message_sender: "candidate" | "ai" | "recruiter"
      submission_method: "email" | "web_form" | "portal" | "manual"
      user_role: "super_admin" | "admin" | "recruiter" | "viewer"
      whatsapp_provider: "twilio" | "meta"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      agent_tone: ["friendly", "professional", "strict", "concise"],
      ai_recommendation: ["proceed", "borderline", "reject"],
      assignment_status: [
        "pending",
        "sent",
        "submitted",
        "evaluated",
        "expired",
      ],
      candidate_status: [
        "new",
        "screening",
        "whatsapp_interview",
        "assignment_sent",
        "assignment_submitted",
        "under_review",
        "shortlisted",
        "rejected",
        "hired",
        "withdrawn",
      ],
      client_job_status: ["open", "paused", "filled", "expired"],
      conversation_channel: ["web", "whatsapp"],
      employment_type: ["full_time", "part_time", "contract", "internship"],
      job_status: ["draft", "active", "paused", "closed", "archived"],
      message_direction: ["inbound", "outbound"],
      message_sender: ["candidate", "ai", "recruiter"],
      submission_method: ["email", "web_form", "portal", "manual"],
      user_role: ["super_admin", "admin", "recruiter", "viewer"],
      whatsapp_provider: ["twilio", "meta"],
    },
  },
} as const

