-- ==================================================
-- Migration 008: AI Usage Logs & Audit Logs
-- ==================================================
-- ai_usage_logs: tracks every AI API call for cost monitoring.
-- audit_logs: tracks every meaningful recruiter action for
--   compliance and debugging.
-- Both tables are append-only — no updates, no deletes.
-- ==================================================

-- --------------------------------------------------
-- AI Usage Logs
-- --------------------------------------------------
create table ai_usage_logs (
  id               uuid primary key default uuid_generate_v4(),
  organization_id  uuid not null references organizations on delete cascade,

  -- What triggered this call
  feature          text not null,   -- 'whatsapp_interview' | 'cv_parser' | 'scorer' | 'jd_generator' | 'assignment_generator'
  prompt_version   text not null default 'v1',

  -- Provider details
  provider         text not null,   -- 'anthropic' | 'openai' | 'openrouter'
  model            text not null,

  -- Token usage
  input_tokens     integer not null default 0,
  output_tokens    integer not null default 0,

  -- Optional context references
  candidate_id     uuid references candidates on delete set null,
  job_id           uuid references jobs on delete set null,

  created_at       timestamptz not null default now()
);

-- Indexes — primarily for cost dashboards (Phase 11)
create index ai_usage_logs_org_idx       on ai_usage_logs (organization_id, created_at desc);
create index ai_usage_logs_feature_idx   on ai_usage_logs (organization_id, feature);
create index ai_usage_logs_candidate_idx on ai_usage_logs (candidate_id) where candidate_id is not null;

-- RLS
alter table ai_usage_logs enable row level security;


-- --------------------------------------------------
-- Audit Logs
-- --------------------------------------------------
create table audit_logs (
  id               uuid primary key default uuid_generate_v4(),
  organization_id  uuid not null references organizations on delete cascade,

  -- Who did it
  actor_id         uuid references recruiter_profiles on delete set null,

  -- What happened
  action           text not null,        -- e.g. 'candidate.status_changed', 'ai.takeover_activated'
  resource_type    text not null,        -- 'candidate' | 'job' | 'assignment' | 'conversation'
  resource_id      uuid,

  -- Extra context
  metadata         jsonb not null default '{}',   -- before/after values, reason, etc.

  created_at       timestamptz not null default now()
);

-- Indexes
create index audit_logs_org_idx      on audit_logs (organization_id, created_at desc);
create index audit_logs_actor_idx    on audit_logs (actor_id) where actor_id is not null;
create index audit_logs_resource_idx on audit_logs (resource_type, resource_id);

-- RLS
alter table audit_logs enable row level security;
