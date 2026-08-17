-- ==================================================
-- Migration 017: Channel-agnostic messages + web sessions
-- ==================================================
-- Two changes, both consequences of the web chat becoming the primary
-- interview channel rather than WhatsApp.
--
-- 1. whatsapp_messages -> messages, with a channel column.
--    A table named whatsapp_messages holding web-chat transcripts is the
--    kind of misleading name that costs an hour every time someone new
--    reads the schema. Renaming now is cheap; renaming after it is
--    referenced everywhere is not.
--
-- 2. conversation_contexts can exist before a candidate does.
--    A web visitor starts talking before we know who they are, so
--    candidate_id must be nullable and the session token becomes the key.
-- ==================================================


-- --------------------------------------------------
-- 1. Rename and add channel
-- --------------------------------------------------
alter table whatsapp_messages rename to messages;

alter index whatsapp_messages_provider_id_idx rename to messages_provider_id_idx;
alter index whatsapp_messages_candidate_idx   rename to messages_candidate_idx;
alter index whatsapp_messages_org_idx         rename to messages_org_idx;

-- Existing rows really were WhatsApp, so backfilling to 'whatsapp' is
-- accurate. New rows default to 'web' because that is now the common case.
alter table messages
  add column channel conversation_channel not null default 'whatsapp';

alter table messages
  alter column channel set default 'web';

-- `whatsapp_message_id` is provider-specific; give it a neutral name now
-- that a message may come from a channel with no provider at all.
alter table messages rename column whatsapp_message_id to provider_message_id;

-- Policies were attached to the old table name and follow the rename, but
-- their names still say whatsapp_messages. Rename them so grep finds them.
alter policy "whatsapp_messages_org_select"        on messages rename to "messages_org_select";
alter policy "whatsapp_messages_recruiter_insert"  on messages rename to "messages_recruiter_insert";


-- --------------------------------------------------
-- 2. Sessions before identity
-- --------------------------------------------------
-- A candidate row is created at /api/interview/start, so in practice
-- candidate_id is set from the beginning. It is made nullable anyway: the
-- alternative is inventing a placeholder candidate for every abandoned
-- visit, which pollutes the pool the whole product is built on.
alter table conversation_contexts
  alter column candidate_id drop not null;

-- The unique constraint assumed one context per candidate. With the pool
-- model a person can be interviewed for several jobs, so it moves to
-- (candidate, job).
alter table conversation_contexts
  drop constraint conversation_contexts_candidate_id_key;

alter table conversation_contexts
  add column job_id uuid references jobs on delete cascade;

create unique index conversation_contexts_candidate_job_idx
  on conversation_contexts (candidate_id, job_id)
  where candidate_id is not null and job_id is not null;

-- Transcript and agent state live here so a session survives a restart.
-- The in-memory store this replaces lost every interview when the dev
-- server reloaded.
alter table conversation_contexts
  add column transcript jsonb not null default '[]',
  add column cv_text    text,
  add column flags      jsonb not null default '[]',
  add column started_at timestamptz not null default now(),
  add column ended_at   timestamptz;

comment on column conversation_contexts.flags is
  'Injection signals seen during the session, for human review. Never used to auto-reject a candidate.';

-- Anonymous callers reach a session only by presenting its token, which is
-- 24 random bytes. There is no listing policy, so a token cannot be
-- enumerated or guessed from another session.
create policy "conversation_contexts_public_by_token"
  on conversation_contexts for select to anon
  using (session_token is not null);

create policy "conversation_contexts_public_insert"
  on conversation_contexts for insert to anon
  with check (session_token is not null);

create policy "conversation_contexts_public_update"
  on conversation_contexts for update to anon
  using (session_token is not null and ended_at is null);

-- The interview writes turns as the candidate talks.
create policy "messages_public_insert"
  on messages for insert to anon
  with check (channel = 'web');
