-- ==================================================
-- Migration 015: Client Companies & Client Jobs
-- ==================================================
-- The structure Asaf asked for: companies -> jobs -> candidates.
--
-- A "client company" here is a firm that pays a referral bonus for a
-- candidate who gets hired. This is not the multi-tenant `organizations`
-- table — these companies are DATA, not tenants. They have no login.
--
-- Two URLs matter per company and they are not the same page:
--   careers_url  — where the jobs are listed (yaelgroup.com/jobs/)
--   submission   — how a candidate is sent (email / web form)
-- Confusing the two was the original misunderstanding; see
-- _SHARED/PARTNER_PROGRAMS.md.
-- ==================================================


create type submission_method as enum ('email', 'web_form', 'portal', 'manual');
create type client_job_status as enum ('open', 'paused', 'filled', 'expired');


-- --------------------------------------------------
-- CLIENT COMPANIES
-- --------------------------------------------------
create table client_companies (
  id               uuid primary key default uuid_generate_v4(),
  organization_id  uuid not null references organizations on delete cascade,

  name             text not null,
  slug             text not null,
  website          text,

  -- Where the open positions are listed. Not the referral page.
  careers_url      text,

  -- How a candidate is submitted. Differs per company: Yael Soft takes
  -- email, Koren Tec a web form, Adam Total a form plus a separate
  -- referrer link.
  submission_method submission_method not null default 'manual',
  submission_config jsonb not null default '{}',
      -- email:    { to, cc, subject_template, required_fields[] }
      -- web_form: { url, notes }

  -- Bonus terms as published. Amounts and delays are recorded because
  -- they drive cash flow: payment lands months after the hire.
  bonus_amount_ils    integer,
  bonus_delay_months  smallint,   -- months of employment before payout
  bonus_notes         text,

  status           text not null default 'active',   -- active | paused | ended
  contact_name     text,
  contact_email    text,
  notes            text,

  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  unique (organization_id, slug)
);

create index client_companies_org_idx on client_companies (organization_id);

create trigger client_companies_updated_at
  before update on client_companies
  for each row execute function set_updated_at();


-- --------------------------------------------------
-- CLIENT JOBS
-- --------------------------------------------------
-- A position at a client company that we are sourcing for.
--
-- Ingestion is user-initiated: Asaf pastes a job URL or the job text and
-- the AI extracts structure. Deliberately not a crawler — a single
-- request to SoftwareOne's careers page already returned 429, and being
-- rate-limited by a business partner is worse than being slow.
create table client_jobs (
  id                 uuid primary key default uuid_generate_v4(),
  organization_id    uuid not null references organizations on delete cascade,
  client_company_id  uuid not null references client_companies on delete cascade,
  agent_profile_id   uuid references agent_profiles on delete set null,

  -- Identity at the source
  external_ref       text,          -- the company's own job number, e.g. "25395"
  source_url         text,          -- the job's detail page

  title              text not null,
  location           text,
  employment_type    text,
  description        text not null default '',

  -- ── AI-extracted screening criteria ──────────────────────────────
  -- Extracted from the posting, then edited by Asaf. Stored separately
  -- from `description` so the raw posting stays intact for reference
  -- while the criteria evolve.
  core_skills        text[] not null default '{}',   -- must have
  nice_to_have       text[] not null default '{}',
  min_years          smallint,
  business_priority  text,        -- what likely matters most to the employer
  candidate_expectations text,    -- what the candidate must accept to fit
  screening_notes    text,        -- Asaf's own emphases

  extracted_at       timestamptz,
  extraction_model   text,        -- which model produced the criteria
  is_reviewed        boolean not null default false,   -- Asaf approved it

  salary_range       jsonb,
  status             client_job_status not null default 'open',

  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index client_jobs_org_idx     on client_jobs (organization_id);
create index client_jobs_company_idx on client_jobs (client_company_id);
create index client_jobs_status_idx  on client_jobs (organization_id, status);

-- The same posting must not be imported twice.
create unique index client_jobs_external_ref_idx
  on client_jobs (client_company_id, external_ref)
  where external_ref is not null;

create index client_jobs_fts_idx on client_jobs
  using gin (to_tsvector('simple', title || ' ' || description));

create trigger client_jobs_updated_at
  before update on client_jobs
  for each row execute function set_updated_at();


-- --------------------------------------------------
-- Wire campaigns to client jobs
-- --------------------------------------------------
-- Migration 014 pointed campaigns at the internal `jobs` table because
-- client_jobs did not exist yet. Both are allowed now; exactly one must
-- be set, so a campaign always has a single unambiguous target.
alter table campaigns
  alter column job_id drop not null,
  add column client_job_id uuid references client_jobs on delete cascade;

alter table campaigns
  add constraint campaigns_one_target
  check (num_nonnulls(job_id, client_job_id) = 1);

create index campaigns_client_job_idx on campaigns (client_job_id);


-- --------------------------------------------------
-- RLS
-- --------------------------------------------------
alter table client_companies enable row level security;
alter table client_jobs      enable row level security;

create policy "client_companies_org_select"
  on client_companies for select to authenticated
  using (organization_id = get_current_org_id());

create policy "client_companies_recruiter_write"
  on client_companies for all to authenticated
  using (
    organization_id = get_current_org_id()
    and get_current_user_role() in ('super_admin', 'admin', 'recruiter')
  );

create policy "client_jobs_org_select"
  on client_jobs for select to authenticated
  using (organization_id = get_current_org_id());

create policy "client_jobs_recruiter_write"
  on client_jobs for all to authenticated
  using (
    organization_id = get_current_org_id()
    and get_current_user_role() in ('super_admin', 'admin', 'recruiter')
  );

-- Note: client_jobs is deliberately NOT readable by anon. The public
-- landing page reads through campaigns, which exposes only the fields a
-- candidate needs — never the bonus terms or the screening criteria.
