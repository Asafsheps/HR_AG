-- ==================================================
-- Migration 019: Multi-dimensional candidate scores
-- ==================================================
-- Replaces the single candidates.ai_score with a breakdown, because one
-- number cannot be argued with or improved. A recruiter needs to know
-- WHY a candidate scored 82, and a prompt can only be tuned against
-- reasoning, not against a bare integer.
--
-- Scores are written by a scoring pass that runs over the finished
-- transcript. The interviewing agent never produces them and never sees
-- them: the candidate is in the interviewer's context and could otherwise
-- talk their way to a high score. See _SHARED/ARCHITECTURE_V2_ADDENDUM.md.
--
-- One row per candidate. candidates already carries job_id, so a candidate
-- row is a (person, job) pair — the person-level pool comes later with the
-- people/submissions split.
-- ==================================================

create table candidate_scores (
  id               uuid primary key default uuid_generate_v4(),
  candidate_id     uuid not null unique references candidates on delete cascade,
  organization_id  uuid not null references organizations on delete cascade,
  job_id           uuid not null references jobs on delete cascade,

  overall          smallint not null check (overall between 0 and 100),

  -- ── Dimensions ─────────────────────────────────────────────────────
  -- All job-related. These are what actually predict fit, and each one is
  -- something the interview can probe for evidence of.
  tools_match      smallint check (tools_match     between 0 and 100),
  domain_match     smallint check (domain_match    between 0 and 100),
  seniority_match  smallint check (seniority_match between 0 and 100),
  communication    smallint check (communication   between 0 and 100),
  confidence       smallint check (confidence      between 0 and 100),
  motivation       smallint check (motivation      between 0 and 100),

  -- ── Evidence ───────────────────────────────────────────────────────
  -- NOT NULL on purpose. A score without reasoning cannot be challenged by
  -- the recruiter or used to improve the prompt, so the scorer is required
  -- to justify every dimension it fills in.
  reasoning        jsonb not null,
    -- { tools_match: {score, why, evidence[]}, ... }

  summary          text not null default '',
  strengths        text[] not null default '{}',
  concerns         text[] not null default '{}',

  -- How much of the picture is actually supported by the conversation.
  -- A candidate who gave one-word answers should not look confidently
  -- mediocre; they should look unmeasured.
  evidence_quality text not null default 'partial'
    check (evidence_quality in ('strong', 'partial', 'thin')),

  -- ── Provenance ─────────────────────────────────────────────────────
  -- Which model produced this, so scores from different models are not
  -- silently compared as if they were the same measurement.
  model            text not null,
  provider         text not null,
  prompt_version   text not null default 'v1',
  scored_at        timestamptz not null default now()
);

create index candidate_scores_org_idx     on candidate_scores (organization_id);
create index candidate_scores_job_idx     on candidate_scores (job_id, overall desc);
create index candidate_scores_overall_idx on candidate_scores (organization_id, overall desc);

alter table candidate_scores enable row level security;

create policy "candidate_scores_org_select"
  on candidate_scores for select to authenticated
  using (organization_id = get_current_org_id());

create policy "candidate_scores_recruiter_write"
  on candidate_scores for all to authenticated
  using (
    organization_id = get_current_org_id()
    and get_current_user_role() in ('super_admin', 'admin', 'recruiter')
  );

-- Never public: a candidate must not be able to read their own score, and
-- showing a ranking to the person being ranked invites gaming it.


-- --------------------------------------------------
-- Ranked view for the candidates screen
-- --------------------------------------------------
-- A view rather than a query repeated in five places. security_invoker
-- makes it run as the caller, so the RLS policies above still apply —
-- without it a view silently bypasses row security.
create view candidate_rankings
with (security_invoker = true)
as
select
  c.id                     as candidate_id,
  c.organization_id,
  c.job_id,
  c.full_name,
  c.email,
  c.phone,
  c.status,
  c.cv_url,
  c.birth_year,
  c.gender,
  c.applied_at,
  j.title                  as job_title,
  s.overall,
  s.tools_match,
  s.domain_match,
  s.seniority_match,
  s.communication,
  s.confidence,
  s.motivation,
  s.summary,
  s.strengths,
  s.concerns,
  s.evidence_quality,
  s.scored_at,
  -- Age is derived, never stored: a stored age is wrong within a year.
  case when c.birth_year is not null
       then extract(year from now())::int - c.birth_year
  end                      as age,
  ctx.ended_at is not null as interview_complete,
  coalesce(jsonb_array_length(ctx.transcript), 0) as turn_count,
  -- Surfaced so a flagged session gets a human look rather than being
  -- quietly trusted or quietly dropped.
  coalesce(jsonb_array_length(ctx.flags), 0)      as flag_count
from candidates c
join jobs j                     on j.id = c.job_id
left join candidate_scores s    on s.candidate_id = c.id
left join conversation_contexts ctx on ctx.candidate_id = c.id;

comment on view candidate_rankings is
  'Recruiter-facing candidate list with scores. security_invoker keeps RLS in force.';
