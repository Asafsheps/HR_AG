-- ==================================================
-- Migration 005: Candidates
-- ==================================================
-- A candidate who applied to a specific job.
-- cv_parsed_data holds structured AI-extracted CV data.
-- is_ai_active controls whether the WhatsApp AI agent
-- responds to this candidate, or the recruiter has taken over.
-- ==================================================

create table candidates (
  id               uuid primary key default uuid_generate_v4(),
  job_id           uuid not null references jobs on delete cascade,
  organization_id  uuid not null references organizations on delete cascade,

  -- Personal info
  full_name        text not null,
  email            text not null,
  phone            text not null,           -- E.164 format: +972501234567
  whatsapp_number  text,                    -- may differ from phone; E.164

  -- CV
  cv_url           text,                    -- Supabase Storage path
  cv_parsed_data   jsonb,                   -- CVParsedData: skills, experience_years, etc.

  -- Pipeline
  status           candidate_status not null default 'new',

  -- AI outputs
  ai_score         smallint check (ai_score between 0 and 100),
  ai_summary       text,

  -- Recruiter outputs
  recruiter_notes  text,

  -- WhatsApp AI control
  is_ai_active     boolean not null default true,

  -- Timestamps
  applied_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  -- A candidate can only apply once per job
  unique (job_id, email)
);

-- Indexes
create index candidates_org_idx      on candidates (organization_id);
create index candidates_job_idx      on candidates (job_id);
create index candidates_status_idx   on candidates (organization_id, status);
create index candidates_phone_idx    on candidates (whatsapp_number);   -- webhook lookup
create index candidates_email_idx    on candidates (organization_id, email);
create index candidates_score_idx    on candidates (job_id, ai_score desc nulls last);

-- Full-text search on candidate name
create index candidates_name_trgm_idx on candidates
  using gin (full_name gin_trgm_ops);

-- Auto-update updated_at
create trigger candidates_updated_at
  before update on candidates
  for each row execute function set_updated_at();

-- RLS
alter table candidates enable row level security;
