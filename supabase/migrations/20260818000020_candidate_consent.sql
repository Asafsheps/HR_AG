-- ==================================================
-- Migration 020: Candidate consent
-- ==================================================
-- The business model forwards a candidate's CV to the hiring company, and
-- that transfer needs the candidate's explicit, recorded consent — not a
-- passive footnote. The landing form now has a required checkbox; these
-- columns record when it was ticked and which text version was shown.
--
-- consent_version matters because the wording will change: knowing WHAT a
-- candidate agreed to requires knowing which text they saw.

alter table candidates
  add column if not exists consent_at      timestamptz,
  add column if not exists consent_version text;

comment on column candidates.consent_at      is 'When the candidate ticked the consent checkbox on the landing form';
comment on column candidates.consent_version is 'Version tag of the consent text shown (e.g. v1-2026-08)';
