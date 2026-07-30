-- ==================================================
-- Migration 003: Recruiter Profiles
-- ==================================================
-- Extends Supabase auth.users with recruiter-specific
-- data. Created automatically after user signs up
-- via the handle_new_user trigger.
-- ==================================================

create table recruiter_profiles (
  id               uuid primary key references auth.users on delete cascade,
  organization_id  uuid not null references organizations on delete cascade,
  full_name        text not null,
  avatar_url       text,
  role             user_role not null default 'recruiter',
  is_active        boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- Indexes
create index recruiter_profiles_org_idx  on recruiter_profiles (organization_id);
create index recruiter_profiles_role_idx on recruiter_profiles (organization_id, role);

-- Auto-update updated_at
create trigger recruiter_profiles_updated_at
  before update on recruiter_profiles
  for each row execute function set_updated_at();

-- RLS
alter table recruiter_profiles enable row level security;

-- ==================================================
-- Helper: get the organization_id of the current user
-- Used by all other RLS policies.
-- ==================================================
create or replace function get_current_org_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select organization_id
  from   recruiter_profiles
  where  id = auth.uid()
  limit  1;
$$;

-- ==================================================
-- Helper: get the role of the current user
-- ==================================================
create or replace function get_current_user_role()
returns user_role
language sql
stable
security definer
set search_path = public
as $$
  select role
  from   recruiter_profiles
  where  id = auth.uid()
  limit  1;
$$;

-- ==================================================
-- Trigger: auto-create recruiter_profile on signup
-- ==================================================
-- Reads organization_id from raw_user_meta_data,
-- which must be passed during sign-up.
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into recruiter_profiles (id, organization_id, full_name, avatar_url, role)
  values (
    new.id,
    (new.raw_user_meta_data->>'organization_id')::uuid,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    new.raw_user_meta_data->>'avatar_url',
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'recruiter')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
