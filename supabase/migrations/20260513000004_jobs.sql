-- ==================================================
-- Migration 004: Jobs
-- ==================================================
-- A job posting created by a recruiter.
-- screening_questions and rejection_rules are stored
-- as JSONB arrays — they are always read/written as
-- a unit with the job, never queried individually.
-- ==================================================

create table jobs (
  id                       uuid primary key default uuid_generate_v4(),
  organization_id          uuid not null references organizations on delete cascade,
  created_by               uuid not null references recruiter_profiles on delete set null,

  -- Core fields
  title                    text not null,
  description              text not null default '',
  requirements             text[] not null default '{}',
  culture_fit_expectations text,
  status                   job_status not null default 'draft',
  slug                     text not null,               -- unique within org, e.g. "data-analyst-2026"

  -- Optional metadata
  department               text,
  location                 text,
  employment_type          employment_type,
  salary_range             jsonb,                       -- { min, max, currency }

  -- AI-managed interview config
  screening_questions      jsonb not null default '[]', -- ScreeningQuestion[]
  rejection_rules          jsonb not null default '[]', -- RejectionRule[]
  ai_instructions          text,                        -- freeform recruiter notes for the AI agent

  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),

  -- Slug must be unique within the organization
  unique (organization_id, slug)
);

-- Enforce non-empty title
alter table jobs
  add constraint jobs_title_not_empty check (char_length(trim(title)) > 0);

-- Indexes
create index jobs_org_idx     on jobs (organization_id);
create index jobs_status_idx  on jobs (organization_id, status);
create index jobs_slug_idx    on jobs (organization_id, slug);

-- Full-text search on title + description
create index jobs_fts_idx on jobs
  using gin (to_tsvector('english', title || ' ' || description));

-- Auto-update updated_at
create trigger jobs_updated_at
  before update on jobs
  for each row execute function set_updated_at();

-- RLS
alter table jobs enable row level security;
