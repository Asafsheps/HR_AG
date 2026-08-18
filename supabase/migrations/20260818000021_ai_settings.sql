-- ==================================================
-- Migration 021: Per-organization AI settings
-- ==================================================
-- Which provider/model runs the interview and which runs the scoring,
-- switchable from the Settings screen with no redeploy. A row here
-- OVERRIDES the environment defaults (AI_INTERVIEW_* / AI_SCORING_*);
-- no row means the env values apply — a fresh org needs no setup.

create table ai_settings (
  organization_id    uuid primary key references organizations on delete cascade,

  default_provider   text,
  interview_provider text,
  interview_model    text,
  scoring_provider   text,
  scoring_model      text,

  updated_at         timestamptz not null default now()
);

alter table ai_settings enable row level security;

create policy "ai_settings_org_select"
  on ai_settings for select to authenticated
  using (organization_id = get_current_org_id());

-- Model choice is a cost and quality decision — admins only.
create policy "ai_settings_admin_write"
  on ai_settings for all to authenticated
  using (
    organization_id = get_current_org_id()
    and get_current_user_role() in ('super_admin', 'admin')
  );
