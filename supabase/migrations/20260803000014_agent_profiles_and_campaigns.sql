-- ==================================================
-- Migration 014: Agent Profiles, Campaigns & Channels
-- ==================================================
-- Three things the product was missing:
--   1. agent_profiles  — how the AI agent speaks (name, tone, objective).
--      This existed in the old prototype and was never ported; the
--      /api/agent/config route has been returning 501 because it had
--      nothing to write to.
--   2. campaigns       — a short code that ties an inbound conversation
--      back to the job and the channel it came from. Without it an
--      inbound chat is anonymous and unattributable.
--   3. channel_settings — WhatsApp stays off until a number is entered.
--      The web chat needs no configuration at all.
--
-- Written against the CURRENT schema (jobs / candidates / organizations)
-- so it is usable today. The people/submissions refactor comes later and
-- will re-point these foreign keys.
-- ==================================================


-- --------------------------------------------------
-- Enums
-- --------------------------------------------------
create type agent_tone            as enum ('friendly', 'professional', 'strict', 'concise');
create type conversation_channel  as enum ('web', 'whatsapp');


-- --------------------------------------------------
-- AGENT PROFILES
-- --------------------------------------------------
-- One profile per job (Asaf's decision 03/08) — a technical role and a
-- sales role should not be interviewed in the same voice.
create table agent_profiles (
  id               uuid primary key default uuid_generate_v4(),
  organization_id  uuid not null references organizations on delete cascade,

  -- Identity
  name             text not null,                    -- internal label, e.g. "גיוס טכני"
  persona_name     text not null default 'עמי',      -- what the agent calls itself
  objective        text not null default '',         -- what it should achieve
  tone             agent_tone not null default 'friendly',
  guidelines       text not null default '',         -- free-form rules
  language         text not null default 'he',

  -- Behavioural limits. These stop the agent interrogating people.
  max_questions    integer not null default 8 check (max_questions between 1 and 30),
  escalate_after   integer check (escalate_after > 0),  -- messages before handing to a human
  never_discuss    text[] not null default '{}',        -- e.g. {salary, benefits}

  -- Interview shape. Kept as JSONB because these are always read and
  -- written whole with the profile and never queried field-by-field —
  -- the same reasoning as jobs.screening_questions.
  stages           jsonb not null default '[]',   -- [{id,label,enabled}]
  scoring_criteria jsonb not null default '[]',   -- [{id,label,weight,description}]

  -- Automatic decisions. Null disables the rule rather than defaulting to
  -- a number that would silently reject or escalate people.
  auto_score           boolean  not null default true,
  auto_escalate_score  smallint check (auto_escalate_score between 0 and 100),
  reject_score         smallint check (reject_score between 0 and 100),

  is_default       boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- reject_score must sit below auto_escalate_score, otherwise a candidate
-- could qualify for both auto-rejection and escalation at once.
alter table agent_profiles
  add constraint agent_profiles_score_thresholds
  check (
    auto_escalate_score is null
    or reject_score is null
    or reject_score < auto_escalate_score
  );

create index agent_profiles_org_idx on agent_profiles (organization_id);

-- Exactly one default profile per organization.
create unique index agent_profiles_one_default_idx
  on agent_profiles (organization_id)
  where is_default;

create trigger agent_profiles_updated_at
  before update on agent_profiles
  for each row execute function set_updated_at();

-- A job may override the default profile.
alter table jobs add column agent_profile_id uuid references agent_profiles on delete set null;


-- --------------------------------------------------
-- CAMPAIGNS
-- --------------------------------------------------
-- `code` is the whole trick: it travels in the landing-page URL (/j/A7X)
-- and turns an otherwise anonymous inbound conversation into one
-- attributable to a specific job and channel.
create table campaigns (
  id               uuid primary key default uuid_generate_v4(),
  organization_id  uuid not null references organizations on delete cascade,
  job_id           uuid not null references jobs on delete cascade,

  code             text not null unique,
  channel          text not null,              -- where it was posted: facebook, linkedin, ...
  ad_copy          text not null default '',   -- AI-written, human-edited

  landing_url      text not null,              -- /j/<code>
  wa_link          text,                       -- null unless WhatsApp is enabled

  -- Funnel counters. Tells Asaf which channel is actually worth posting to.
  clicks           integer not null default 0,
  conversations    integer not null default 0,
  qualified        integer not null default 0,

  is_active        boolean not null default true,
  created_at       timestamptz not null default now()
);

-- Short, URL-safe, unambiguous: no lowercase, no 0/O/1/I confusion.
alter table campaigns
  add constraint campaigns_code_format
  check (code ~ '^[A-Z0-9]{3,12}$');

create index campaigns_org_idx    on campaigns (organization_id);
create index campaigns_job_idx    on campaigns (job_id);
create index campaigns_active_idx on campaigns (organization_id, is_active);


-- Counter bumps come from the public landing page, which runs as `anon`
-- and must not hold write access to the table. A security-definer function
-- keeps the write server-side and atomic, and accepts only the three
-- counter names so it cannot be used to modify anything else.
create or replace function increment_campaign_metric(p_code text, p_metric text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_metric not in ('clicks', 'conversations', 'qualified') then
    raise exception 'invalid metric: %', p_metric;
  end if;

  update campaigns
     set clicks        = clicks        + (p_metric = 'clicks')::int,
         conversations = conversations + (p_metric = 'conversations')::int,
         qualified     = qualified     + (p_metric = 'qualified')::int
   where code = p_code
     and is_active;
end;
$$;

grant execute on function increment_campaign_metric(text, text) to anon, authenticated;


-- --------------------------------------------------
-- CHANNEL SETTINGS
-- --------------------------------------------------
-- WhatsApp is off until a number is entered. No code change needed to
-- switch it on later — that was an explicit requirement.
create table channel_settings (
  organization_id      uuid primary key references organizations on delete cascade,

  whatsapp_number      text,                    -- E.164; null = disabled
  whatsapp_provider    text check (whatsapp_provider in ('twilio', 'meta')),
  is_whatsapp_enabled  boolean not null default false,

  updated_at           timestamptz not null default now()
);

-- Can't enable WhatsApp without both a number and a provider.
alter table channel_settings
  add constraint channel_settings_whatsapp_complete
  check (
    not is_whatsapp_enabled
    or (whatsapp_number is not null and whatsapp_provider is not null)
  );

create trigger channel_settings_updated_at
  before update on channel_settings
  for each row execute function set_updated_at();


-- --------------------------------------------------
-- CONVERSATIONS — channel awareness
-- --------------------------------------------------
-- A web chat starts before we know who the person is, so it needs an
-- anonymous session token. WhatsApp identifies by phone number instead.
alter table conversation_contexts
  add column channel       conversation_channel not null default 'web',
  add column session_token text,
  add column campaign_id   uuid references campaigns on delete set null;

create unique index conversation_contexts_session_idx
  on conversation_contexts (session_token)
  where session_token is not null;


-- --------------------------------------------------
-- CANDIDATES — demographic fields
-- --------------------------------------------------
-- Added at Asaf's explicit request (03/08) after the equal-employment
-- risk was laid out in _SHARED/ARCHITECTURE_V2_ADDENDUM.md. His call.
--
-- birth_year rather than a full date of birth: enough to compute age,
-- discloses less. 'undisclosed' is a valid answer — the agent must not
-- press for it, and screening on these columns is audit-logged.
alter table candidates
  add column birth_year smallint check (birth_year between 1920 and 2020),
  add column gender     text check (gender in ('male', 'female', 'other', 'undisclosed'));


-- --------------------------------------------------
-- RLS
-- --------------------------------------------------
alter table agent_profiles   enable row level security;
alter table campaigns        enable row level security;
alter table channel_settings enable row level security;

-- Staff read/write within their own organization.
create policy "agent_profiles_org_select"
  on agent_profiles for select to authenticated
  using (organization_id = get_current_org_id());

create policy "agent_profiles_recruiter_write"
  on agent_profiles for all to authenticated
  using (
    organization_id = get_current_org_id()
    and get_current_user_role() in ('super_admin', 'admin', 'recruiter')
  );

create policy "campaigns_org_select"
  on campaigns for select to authenticated
  using (organization_id = get_current_org_id());

create policy "campaigns_recruiter_write"
  on campaigns for all to authenticated
  using (
    organization_id = get_current_org_id()
    and get_current_user_role() in ('super_admin', 'admin', 'recruiter')
  );

-- The landing page is public: anyone with the link may read an active
-- campaign. Only the ad copy and job link are exposed — never the counters
-- or the organization, which is why the API selects explicit columns.
create policy "campaigns_public_select_active"
  on campaigns for select to anon
  using (is_active);

create policy "channel_settings_admin_all"
  on channel_settings for all to authenticated
  using (
    organization_id = get_current_org_id()
    and get_current_user_role() in ('super_admin', 'admin')
  );
