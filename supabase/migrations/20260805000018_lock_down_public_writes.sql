-- ==================================================
-- Migration 018: Remove public write access
-- ==================================================
-- Migrations 016 and 017 gave the anon role INSERT on candidates,
-- conversation_contexts and messages so the landing page could work. That
-- is more trust than the public needs.
--
-- Supabase exposes PostgREST directly, so an anon INSERT grant is not
-- "the landing page may write" — it is "anyone on the internet may POST
-- to /rest/v1/candidates". That path skips the API route entirely, and
-- with it the rate limiting, the validation, and the CV sanitising. The
-- candidate pool is the asset this whole product is built on; letting
-- strangers append to it directly is not a risk worth carrying for
-- convenience.
--
-- The interview endpoints run server-side and already hold the service
-- role key, which bypasses RLS by design. So the public needs no write
-- access at all: reads stay open where a policy allows them, and every
-- write goes through our own validated code.
-- ==================================================

-- ── Revoke the writes ───────────────────────────────────────────────────
revoke insert on candidates            from anon;
revoke insert, update on conversation_contexts from anon;
revoke insert on messages              from anon;

drop policy if exists "candidates_public_insert"              on candidates;
drop policy if exists "conversation_contexts_public_insert"   on conversation_contexts;
drop policy if exists "conversation_contexts_public_update"   on conversation_contexts;
drop policy if exists "messages_public_insert"                on messages;

-- ── And the reads that were never needed ────────────────────────────────
-- The interview transcript is served by our API from the session token, so
-- anon has no reason to read conversation_contexts directly. Leaving the
-- policy in place would let anyone with a token enumerate columns we never
-- meant to expose, including cv_text.
drop policy if exists "conversation_contexts_public_by_token" on conversation_contexts;

revoke select on conversation_contexts from anon;
revoke select on candidates            from anon;
revoke select on messages              from anon;

-- ── What the public may still read ──────────────────────────────────────
-- Only the two things a candidate genuinely needs before applying: the
-- campaign they clicked and the job behind it. Both are already filtered
-- to active rows by their existing policies.
--
-- Everything else in the schema is now unreachable without a session,
-- and every write is unreachable without the service role.

comment on table candidates is
  'Written only via server-side routes holding the service role. Public INSERT was removed in migration 018 -- PostgREST would otherwise accept direct writes that bypass rate limiting and CV sanitising.';
