-- ==================================================
-- Migration 011: Candidate Application Fields (Phase 6)
-- ==================================================
-- Add fields captured during public job application:
--   linkedin_url, portfolio_url, cover_letter,
--   whatsapp_consent, screening_answers (JSONB), source

alter table candidates
  add column linkedin_url       text,
  add column portfolio_url      text,
  add column cover_letter       text,
  add column whatsapp_consent   boolean not null default false,
  add column screening_answers  jsonb   not null default '{}',
  add column source             text    not null default 'direct_link';
