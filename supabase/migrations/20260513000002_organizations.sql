-- ==================================================
-- Migration 002: Organizations
-- ==================================================
-- Tenant table. Every piece of data in the platform
-- is scoped to an organization via organization_id.
-- One organization = one company using the platform.
-- ==================================================

create table organizations (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  slug        text not null unique,            -- URL-safe identifier, e.g. "acme-corp"
  logo_url    text,
  plan        text not null default 'free',    -- billing plan (for future use)
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Enforce slug format: lowercase, alphanumeric + hyphens only
alter table organizations
  add constraint organizations_slug_format
  check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$');

-- Indexes
create index organizations_slug_idx on organizations (slug);

-- Auto-update updated_at on any row change
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger organizations_updated_at
  before update on organizations
  for each row execute function set_updated_at();

-- RLS: enabled — policies defined in migration 009
alter table organizations enable row level security;
