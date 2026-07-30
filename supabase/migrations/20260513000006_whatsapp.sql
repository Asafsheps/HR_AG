-- ==================================================
-- Migration 006: WhatsApp Messages & Conversation Contexts
-- ==================================================
-- whatsapp_messages: full message history per candidate.
-- conversation_contexts: AI agent state — which question
--   we're on, whether the interview is complete, etc.
-- ==================================================

-- --------------------------------------------------
-- WhatsApp Messages
-- --------------------------------------------------
create table whatsapp_messages (
  id                   uuid primary key default uuid_generate_v4(),
  candidate_id         uuid not null references candidates on delete cascade,
  organization_id      uuid not null references organizations on delete cascade,

  direction            message_direction not null,
  sender               message_sender not null,
  content              text not null default '',
  media_url            text,                       -- inbound image/document URL
  whatsapp_message_id  text,                       -- provider message SID/ID (for dedup)

  sent_at              timestamptz not null default now()
);

-- Dedup incoming messages by provider message ID
create unique index whatsapp_messages_provider_id_idx
  on whatsapp_messages (whatsapp_message_id)
  where whatsapp_message_id is not null;

-- Indexes
create index whatsapp_messages_candidate_idx on whatsapp_messages (candidate_id, sent_at desc);
create index whatsapp_messages_org_idx       on whatsapp_messages (organization_id);

-- RLS
alter table whatsapp_messages enable row level security;


-- --------------------------------------------------
-- Conversation Contexts
-- --------------------------------------------------
-- One row per candidate — tracks the AI agent's state
-- during the WhatsApp interview.
create table conversation_contexts (
  id                      uuid primary key default uuid_generate_v4(),
  candidate_id            uuid not null unique references candidates on delete cascade,
  organization_id         uuid not null references organizations on delete cascade,

  current_question_index  integer not null default 0,
  is_complete             boolean not null default false,
  metadata                jsonb not null default '{}',   -- arbitrary agent state

  updated_at              timestamptz not null default now()
);

-- Index
create index conversation_contexts_org_idx on conversation_contexts (organization_id);

-- Auto-update updated_at
create trigger conversation_contexts_updated_at
  before update on conversation_contexts
  for each row execute function set_updated_at();

-- RLS
alter table conversation_contexts enable row level security;
