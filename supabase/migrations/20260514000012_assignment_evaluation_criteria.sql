-- ==================================================
-- Migration 012: Assignment — evaluation_criteria column (Phase 9)
-- ==================================================
alter table assignments
  add column evaluation_criteria  jsonb not null default '[]',
  add column submission_metadata  jsonb not null default '{}';
-- submission_metadata: { ip, user_agent, time_taken_minutes, flagged_fast_submission }
