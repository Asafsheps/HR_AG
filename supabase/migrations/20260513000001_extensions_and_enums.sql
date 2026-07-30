-- ==================================================
-- Migration 001: Extensions & Enums
-- ==================================================
-- Enable required PostgreSQL extensions and define
-- all custom enum types used across the schema.
-- Must run before any table creation.
-- ==================================================

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- Enable pg_trgm for fast text search (candidate names, job titles)
create extension if not exists "pg_trgm";

-- ==================================================
-- ENUM TYPES
-- ==================================================

-- Recruiter roles within an organization
create type user_role as enum (
  'super_admin',  -- full platform access
  'admin',        -- org-level admin
  'recruiter',    -- standard recruiter
  'viewer'        -- read-only access
);

-- Job lifecycle
create type job_status as enum (
  'draft',
  'active',
  'paused',
  'closed',
  'archived'
);

-- Employment contract type
create type employment_type as enum (
  'full_time',
  'part_time',
  'contract',
  'internship'
);

-- Candidate pipeline stages
create type candidate_status as enum (
  'new',
  'screening',
  'whatsapp_interview',
  'assignment_sent',
  'assignment_submitted',
  'under_review',
  'shortlisted',
  'rejected',
  'hired',
  'withdrawn'
);

-- WhatsApp message direction
create type message_direction as enum (
  'inbound',
  'outbound'
);

-- Who sent the WhatsApp message
create type message_sender as enum (
  'candidate',
  'ai',
  'recruiter'
);

-- Assignment lifecycle
create type assignment_status as enum (
  'pending',
  'sent',
  'submitted',
  'evaluated',
  'expired'
);

-- AI scoring recommendation
create type ai_recommendation as enum (
  'proceed',
  'borderline',
  'reject'
);

-- WhatsApp provider
create type whatsapp_provider as enum (
  'twilio',
  'meta'
);
