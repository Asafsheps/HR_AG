-- ==================================================
-- Migration 007: Assignments
-- ==================================================
-- A home assignment sent to a candidate after the
-- WhatsApp interview. AI generates the assignment,
-- candidate submits, AI evaluates.
-- ==================================================

create table assignments (
  id               uuid primary key default uuid_generate_v4(),
  job_id           uuid not null references jobs on delete cascade,
  candidate_id     uuid not null unique references candidates on delete cascade,
  organization_id  uuid not null references organizations on delete cascade,

  -- Assignment content (AI-generated or recruiter-written)
  title            text not null,
  description      text not null,
  instructions     text not null,
  deadline_hours   integer not null default 72 check (deadline_hours > 0),

  -- Lifecycle
  status           assignment_status not null default 'pending',

  -- Submission
  submission_url   text,      -- link submitted by candidate
  submission_text  text,      -- text response submitted by candidate

  -- AI evaluation result
  ai_evaluation    jsonb,     -- AssignmentEvaluation: score, summary, strengths, weaknesses, recommendation

  -- Timestamps
  sent_at          timestamptz,
  submitted_at     timestamptz,
  created_at       timestamptz not null default now()
);

-- Indexes
create index assignments_org_idx       on assignments (organization_id);
create index assignments_candidate_idx on assignments (candidate_id);
create index assignments_status_idx    on assignments (organization_id, status);

-- RLS
alter table assignments enable row level security;
